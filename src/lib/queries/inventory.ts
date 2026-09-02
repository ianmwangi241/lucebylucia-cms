import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// No per-variant threshold column exists yet — same hardcoded value used in products.ts.
// Consider centralizing this (e.g. a site_settings row) if you want it configurable.
const LOW_STOCK_THRESHOLD = 5;

// Orders in these statuses still hold stock against them (not yet fulfilled/cancelled).
// Adjust this list to match whatever status strings your checkout flow actually writes.
const UNFULFILLED_STATUSES = ["Pending", "Processing"];

export interface InventoryRow {
  variantId: string;
  productId: string;
  product: string;
  variant: string; // "Size / Color", best-effort from whichever of the two exist
  sku: string;
  image: string;
  stock: number;
  reserved: number;
  available: number;
  threshold: number;
}

export function useInventoryRows() {
  return useQuery({
    queryKey: ["inventory", "rows"],
    queryFn: async (): Promise<InventoryRow[]> => {
      const supabase = createClient();

      const [{ data: variants, error: vErr }, { data: reservedRows, error: rErr }] = await Promise.all([
        supabase
          .from("product_variants")
          .select(
            `id, sku, size, color, stock_quantity, product_id,
             products ( id, name, product_images ( storage_path, is_primary, sort_order ) )`,
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("order_items")
          .select("product_variant_id, quantity, orders!inner(status)")
          .in("orders.status", UNFULFILLED_STATUSES),
      ]);
      if (vErr) throw vErr;
      if (rErr) throw rErr;

      const reservedByVariant = new Map<string, number>();
      for (const r of reservedRows ?? []) {
        reservedByVariant.set(
          r.product_variant_id,
          (reservedByVariant.get(r.product_variant_id) ?? 0) + r.quantity,
        );
      }

      return (variants ?? []).map((v) => {
        const images = [...(v.products?.product_images ?? [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        const primary = images.find((i) => i.is_primary) ?? images[0];
        const reserved = reservedByVariant.get(v.id) ?? 0;
        return {
          variantId: v.id,
          productId: v.product_id,
          product: v.products?.name ?? "—",
          variant: [v.size, v.color].filter(Boolean).join(" / ") || "—",
          sku: v.sku,
          image: primary?.storage_path ?? "",
          stock: v.stock_quantity,
          reserved,
          available: v.stock_quantity - reserved,
          threshold: LOW_STOCK_THRESHOLD,
        };
      });
    },
  });
}

// ---- Adjustment log ----
// inventory_movements has no "previous"/"new" snapshot columns — only the signed
// delta (quantity). Reconstructing prev/new per row would mean replaying the full
// movement history per variant from scratch; left out here to keep this shippable.
// Add prev_stock/new_stock columns if you want that in the log going forward.

export interface Adjustment {
  id: string;
  sku: string;
  change: number;
  reason: string;
  user: string;
  at: string;
}

export function useRecentAdjustments() {
  return useQuery({
    queryKey: ["inventory", "adjustments"],
    queryFn: async (): Promise<Adjustment[]> => {
      const supabase = createClient();
      const { data: movements, error } = await supabase
        .from("inventory_movements")
        .select("id, quantity, notes, type, created_at, created_by, product_variants ( sku )")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      const userIds = [...new Set((movements ?? []).map((m) => m.created_by).filter(Boolean))];
      let namesById = new Map<string, string>();
      if (userIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        namesById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      }

      return (movements ?? []).map((a) => ({
        id: a.id,
        sku: a.product_variants?.sku ?? "—",
        change: a.quantity,
        reason: a.notes || a.type,
        user: namesById.get(a.created_by) ?? "—",
        at: a.created_at,
      }));
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { variantId: string; quantityChange: number; reason: string }) => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in to adjust stock");

      const { data: variant, error: vErr } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", input.variantId)
        .single();
      if (vErr) throw vErr;

      const newStock = variant.stock_quantity + input.quantityChange;

      const { error: updateErr } = await supabase
        .from("product_variants")
        .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq("id", input.variantId);
      if (updateErr) throw updateErr;

      const { error: insertErr } = await supabase.from("inventory_movements").insert({
        product_variant_id: input.variantId,
        quantity: input.quantityChange,
        type: "manual_adjustment",
        notes: input.reason,
        reference_type: "manual",
        reference_id: input.variantId,
        created_by: userId,
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
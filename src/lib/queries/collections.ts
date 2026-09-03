import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface CollectionAdmin {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover: string; // storage_path of the linked product_images row, run through assetUrl() in the component
  coverImageId: string | null; // collections.image_path — an FK into product_images.id
  active: boolean; // collections.is_active, shown in the UI as "Published/Draft"
  featured: boolean;
  productCount: number;
}

export function useCollectionsAdmin() {
  return useQuery({
    queryKey: ["collections", "admin-list"],
    queryFn: async (): Promise<CollectionAdmin[]> => {
      const supabase = createClient();
      const [{ data: cols, error: colErr }, { data: links, error: linkErr }] = await Promise.all([
        supabase.from("collections").select("*").order("sort_order", { ascending: true }),
        supabase.from("product_collections").select("collection_id"),
      ]);
      if (colErr) throw colErr;
      if (linkErr) throw linkErr;

      const counts = new Map<string, number>();
      for (const l of links ?? []) {
        counts.set(l.collection_id, (counts.get(l.collection_id) ?? 0) + 1);
      }

      const imageIds = (cols ?? []).map((c) => c.image_path).filter(Boolean);
      let imagesById = new Map<string, string>();
      if (imageIds.length) {
        const { data: images } = await supabase
          .from("product_images")
          .select("id, storage_path")
          .in("id", imageIds);
        imagesById = new Map((images ?? []).map((i) => [i.id, i.storage_path]));
      }

      return (cols ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        cover: imagesById.get(c.image_path) ?? "",
        coverImageId: c.image_path ?? null,
        active: !!c.is_active,
        featured: !!c.is_featured,
        productCount: counts.get(c.id) ?? 0,
      }));
    },
  });
}

export interface SaveCollectionInput {
  id?: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  featured: boolean;
  order: number;
  coverImageId: string | null;
  newCoverFile?: File;
}

export function useSaveCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: SaveCollectionInput): Promise<string> => {
      const supabase = createClient();
      const now = new Date().toISOString();

      let imagePath = form.coverImageId;
      if (form.newCoverFile) {
        const path = `${crypto.randomUUID()}-${form.newCoverFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(path, form.newCoverFile);
        if (uploadErr) throw uploadErr;
        // product_id is nullable — this row exists purely to back the collection's cover
        const { data: img, error: imgErr } = await supabase
          .from("product_images")
          .insert({ storage_path: path, product_id: null, alt_text: form.name })
          .select("id")
          .single();
        if (imgErr) throw imgErr;
        imagePath = img.id;
      }

      if (!imagePath) {
        throw new Error("A cover image is required");
      }

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        is_active: form.active,
        is_featured: form.featured,
        sort_order: form.order,
        image_path: imagePath,
      };

      if (form.id) {
        const { error } = await supabase.from("collections").update(payload).eq("id", form.id);
        if (error) throw error;
        return form.id;
      }
      const { data, error } = await supabase
        .from("collections")
        .insert({ ...payload, created_at: now })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      await supabase.from("product_collections").delete().eq("collection_id", id);
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });
}

// ---- Product assignment ----

export interface CollectionProductItem {
  id: string;
  name: string;
  image: string;
  price: number;
}

export function useCollectionProducts(collectionId: string | undefined) {
  return useQuery({
    queryKey: ["collections", "products", collectionId],
    enabled: !!collectionId,
    queryFn: async (): Promise<CollectionProductItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("product_collections")
        .select(
          `sort_order, products ( id, name, base_price, sale_price, product_images ( storage_path, is_primary, sort_order ) )`,
        )
        .eq("collection_id", collectionId as string)
        .order("sort_order", { ascending: true });
      if (error) throw error;

      return (data ?? [])
        .filter((r) => r.products)
        .map((r) => {
          const p = r.products!;
          const images = [...(p.product_images ?? [])].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
          const primary = images.find((i) => i.is_primary) ?? images[0];
          return {
            id: p.id,
            name: p.name,
            image: primary?.storage_path ?? "",
            price: p.sale_price ?? p.base_price,
          };
        });
    },
  });
}

export function useAllProductsPicker() {
  return useQuery({
    queryKey: ["products", "picker-list"],
    queryFn: async (): Promise<{ id: string; name: string }[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("products").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAssignProducts(collectionId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productIds: string[]) => {
      if (!collectionId) return;
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("product_collections")
        .select("product_id")
        .eq("collection_id", collectionId);
      const existingIds = new Set((existing ?? []).map((r) => r.product_id));
      const nextIds = new Set(productIds);

      const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
      const toAdd = productIds.filter((id) => !existingIds.has(id));

      if (toRemove.length) {
        await supabase
          .from("product_collections")
          .delete()
          .eq("collection_id", collectionId)
          .in("product_id", toRemove);
      }
      if (toAdd.length) {
        await supabase.from("product_collections").insert(
          toAdd.map((product_id, i) => ({
            collection_id: collectionId,
            product_id,
            sort_order: existingIds.size + i,
          })),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", "products", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections", "admin-list"] });
    },
  });
}
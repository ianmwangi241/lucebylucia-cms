import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string; // derived from their most recent order's delivery town/county — no location column on `customer`
  orders: number;
  spent: number;
  last: string | null;
  type: "Account" | "Guest"; // has a customer_auth row -> Account, otherwise Guest
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers", "list"],
    queryFn: async (): Promise<CustomerRow[]> => {
      const supabase = createClient();
      const [{ data: customers, error: cErr }, { data: authLinks }, { data: orders }] = await Promise.all([
        supabase.from("customer").select("id, name, email, phone").order("created_at", { ascending: false }),
        supabase.from("customer_auth").select("customer_id"),
        supabase.from("orders").select("customer_email, total, created_at, delivery_town, delivery_county"),
      ]);
      if (cErr) throw cErr;

      const accountIds = new Set((authLinks ?? []).map((a) => a.customer_id));

      const statsByEmail = new Map<string, { count: number; spent: number }>();
      const latestByEmail = new Map<string, { date: string; town: string; county: string }>();
      for (const o of orders ?? []) {
        const s = statsByEmail.get(o.customer_email) ?? { count: 0, spent: 0 };
        s.count += 1;
        s.spent += o.total;
        statsByEmail.set(o.customer_email, s);

        const l = latestByEmail.get(o.customer_email);
        if (!l || new Date(o.created_at) > new Date(l.date)) {
          latestByEmail.set(o.customer_email, { date: o.created_at, town: o.delivery_town, county: o.delivery_county });
        }
      }

      return (customers ?? []).map((c) => {
        const stats = statsByEmail.get(c.email);
        const latest = latestByEmail.get(c.email);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          location: latest ? [latest.town, latest.county].filter(Boolean).join(", ") : "—",
          orders: stats?.count ?? 0,
          spent: stats?.spent ?? 0,
          last: latest?.date ?? null,
          type: accountIds.has(c.id) ? "Account" : "Guest",
        };
      });
    },
  });
}

export interface CustomerPageStats {
  totalCustomers: number;
  guestPct: number;
  repeatRate: number;
  avgLifetimeValue: number;
}

export function useCustomerPageStats() {
  return useQuery({
    queryKey: ["customers", "page-stats"],
    queryFn: async (): Promise<CustomerPageStats> => {
      const supabase = createClient();
      const [{ count: totalCustomers }, { data: orders }] = await Promise.all([
        supabase.from("customer").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("user_id, customer_email, total"),
      ]);

      const totalOrders = orders?.length ?? 0;
      const guestOrders = (orders ?? []).filter((o) => !o.user_id).length;
      const guestPct = totalOrders ? (guestOrders / totalOrders) * 100 : 0;

      const perCustomer = new Map<string, { count: number; spent: number }>();
      for (const o of orders ?? []) {
        const e = perCustomer.get(o.customer_email) ?? { count: 0, spent: 0 };
        e.count += 1;
        e.spent += o.total;
        perCustomer.set(o.customer_email, e);
      }
      const withOrders = [...perCustomer.values()];
      const repeatCount = withOrders.filter((c) => c.count > 1).length;
      const repeatRate = withOrders.length ? (repeatCount / withOrders.length) * 100 : 0;
      const avgLifetimeValue = withOrders.length
        ? withOrders.reduce((s, c) => s + c.spent, 0) / withOrders.length
        : 0;

      return { totalCustomers: totalCustomers ?? 0, guestPct, repeatRate, avgLifetimeValue };
    },
  });
}

// ---- Detail ----

export interface CustomerDetail extends CustomerRow {
  addressLine: string | null;
  notes: string | null; // requires customer.internal_notes — see migrations/002
  history: { id: string; number: string; date: string; status: string; total: number }[];
}

export function useCustomerDetail(customerId: string | undefined) {
  return useQuery({
    queryKey: ["customers", "detail", customerId],
    enabled: !!customerId,
    queryFn: async (): Promise<CustomerDetail> => {
      const supabase = createClient();
      const { data: customer, error } = await supabase
        .from("customer")
        .select("*")
        .eq("id", customerId as string)
        .single();
      if (error) throw error;

      const [{ data: authLink }, { data: orders }] = await Promise.all([
        supabase.from("customer_auth").select("auth_user_id").eq("customer_id", customerId as string).maybeSingle(),
        supabase
          .from("orders")
          .select(
            "id, order_number, total, status, created_at, delivery_address_line, delivery_estate, delivery_town, delivery_county",
          )
          .eq("customer_email", customer.email)
          .order("created_at", { ascending: false }),
      ]);

      let addressLine: string | null = null;
      if (authLink?.auth_user_id) {
        const { data: address } = await supabase
          .from("addresses")
          .select("*")
          .eq("users_id", authLink.auth_user_id)
          .eq("is_default", true)
          .maybeSingle();
        if (address) {
          addressLine = [address.address_line, address.estate, address.town, address.county]
            .filter(Boolean)
            .join(", ");
        }
      }
      if (!addressLine && orders?.[0]) {
        const o = orders[0];
        addressLine = [o.delivery_address_line, o.delivery_estate, o.delivery_town, o.delivery_county]
          .filter(Boolean)
          .join(", ");
      }

      const spent = (orders ?? []).reduce((s, o) => s + o.total, 0);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        location: orders?.[0] ? [orders[0].delivery_town, orders[0].delivery_county].filter(Boolean).join(", ") : "—",
        orders: orders?.length ?? 0,
        spent,
        last: orders?.[0]?.created_at ?? null,
        type: authLink ? "Account" : "Guest",
        addressLine,
        notes: (customer as any).internal_notes ?? null,
        history: (orders ?? []).map((o) => ({
          id: o.id,
          number: o.order_number,
          date: o.created_at,
          status: o.status,
          total: o.total,
        })),
      };
    },
  });
}

// Requires `customer.internal_notes text` — see migrations/002_reviews_and_notes.sql
export function useSaveCustomerNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, notes }: { customerId: string; notes: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("customer").update({ internal_notes: notes } as any).eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: (_, { customerId }) =>
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", customerId] }),
  });
}
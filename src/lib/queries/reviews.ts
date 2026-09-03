import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type ReviewStatus = "Pending" | "Published" | "Rejected";

export interface ReviewRow {
  id: string;
  customer: string;
  location: string | null;
  product: string | null;
  rating: number;
  text: string;
  status: ReviewStatus;
  date: string;
  featured: boolean;
}

export function useReviews() {
  return useQuery({
    queryKey: ["reviews", "list"],
    queryFn: async (): Promise<ReviewRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, customer_name, location, rating, body, status, created_at, featured_on_homepage, products ( name )",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        customer: r.customer_name,
        location: r.location,
        product: r.products?.name ?? null,
        rating: r.rating,
        text: r.body,
        status: r.status,
        date: r.created_at,
        featured: !!r.featured_on_homepage,
      }));
    },
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: ["reviews", "stats"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("reviews").select("rating, status");
      if (error) throw error;
      const all = data ?? [];
      const avgRating = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
      return {
        avgRating,
        total: all.length,
        pending: all.filter((r) => r.status === "Pending").length,
        published: all.filter((r) => r.status === "Published").length,
        rejected: all.filter((r) => r.status === "Rejected").length,
      };
    },
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("reviews")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useToggleReviewFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("reviews")
        .update({ featured_on_homepage: featured, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}
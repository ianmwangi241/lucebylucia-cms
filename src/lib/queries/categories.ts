import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Category {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories", "list"],
    queryFn: async (): Promise<Category[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Admin CRUD (categories page) ----

export interface CategoryAdmin {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  image: string; // categories.image_url, now used as a product-images storage_path (run through assetUrl())
  active: boolean;
  count: number; // number of products linked via product_categories
  order: number; // categories.sort_order
}

export function useCategoriesAdmin() {
  return useQuery({
    queryKey: ["categories", "admin-list"],
    queryFn: async (): Promise<CategoryAdmin[]> => {
      const supabase = createClient();
      const [{ data: cats, error: catErr }, { data: links, error: linkErr }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("product_categories").select("category_id"),
      ]);
      if (catErr) throw catErr;
      if (linkErr) throw linkErr;

      const counts = new Map<string, number>();
      for (const l of links ?? []) {
        counts.set(l.category_id, (counts.get(l.category_id) ?? 0) + 1);
      }

      return (cats ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image_url,
        active: !!c.is_active,
        count: counts.get(c.id) ?? 0,
        order: c.sort_order ?? 0,
      }));
    },
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: CategoryAdmin & { newImageFile?: File }): Promise<string> => {
      const supabase = createClient();
      const now = new Date().toISOString();

      let imagePath = form.image;
      if (form.newImageFile) {
        const path = `${crypto.randomUUID()}-${form.newImageFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(path, form.newImageFile);
        if (uploadErr) throw uploadErr;
        imagePath = path;
      }

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        image_url: imagePath,
        is_active: form.active,
        sort_order: form.order,
        updated_at: now,
      };
      if (form.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", form.id);
        if (error) throw error;
        return form.id;
      }
      const { data, error } = await supabase
        .from("categories")
        .insert({ ...payload, created_at: now })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      // Unassign products first — schema doesn't show an ON DELETE CASCADE for this FK
      await supabase.from("product_categories").delete().eq("category_id", id);
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      const supabase = createClient();
      await Promise.all(
        items.map((it) => supabase.from("categories").update({ sort_order: it.order }).eq("id", it.id)),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections", "list"],
    queryFn: async (): Promise<Collection[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("collections")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
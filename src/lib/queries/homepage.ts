import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const HOMEPAGE_PAGE_TITLE = "Homepage";

// Used only to seed a brand-new homepage the first time this page loads with nothing in cms_sections yet.
const DEFAULT_SECTIONS: { type: string; title: string; content: string }[] = [
  { type: "hero", title: "Hero", content: "Full-width hero banner" },
  { type: "ticker", title: "Announcement ticker", content: "Scrolling announcement bar" },
  { type: "categories", title: "Shop by category", content: "Category grid" },
  { type: "new-arrivals", title: "New arrivals", content: "Newest products" },
  { type: "featured-products", title: "Featured products", content: "Hand-picked products" },
  { type: "reviews", title: "Reviews", content: "Customer testimonial" },
  { type: "instagram", title: "Instagram", content: "Instagram grid" },
  { type: "newsletter", title: "Newsletter", content: "Email signup" },
];

export interface HomeSection {
  dbId: string; // cms_sections.id (uuid) — use for keys, toggling, reordering
  type: string; // cms_sections.section_type — use for "which kind of section is this" logic
  name: string; // cms_sections.title
  summary: string; // cms_sections.content
  enabled: boolean; // cms_sections.is_visible
  order: number; // cms_sections.sort_order
  settings: Record<string, any>; // cms_sections.settings jsonb — shape depends on `type`, see homepage.tsx
}

async function getHomepageId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data, error } = await supabase
    .from("cms_pages")
    .select("id")
    .eq("title", HOMEPAGE_PAGE_TITLE)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export function useHomeSections() {
  return useQuery({
    queryKey: ["homepage", "sections"],
    queryFn: async (): Promise<HomeSection[]> => {
      const supabase = createClient();
      const pageId = await getHomepageId(supabase);
      if (!pageId) return [];

      const { data, error } = await supabase
        .from("cms_sections")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order", { ascending: true });
      if (error) throw error;

      return (data ?? []).map((s) => ({
        dbId: String(s.id),
        type: s.section_type ?? "generic",
        name: s.title ?? "",
        summary: s.content ?? "",
        enabled: !!s.is_visible,
        order: s.sort_order ?? 0,
        settings: (s.settings as Record<string, any>) ?? {},
      }));
    },
  });
}

export function useSeedHomepage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      let pageId = await getHomepageId(supabase);
      if (!pageId) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error("You must be signed in to set up the homepage");
        const { data, error } = await supabase
          .from("cms_pages")
          .insert({
            title: HOMEPAGE_PAGE_TITLE,
            meta_title: HOMEPAGE_PAGE_TITLE,
            meta_description: "Luce by Lucia homepage",
            // NOTE: cms_pages.slug is typed as a number in your schema, which looks like it
            // should be text ("home" / "/"). Using 0 as a placeholder — worth fixing the column type.
            slug: 0,
            status: "Published",
            published_at: new Date().toISOString(),
            created_by: userId,
          })
          .select("id")
          .single();
        if (error) throw error;
        pageId = data.id;
      }

      const { error: sectionsErr } = await supabase.from("cms_sections").insert(
        DEFAULT_SECTIONS.map((s, i) => ({
          page_id: pageId,
          section_type: s.type,
          title: s.title,
          content: s.content,
          is_visible: true,
          sort_order: i,
          settings: {},
        })),
      );
      if (sectionsErr) throw sectionsErr;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homepage"] }),
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dbId: string;
      title?: string;
      content?: string;
      enabled?: boolean;
      settings?: Record<string, any>;
    }) => {
      const supabase = createClient();
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (input.title !== undefined) payload.title = input.title;
      if (input.content !== undefined) payload.content = input.content;
      if (input.enabled !== undefined) payload.is_visible = input.enabled;
      if (input.settings !== undefined) payload.settings = input.settings;
      const { error } = await supabase.from("cms_sections").update(payload).eq("id", input.dbId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homepage", "sections"] }),
  });
}

export function useReorderSections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { dbId: string; order: number }[]) => {
      const supabase = createClient();
      await Promise.all(
        items.map((it) => supabase.from("cms_sections").update({ sort_order: it.order }).eq("id", it.dbId)),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homepage", "sections"] }),
  });
}
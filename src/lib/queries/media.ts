import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SITE_IMAGES_BUCKET } from "@/lib/format";

export interface MediaFile {
  id: number;
  file: string; // storage_path
  filename: string;
  folder: string; // inferred from the first path segment — see note below
  dims: string; // "1600×2000" or "—" if not recorded
  date: string;
  mimeType: string | null;
}

// cms_media has no folder/tag column, so "folder" is inferred from the storage
// path's first segment (e.g. "editorial/foo.webp" -> "Editorial"). Upload flow
// below writes files under <folder>/<uuid>-<filename> to make this work; if you
// want real folder assignment independent of path, add a folder column instead.
function folderFromPath(path: string) {
  const seg = path.split("/")[0];
  if (!seg || seg === path) return "Uncategorized";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function useMediaFiles() {
  return useQuery({
    queryKey: ["media", "list"],
    queryFn: async (): Promise<MediaFile[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((m) => ({
        id: m.id,
        file: m.storage_path ?? "",
        filename: m.filename ?? m.storage_path ?? "untitled",
        folder: folderFromPath(m.storage_path ?? ""),
        dims: m.width && m.height ? `${m.width}×${m.height}` : "—",
        date: m.created_at,
        mimeType: m.mime_type,
      }));
    },
  });
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      const supabase = createClient();
      const dims = await readImageDimensions(file);
      const path = `${folder.toLowerCase()}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadErr } = await supabase.storage.from(SITE_IMAGES_BUCKET).upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: userData } = await supabase.auth.getUser();

      const { error: insertErr } = await supabase.from("cms_media").insert({
        storage_path: path,
        filename: file.name,
        mime_type: file.type,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        alt_text: file.name,
        created_by: userData.user?.id ?? null,
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (files: { id: number; path: string }[]) => {
      const supabase = createClient();
      const paths = files.map((f) => f.path).filter(Boolean);
      if (paths.length) {
        const { error: storageErr } = await supabase.storage.from(SITE_IMAGES_BUCKET).remove(paths);
        if (storageErr) throw storageErr;
      }
      const { error } = await supabase
        .from("cms_media")
        .delete()
        .in("id", files.map((f) => f.id));
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
  });
}
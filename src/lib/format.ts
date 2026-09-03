import { createClient } from "@/lib/supabase/client";

const PRODUCT_IMAGES_BUCKET = "product_images";
const SITE_IMAGES_BUCKET = "site-images";

export function KES(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Converts a storage_path (as stored in product_images.storage_path) into a
 * public URL. Assumes the "product_images" bucket is public. If you're using
 * signed URLs instead, swap getPublicUrl for createSignedUrl and make this async.
 */
export function assetUrl(storagePath: string | null | undefined) {
  if (!storagePath) return "/placeholder-product.png";
  const supabase = createClient();
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Same idea as assetUrl(), but for general site/editorial imagery stored in
 * cms_media (homepage sections, media library) rather than product photography.
 */
export function siteAssetUrl(storagePath: string | null | undefined) {
  if (!storagePath) return "/placeholder-product.png";
  const supabase = createClient();
  const { data } = supabase.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export { PRODUCT_IMAGES_BUCKET, SITE_IMAGES_BUCKET };
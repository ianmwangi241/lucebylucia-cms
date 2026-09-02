import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Hardcoded since the schema has no per-product low-stock threshold.
// Move to site_settings later if you want this configurable per product/category.
const LOW_STOCK_THRESHOLD = 5;

// ---- Shapes consumed by the existing UI (products/index.tsx) ----

export type ProductStatus = "Published" | "Draft" | "Archived";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  collection: string | null;
  price: number;
  salePrice: number | null;
  qty: number;
  lowStock: number;
  status: ProductStatus;
  created: string;
  image: string; // storage_path, run through assetUrl() in the component
}

// ---- Shapes used by the editor (full detail incl. variants/images/links) ----

export interface VariantInput {
  id?: string; // absent = new variant
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  stock_quantity: number;
  is_available: boolean;
}

export interface ImageInput {
  id?: string; // absent = new image
  storage_path: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  file?: File; // present when a new file needs uploading before insert
}

export interface ProductFull {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_price: number;
  sale_price: number | null;
  status: ProductStatus;
  featured: boolean;
  variants: VariantInput[];
  images: ImageInput[];
  categoryIds: string[];
  collectionIds: string[];
}

export interface ProductSaveInput extends Omit<ProductFull, "id"> {
  id?: string;
}

// ---- List query ----

export function useProducts() {
  return useQuery({
    queryKey: ["products", "list"],
    queryFn: async (): Promise<Product[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id, name, slug, status, base_price, sale_price, created_at,
          product_variants ( sku, stock_quantity ),
          product_images ( storage_path, is_primary, sort_order ),
          product_categories ( categories ( name ) ),
          product_collections ( collections ( name ) )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((p): Product => {
        const variants = p.product_variants ?? [];
        const qty = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0);
        const images = [...(p.product_images ?? [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        const primaryImage = images.find((i) => i.is_primary) ?? images[0];
        const category = p.product_categories?.[0]?.categories;
        const collection = p.product_collections?.[0]?.collections;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: variants[0]?.sku ?? "—",
          category: category?.name ?? "Uncategorized",
          collection: collection?.name ?? null,
          price: p.base_price,
          salePrice: p.sale_price,
          qty,
          lowStock: LOW_STOCK_THRESHOLD,
          status: p.status as ProductStatus,
          created: p.created_at,
          image: primaryImage?.storage_path ?? "",
        };
      });
    },
  });
}

// ---- Single product (full detail, for the editor) ----

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["products", "detail", id],
    enabled: !!id,
    queryFn: async (): Promise<ProductFull> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id, name, slug, description, short_description, base_price, sale_price, status, featured,
          product_variants ( id, sku, size, color, price, stock_quantity, is_available ),
          product_images ( id, storage_path, alt_text, is_primary, sort_order ),
          product_categories ( category_id ),
          product_collections ( collection_id )
        `,
        )
        .eq("id", id as string)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        short_description: data.short_description,
        base_price: data.base_price,
        sale_price: data.sale_price,
        status: data.status as ProductStatus,
        featured: !!data.featured,
        variants: (data.product_variants ?? []).map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          stock_quantity: v.stock_quantity,
          is_available: v.is_available,
        })),
        images: (data.product_images ?? [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((i) => ({
            id: i.id,
            storage_path: i.storage_path,
            alt_text: i.alt_text,
            is_primary: !!i.is_primary,
            sort_order: i.sort_order ?? 0,
          })),
        categoryIds: (data.product_categories ?? []).map((c) => c.category_id),
        collectionIds: (data.product_collections ?? []).map((c) => c.collection_id),
      };
    },
  });
}

// ---- Create / Update (upserts variants, images, category & collection links) ----

async function uploadPendingImages(images: ImageInput[]) {
  const supabase = createClient();
  const resolved: ImageInput[] = [];
  for (const img of images) {
    if (img.file) {
      const path = `${crypto.randomUUID()}-${img.file.name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, img.file);
      if (error) throw error;
      resolved.push({ ...img, storage_path: path, file: undefined });
    } else {
      resolved.push(img);
    }
  }
  return resolved;
}

async function saveProductDetail(input: ProductSaveInput): Promise<string> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const productPayload = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    short_description: input.short_description,
    base_price: input.base_price,
    sale_price: input.sale_price,
    status: input.status,
    featured: input.featured,
    updated_at: now,
  };

  let productId = input.id;

  if (productId) {
    const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert({ ...productPayload, created_at: now })
      .select("id")
      .single();
    if (error) throw error;
    productId = data.id;
  }

  // Variants: update existing, insert new, delete removed
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  const existingIds = new Set((existingVariants ?? []).map((v) => v.id));
  const keptIds = new Set(input.variants.filter((v) => v.id).map((v) => v.id as string));
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length) {
    await supabase.from("product_variants").delete().in("id", toDelete);
  }
  for (const v of input.variants) {
    if (v.id) {
      await supabase
        .from("product_variants")
        .update({
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          stock_quantity: v.stock_quantity,
          is_available: v.is_available,
          updated_at: now,
        })
        .eq("id", v.id);
    } else {
      await supabase.from("product_variants").insert({
        product_id: productId,
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: v.price,
        stock_quantity: v.stock_quantity,
        is_available: v.is_available,
      });
    }
  }

  // Images: upload any pending files first, then upsert rows
  const resolvedImages = await uploadPendingImages(input.images);
  const { data: existingImages } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId);
  const existingImageIds = new Set((existingImages ?? []).map((i) => i.id));
  const keptImageIds = new Set(resolvedImages.filter((i) => i.id).map((i) => i.id as string));
  const imagesToDelete = [...existingImageIds].filter((id) => !keptImageIds.has(id));
  if (imagesToDelete.length) {
    await supabase.from("product_images").delete().in("id", imagesToDelete);
  }
  for (const img of resolvedImages) {
    if (img.id) {
      await supabase
        .from("product_images")
        .update({
          storage_path: img.storage_path,
          alt_text: img.alt_text,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
        })
        .eq("id", img.id);
    } else {
      await supabase.from("product_images").insert({
        product_id: productId,
        storage_path: img.storage_path,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
        sort_order: img.sort_order,
      });
    }
  }

  // Category links: simplest correct approach is delete-all-then-insert
  await supabase.from("product_categories").delete().eq("product_id", productId);
  if (input.categoryIds.length) {
    await supabase
      .from("product_categories")
      .insert(input.categoryIds.map((category_id) => ({ product_id: productId, category_id })));
  }

  // Collection links
  await supabase.from("product_collections").delete().eq("product_id", productId);
  if (input.collectionIds.length) {
    await supabase.from("product_collections").insert(
      input.collectionIds.map((collection_id, i) => ({
        product_id: productId,
        collection_id,
        sort_order: i,
      })),
    );
  }

  return productId as string;
}

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveProductDetail,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail", id] });
    },
  });
}

// ---- Delete / bulk status updates ----

export function useDeleteProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient();
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", "list"] }),
  });
}

export function useSetProductsStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ProductStatus }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", "list"] }),
  });
}
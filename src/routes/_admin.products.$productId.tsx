import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { EmptyState } from "@/components/admin/kit";
import { useProduct } from "@/lib/queries/products";

export const Route = createFileRoute("/_admin/products/$productId")({
  head: () => ({
    meta: [
      { title: "Edit product — Luce by Lucia Admin" },
      { name: "description", content: "Edit pricing, variants, inventory and photography for this piece." },
      { property: "og:title", content: "Edit product — Luce by Lucia Admin" },
      { property: "og:description", content: "Edit pricing, variants, inventory and photography." },
    ],
  }),
  component: EditProduct,
});

function EditProduct() {
  const { productId } = Route.useParams();
  const { data: product, isLoading, isError } = useProduct(productId);

  if (!isLoading && (isError || !product)) {
    return (
      <EmptyState
        title="Product not found"
        description="This piece may have been archived or deleted from the catalogue."
        action={
          <Link to="/products" className="mt-2 inline-flex h-10 items-center bg-ink px-4 text-sm text-primary-foreground">
            Back to products
          </Link>
        }
      />
    );
  }

  return <ProductEditor productId={productId} />;
}

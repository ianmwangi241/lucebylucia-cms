import { createFileRoute } from "@tanstack/react-router";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const Route = createFileRoute("/_admin/products/new")({
  head: () => ({
    meta: [
      { title: "New product — Luce by Lucia Admin" },
      { name: "description", content: "Create a new ready-to-wear piece with pricing, variants and photography." },
      { property: "og:title", content: "New product — Luce by Lucia Admin" },
      { property: "og:description", content: "Create a new piece with pricing, variants and photography." },
    ],
  }),
  component: () => <ProductEditor />,
});

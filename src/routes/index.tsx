import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Luce by Lucia — Admin" },
      { name: "description", content: "Internal operating system for Luce by Lucia." },
      { property: "og:title", content: "Luce by Lucia — Admin" },
      { property: "og:description", content: "Internal operating system for Luce by Lucia." },
    ],
  }),
  component: () => null,
});

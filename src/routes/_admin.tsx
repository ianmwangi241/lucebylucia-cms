import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/admin/Shell";

export const Route = createFileRoute("/_admin")({
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});

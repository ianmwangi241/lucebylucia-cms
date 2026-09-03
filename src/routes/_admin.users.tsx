import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { adminUsers, rolePermissions } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_admin/users")({
  head: () => ({
    meta: [
      { title: "Admin Users — Luce by Lucia Admin" },
      { name: "description", content: "Team access and role permissions for the Luce by Lucia back office." },
      { property: "og:title", content: "Admin Users — Luce by Lucia Admin" },
      { property: "og:description", content: "Team access and role permissions for the back office." },
    ],
  }),
  component: UsersPage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";

function UsersPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Admin users"
        description="Who can reach the back office, and exactly what each role may touch."
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 bg-ink px-4 text-sm text-primary-foreground hover:opacity-90"
          >
            <UserPlus className="size-4" strokeWidth={1.5} /> Invite user
          </button>
        }
      />

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
              <th className="px-5 py-3">NAME</th>
              <th className="py-3">EMAIL</th>
              <th className="py-3">ROLE</th>
              <th className="py-3">LAST ACTIVE</th>
              <th className="py-3">STATUS</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {adminUsers.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-accent/25">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center border border-border bg-muted font-display text-xs">
                      {u.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    {u.name}
                  </div>
                </td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3">
                  <Pill tone={u.role === "Super Admin" ? "gold" : "ink"}>{u.role}</Pill>
                </td>
                <td className="py-3 text-muted-foreground">{u.last}</td>
                <td className="py-3">
                  <Pill tone={u.status === "Active" ? "success" : "warning"}>{u.status}</Pill>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => toast.success(`Access updated for ${u.name}`)}
                    className="text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    MANAGE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel title="Role permissions">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rolePermissions.map((r) => (
            <article key={r.role} className="border border-border p-4">
              <p className="font-display text-lg">{r.role}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {r.access.map((a) => (
                  <li key={a} className="border-b border-border pb-1.5 last:border-0">
                    {a}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Panel>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">Invite admin user</SheetTitle>
            <SheetDescription>They will receive an email invitation to set a password.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-8">
            <Field label="Full name">
              <input className={input} placeholder="Jane Wairimu" />
            </Field>
            <Field label="Email">
              <input className={input} placeholder="jane@lucebylucia.co.ke" />
            </Field>
            <Field label="Role">
              <select className={input}>
                {rolePermissions.map((r) => (
                  <option key={r.role}>{r.role}</option>
                ))}
              </select>
            </Field>
            <button
              onClick={() => {
                toast.success("Invitation sent");
                setOpen(false);
              }}
              className="h-10 w-full bg-ink text-sm text-primary-foreground hover:opacity-90"
            >
              Send invitation
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

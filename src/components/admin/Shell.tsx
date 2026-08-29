import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Tags,
  Layers,
  Boxes,
  Percent,
  LayoutTemplate,
  Images,
  Star,
  Mail,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Item = { to: "/"; label: string; icon: typeof Bell };
const nav: { group: string; items: Item[] }[] = [
  {
    group: "Overview",
    items: [{ to: "/dashboard" as "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Commerce",
    items: [
      { to: "/orders" as "/", label: "Orders", icon: ShoppingBag },
      { to: "/products" as "/", label: "Products", icon: Shirt },
      { to: "/categories" as "/", label: "Categories", icon: Tags },
      { to: "/collections" as "/", label: "Collections", icon: Layers },
      { to: "/inventory" as "/", label: "Inventory", icon: Boxes },
      { to: "/discounts" as "/", label: "Discounts", icon: Percent },
    ],
  },
  {
    group: "Content",
    items: [
      { to: "/homepage" as "/", label: "Homepage", icon: LayoutTemplate },
      { to: "/media" as "/", label: "Media", icon: Images },
      { to: "/reviews" as "/", label: "Reviews", icon: Star },
      { to: "/newsletter" as "/", label: "Newsletter", icon: Mail },
    ],
  },
  {
    group: "Customers",
    items: [{ to: "/customers" as "/", label: "Customers", icon: Users }],
  },
  {
    group: "Analytics",
    items: [{ to: "/analytics" as "/", label: "Overview", icon: BarChart3 }],
  },
  {
    group: "Settings",
    items: [
      { to: "/settings" as "/", label: "Site Settings", icon: Settings },
      { to: "/users" as "/", label: "Admin Users", icon: ShieldCheck },
    ],
  },
];

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  products: "Products",
  categories: "Categories",
  collections: "Collections",
  inventory: "Inventory",
  discounts: "Discounts",
  homepage: "Homepage",
  media: "Media",
  reviews: "Reviews",
  newsletter: "Newsletter",
  customers: "Customers",
  analytics: "Analytics",
  settings: "Site Settings",
  users: "Admin Users",
  new: "New",
};

export function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5">
          {collapsed ? (
            <span className="font-display text-2xl text-sidebar-primary">L</span>
          ) : (
            <div>
              <p className="font-display text-lg leading-tight tracking-[0.18em] text-sidebar-accent-foreground">
                LUCE
              </p>
              <p className="text-[10px] tracking-[0.32em] text-sidebar-primary">BY LUCIA</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {nav.map((section) => (
            <div key={section.group} className="mb-5">
              {!collapsed && (
                <p className="px-3 pb-2 text-[10px] tracking-[0.24em] text-sidebar-foreground/40">
                  {section.group.toUpperCase()}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      title={item.label}
                      className="group flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
                      activeProps={{ className: "border-l-2 border-sidebar-primary" }}
                    >
                      <item.icon className="size-4 shrink-0 opacity-80" strokeWidth={1.4} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4 text-xs tracking-wide text-sidebar-foreground/60 transition-colors hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-background/85 px-5 backdrop-blur md:px-8">
          <div className="md:hidden">
            <p className="font-display text-base tracking-[0.18em]">LUCE</p>
          </div>
          <div className="relative hidden max-w-sm flex-1 items-center md:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <input
              placeholder="Search orders, products, customers…"
              className="h-10 w-full border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative grid size-10 place-items-center border border-border bg-card transition-colors hover:border-gold"
            >
              <Bell className="size-4" strokeWidth={1.4} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-gold" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 border border-border bg-card px-3 py-2 text-left transition-colors hover:border-gold">
                <span className="grid size-7 place-items-center rounded-full bg-ink font-display text-xs text-primary-foreground">
                  LM
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-xs font-medium">Lucia Mwende</span>
                  <span className="block text-[10px] tracking-widest text-muted-foreground">
                    SUPER ADMIN
                  </span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>lucia@lucebylucia.co.ke</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {crumbs.length > 0 && (
          <div className="flex items-center gap-1.5 border-b border-border px-5 py-2.5 text-[11px] tracking-wide text-muted-foreground md:px-8">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Admin
            </Link>
            {crumbs.map((c, i) => (
              <span key={`${c}-${i}`} className="flex items-center gap-1.5">
                <ChevronRight className="size-3 opacity-50" />
                <span className={i === crumbs.length - 1 ? "text-foreground" : undefined}>
                  {labels[c] ?? decodeURIComponent(c)}
                </span>
              </span>
            ))}
          </div>
        )}

        <main className="flex-1 px-5 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

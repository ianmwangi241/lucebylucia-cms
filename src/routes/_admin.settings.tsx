import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/settings")({
  head: () => ({
    meta: [
      { title: "Site Settings — Luce by Lucia Admin" },
      { name: "description", content: "Store details, delivery zones, M-Pesa payments and SEO defaults." },
      { property: "og:title", content: "Site Settings — Luce by Lucia Admin" },
      { property: "og:description", content: "Store details, delivery, payments and SEO defaults." },
    ],
  }),
  component: SettingsPage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";
const area = "w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold";
const tabs = ["Store", "Delivery", "Payments", "SEO", "Social"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Store");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Site settings"
        description="Everything the storefront reads: contact details, delivery zones, payments and metadata."
        actions={
          <button
            onClick={() => toast.success("Settings saved")}
            className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
          >
            Save changes
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1 border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-xs tracking-wide transition-colors",
              tab === t ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Store" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Store details">
            <div className="space-y-4">
              <Field label="Store name">
                <input className={input} defaultValue="Luce by Lucia" />
              </Field>
              <Field label="Tagline">
                <input className={input} defaultValue="The Art of Being You" />
              </Field>
              <Field label="Contact email">
                <input className={input} defaultValue="hello@lucebylucia.co.ke" />
              </Field>
              <Field label="Phone / WhatsApp">
                <input className={input} defaultValue="+254 712 345 678" />
              </Field>
              <Field label="Studio address">
                <textarea rows={3} className={area} defaultValue={"Riverside Drive\nWestlands, Nairobi"} />
              </Field>
            </div>
          </Panel>
          <Panel title="Currency & locale">
            <div className="space-y-4">
              <Field label="Currency">
                <select className={input}>
                  <option>KES — Kenyan Shilling</option>
                  <option>USD — US Dollar</option>
                </select>
              </Field>
              <Field label="Timezone">
                <select className={input}>
                  <option>Africa/Nairobi (EAT)</option>
                </select>
              </Field>
              <Field label="Order number prefix">
                <input className={input} defaultValue="LUC-" />
              </Field>
              <label className="flex items-center justify-between border border-border px-4 py-3 text-sm">
                <span>Maintenance mode</span>
                <input type="checkbox" />
              </label>
            </div>
          </Panel>
        </div>
      )}

      {tab === "Delivery" && (
        <Panel title="Delivery zones" padded={false}>
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-[0.18em] text-muted-foreground">
                <th className="px-5 py-3">ZONE</th>
                <th className="py-3">FEE</th>
                <th className="py-3">LEAD TIME</th>
                <th className="px-5 py-3">FREE OVER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Nairobi CBD", "KSh 300", "Same day", "KSh 10,000"],
                ["Nairobi Metro", "KSh 450", "1 day", "KSh 10,000"],
                ["Mombasa / Kisumu / Nakuru", "KSh 650", "2–3 days", "KSh 15,000"],
                ["Rest of Kenya (courier)", "KSh 850", "3–5 days", "KSh 20,000"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i} className={cn("py-3", i === 0 && "px-5", i === 3 && "px-5")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === "Payments" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="M-Pesa (Daraja)" action={<Pill tone="success">Connected</Pill>}>
            <div className="space-y-4">
              <Field label="Business shortcode">
                <input className={input} defaultValue="174379" />
              </Field>
              <Field label="Paybill / Till name">
                <input className={input} defaultValue="LUCE BY LUCIA" />
              </Field>
              <Field label="Callback URL" hint="Where Safaricom confirms payment">
                <input className={input} defaultValue="https://lucebylucia.co.ke/api/public/mpesa/callback" />
              </Field>
              <label className="flex items-center justify-between border border-border px-4 py-3 text-sm">
                <span>Sandbox mode</span>
                <input type="checkbox" />
              </label>
            </div>
          </Panel>
          <Panel title="Other methods">
            <div className="space-y-3">
              {[
                ["Card payments", "Stripe", false],
                ["Bank transfer", "Manual confirmation", true],
                ["Cash on delivery", "Nairobi only", true],
              ].map(([name, hint, on]) => (
                <label key={name as string} className="flex items-center justify-between border border-border px-4 py-3 text-sm">
                  <span>
                    {name}
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                  <input type="checkbox" defaultChecked={on as boolean} />
                </label>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "SEO" && (
        <Panel title="Default metadata">
          <div className="max-w-2xl space-y-4">
            <Field label="Meta title" hint="Under 60 characters">
              <input className={input} defaultValue="Luce by Lucia — Premium Womenswear in Nairobi" />
            </Field>
            <Field label="Meta description" hint="Under 160 characters">
              <textarea
                rows={3}
                className={area}
                defaultValue="Premium ready-to-wear womenswear designed in Nairobi. Dresses, sets and occasion wear with M-Pesa checkout and nationwide delivery."
              />
            </Field>
            <Field label="Social share image">
              <input className={input} defaultValue="hero.webp" />
            </Field>
            <Field label="Google Analytics ID">
              <input className={input} defaultValue="G-XXXXXXXXXX" />
            </Field>
          </div>
        </Panel>
      )}

      {tab === "Social" && (
        <Panel title="Social links">
          <div className="max-w-2xl space-y-4">
            {[
              ["Instagram", "https://instagram.com/lucebylucia"],
              ["TikTok", "https://tiktok.com/@lucebylucia"],
              ["Facebook", "https://facebook.com/lucebylucia"],
              ["Pinterest", ""],
            ].map(([label, url]) => (
              <Field key={label} label={label ?? ""}>
                <input className={input} defaultValue={url ?? ""} placeholder="https://" />
              </Field>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

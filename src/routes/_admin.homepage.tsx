import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GripVertical,
  Eye,
  EyeOff,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, Pill } from "@/components/admin/kit";
import { assetUrl, categories, homeSections, products, reviews, tickerItems, type HomeSection } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_admin/homepage")({
  head: () => ({
    meta: [
      { title: "Homepage — Luce by Lucia Admin" },
      { name: "description", content: "Compose the Luce by Lucia homepage section by section, then preview it." },
      { property: "og:title", content: "Homepage — Luce by Lucia Admin" },
      { property: "og:description", content: "Compose the homepage section by section, then preview it." },
    ],
  }),
  component: HomepagePage,
});

const input = "h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold";
const area = "w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold";

function HomepagePage() {
  const [sections, setSections] = useState<HomeSection[]>(homeSections);
  const [drag, setDrag] = useState<number | null>(null);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [ticker, setTicker] = useState(tickerItems);

  const move = (from: number, to: number) =>
    setSections((list) => {
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });

  const toggle = (id: string) =>
    setSections((list) => list.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));

  const width = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Homepage"
        description="Sections appear here in the exact order they appear on lucebylucia.co.ke. Drag to rearrange."
        actions={
          <>
            <div className="flex items-center gap-1 border border-border bg-card p-1">
              {([
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const).map(([d, Icon]) => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  aria-label={`Preview ${d}`}
                  className={cn(
                    "grid size-8 place-items-center transition-colors",
                    device === d ? "bg-ink text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <button
              onClick={() => toast.success("Opening the live website preview")}
              className="inline-flex h-10 items-center gap-2 border border-border bg-card px-4 text-sm hover:border-gold"
            >
              <ExternalLink className="size-4" strokeWidth={1.5} /> Preview website
            </button>
            <button
              onClick={() => toast.success("Homepage published")}
              className="h-10 bg-ink px-5 text-sm text-primary-foreground hover:opacity-90"
            >
              Publish changes
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <div className="space-y-3">
          {sections.map((s, i) => (
            <article
              key={s.id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag !== null && drag !== i) move(drag, i);
                setDrag(null);
              }}
              className={cn(
                "surface flex items-center gap-3 p-3 transition-colors hover:border-gold",
                drag === i && "opacity-40",
                !s.enabled && "bg-muted",
              )}
            >
              <GripVertical className="size-4 cursor-grab text-muted-foreground" />
              {s.image ? (
                <img src={assetUrl(s.image)} alt="" className="size-12 object-cover" loading="lazy" />
              ) : (
                <span className="grid size-12 place-items-center border border-border font-display text-xs text-muted-foreground">
                  {i + 1}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", !s.enabled && "text-muted-foreground line-through")}>{s.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{s.summary}</p>
              </div>
              <button onClick={() => toggle(s.id)} aria-label="Toggle section" className="text-muted-foreground hover:text-foreground">
                {s.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <button
                onClick={() => setEditing(s)}
                className="h-8 border border-border px-3 text-[10px] tracking-widest hover:border-gold"
              >
                EDIT
              </button>
            </article>
          ))}
        </div>

        <Panel title={`Preview · ${device}`} className="h-fit">
          <div className="mx-auto overflow-hidden border border-border bg-background transition-all" style={{ width, maxWidth: "100%" }}>
            {sections.filter((s) => s.enabled).map((s) => (
              <PreviewBlock key={s.id} section={s} device={device} />
            ))}
          </div>
        </Panel>
      </div>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">{editing?.name}</SheetTitle>
            <SheetDescription>Content shown in this section of the homepage.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-10">
            {editing?.id === "ticker" ? (
              <>
                <p className="eyebrow">Ticker items</p>
                {ticker.map((t, i) => (
                  <div key={t + i} className="flex items-center gap-2">
                    <GripVertical className="size-4 text-muted-foreground" />
                    <input
                      className={input}
                      defaultValue={t}
                      onChange={(e) =>
                        setTicker((list) => list.map((x, j) => (j === i ? e.target.value : x)))
                      }
                    />
                    <button
                      onClick={() => setTicker((list) => list.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setTicker((l) => [...l, "NEW ITEM"])}
                  className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs tracking-widest hover:border-gold"
                >
                  <Plus className="size-3.5" /> ADD ITEM
                </button>
              </>
            ) : editing?.id === "categories" ? (
              <>
                <p className="eyebrow">Categories shown</p>
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 border border-border p-2">
                    <input type="checkbox" defaultChecked={c.active} />
                    <img src={assetUrl(c.image)} alt="" className="size-10 object-cover" loading="lazy" />
                    <span className="text-sm">{c.name}</span>
                    <button className="ml-auto text-[10px] tracking-widest text-muted-foreground hover:text-foreground">
                      CHANGE IMAGE
                    </button>
                  </label>
                ))}
              </>
            ) : editing?.id === "new-arrivals" ? (
              <>
                <Field label="Source">
                  <select className={input}>
                    <option>Automatic — newest products</option>
                    <option>Manual selection</option>
                  </select>
                </Field>
                <Field label="Number of products">
                  <input className={input} defaultValue={8} />
                </Field>
              </>
            ) : editing?.id === "featured-products" ? (
              <>
                <p className="eyebrow">Selected products</p>
                <div className="grid grid-cols-3 gap-3">
                  {products.slice(0, 6).map((p) => (
                    <figure key={p.id} className="border border-border">
                      <img src={assetUrl(p.image)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                      <figcaption className="truncate p-1.5 text-[10px]">{p.name}</figcaption>
                    </figure>
                  ))}
                </div>
                <button className="h-9 w-full border border-border text-xs tracking-widest hover:border-gold">
                  CHOOSE PRODUCTS
                </button>
              </>
            ) : editing?.id === "reviews" ? (
              <>
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="space-y-2 border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{r.customer}</p>
                      <Pill tone={r.status === "Published" ? "success" : "warning"}>{r.status}</Pill>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{r.location} · {r.rating}★</p>
                    <textarea rows={2} className={area} defaultValue={r.text} />
                  </div>
                ))}
              </>
            ) : editing?.id === "instagram" ? (
              <>
                <Field label="Instagram username">
                  <input className={input} defaultValue="@lucebylucia" />
                </Field>
                <Field label="Profile URL">
                  <input className={input} defaultValue="https://instagram.com/lucebylucia" />
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  {["zola-1.webp", "sahara.webp", "signature-1.webp", "aura-set-long.webp", "after-dark.webp", "hero.webp"].map((f) => (
                    <img key={f} src={assetUrl(f)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                  ))}
                </div>
                <label className="flex items-center justify-between border border-border px-4 py-3 text-sm">
                  <span>Section enabled</span>
                  <input type="checkbox" defaultChecked={editing?.enabled} />
                </label>
              </>
            ) : (
              <>
                {editing?.image && (
                  <figure className="border border-border">
                    <img src={assetUrl(editing.image)} alt="" className="aspect-[16/9] w-full object-cover" />
                    <figcaption className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
                      {editing.image}
                      <button className="tracking-widest hover:text-foreground">CHANGE IMAGE</button>
                    </figcaption>
                  </figure>
                )}
                <Field label="Eyebrow">
                  <input className={input} defaultValue="New Season" key={editing?.id + "e"} />
                </Field>
                <Field label="Heading">
                  <input className={input} defaultValue="The Art of Being You" key={editing?.id + "h"} />
                </Field>
                <Field label="Description">
                  <textarea
                    rows={3}
                    className={area}
                    key={editing?.id + "d"}
                    defaultValue="Premium ready-to-wear womenswear designed in Nairobi."
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Primary button">
                    <input className={input} defaultValue="Shop the Collection" key={editing?.id + "b"} />
                  </Field>
                  <Field label="Primary button URL">
                    <input className={input} defaultValue="/collections/new-season" key={editing?.id + "bu"} />
                  </Field>
                  <Field label="Secondary button">
                    <input className={input} defaultValue="View Lookbook" key={editing?.id + "s"} />
                  </Field>
                  <Field label="Secondary button URL">
                    <input className={input} defaultValue="/lookbook" key={editing?.id + "su"} />
                  </Field>
                </div>
                {editing?.id === "brand-story" && (
                  <Field label="Quote">
                    <input className={input} defaultValue="Clothing should enhance the woman wearing it." />
                  </Field>
                )}
                {editing?.id === "newsletter" && (
                  <Field label="Background">
                    <select className={input}>
                      <option>Ivory</option>
                      <option>Ink</option>
                      <option>Blush</option>
                    </select>
                  </Field>
                )}
              </>
            )}

            <button
              onClick={() => {
                toast.success(`${editing?.name} saved`);
                setEditing(null);
              }}
              className="h-10 w-full bg-ink text-sm text-primary-foreground hover:opacity-90"
            >
              Save section
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PreviewBlock({ section, device }: { section: HomeSection; device: string }) {
  const compact = device === "mobile";

  if (section.id === "hero")
    return (
      <div className="relative">
        <img src={assetUrl("hero.webp")} alt="" className={cn("w-full object-cover", compact ? "h-64" : "h-80")} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/30 text-center text-primary-foreground">
          <p className="text-[9px] tracking-[0.3em]">NEW SEASON</p>
          <h3 className="font-display text-3xl">The Art of Being You</h3>
          <p className="max-w-xs text-xs opacity-90">Premium ready-to-wear womenswear designed in Nairobi.</p>
          <span className="mt-2 border border-primary-foreground px-4 py-1.5 text-[10px] tracking-widest">
            SHOP THE COLLECTION
          </span>
        </div>
      </div>
    );

  if (section.id === "ticker")
    return (
      <div className="flex items-center gap-6 overflow-hidden bg-ink px-4 py-2.5 text-[9px] tracking-[0.28em] text-primary-foreground">
        {tickerItems.map((t) => (
          <span key={t} className="whitespace-nowrap">
            {t} ·
          </span>
        ))}
      </div>
    );

  if (section.id === "categories")
    return (
      <div className="p-6">
        <p className="eyebrow text-center">SHOP BY CATEGORY</p>
        <div className={cn("mt-4 grid gap-2", compact ? "grid-cols-2" : "grid-cols-5")}>
          {categories.slice(0, 5).map((c) => (
            <figure key={c.id}>
              <img src={assetUrl(c.image)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
              <figcaption className="pt-1.5 text-center text-[10px] tracking-widest">{c.name.toUpperCase()}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    );

  if (section.id === "new-arrivals" || section.id === "featured-products")
    return (
      <div className="p-6">
        <p className="eyebrow text-center">{section.name.toUpperCase()}</p>
        <div className={cn("mt-4 grid gap-2", compact ? "grid-cols-2" : "grid-cols-4")}>
          {products.slice(0, compact ? 4 : 4).map((p) => (
            <figure key={p.id}>
              <img src={assetUrl(p.image)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
              <figcaption className="pt-1.5 text-center text-[10px]">{p.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    );

  if (section.id === "reviews")
    return (
      <div className="bg-accent/40 p-8 text-center">
        <p className="eyebrow">WHAT SHE SAYS</p>
        <p className="mx-auto mt-3 max-w-md font-display text-xl italic">“{reviews[1].text}”</p>
        <p className="mt-2 text-[10px] tracking-widest text-muted-foreground">
          {reviews[1].customer.toUpperCase()} · {reviews[1].location.toUpperCase()}
        </p>
      </div>
    );

  if (section.id === "instagram")
    return (
      <div className="p-6">
        <p className="eyebrow text-center">@LUCEBYLUCIA</p>
        <div className="mt-3 grid grid-cols-6 gap-1">
          {["zola-1.webp", "sahara.webp", "signature-1.webp", "aura-set-long.webp", "after-dark.webp", "hero.webp"].map((f) => (
            <img key={f} src={assetUrl(f)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
          ))}
        </div>
      </div>
    );

  if (section.id === "newsletter")
    return (
      <div className="bg-ink px-6 py-10 text-center text-primary-foreground">
        <h3 className="font-display text-2xl">Join the Luce list</h3>
        <p className="mt-1 text-xs opacity-80">Early access to drops, and nothing else.</p>
        <div className="mx-auto mt-4 flex max-w-sm">
          <span className="flex-1 border border-primary-foreground/40 px-3 py-2 text-left text-[10px] opacity-70">
            your@email.com
          </span>
          <span className="bg-gold px-4 py-2 text-[10px] tracking-widest text-ink">SUBSCRIBE</span>
        </div>
      </div>
    );

  return (
    <div className={cn("grid items-center", compact ? "grid-cols-1" : "grid-cols-2")}>
      <img src={assetUrl(section.image ?? "signature-1.webp")} alt="" className="h-56 w-full object-cover" loading="lazy" />
      <div className="space-y-2 p-6">
        <p className="eyebrow">{section.name.toUpperCase()}</p>
        <h3 className="font-display text-2xl">{section.summary}</h3>
        <p className="text-xs text-muted-foreground">
          Premium ready-to-wear designed in Nairobi, made to enhance the woman wearing it.
        </p>
        <span className="inline-block border border-ink px-4 py-1.5 text-[10px] tracking-widest">DISCOVER</span>
      </div>
    </div>
  );
}

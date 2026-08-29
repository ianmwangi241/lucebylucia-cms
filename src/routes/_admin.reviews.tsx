import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, Stat } from "@/components/admin/kit";
import { reviews } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — Luce by Lucia Admin" },
      { name: "description", content: "Moderate customer reviews and choose which testimonials appear on the homepage." },
      { property: "og:title", content: "Reviews — Luce by Lucia Admin" },
      { property: "og:description", content: "Moderate customer reviews and homepage testimonials." },
    ],
  }),
  component: ReviewsPage,
});

const tabs = ["All", "Pending", "Published", "Rejected"];

function ReviewsPage() {
  const [tab, setTab] = useState("All");
  const list = reviews.filter((r) => tab === "All" || r.status === tab);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Reviews"
        description="Approve what she says before it reaches the homepage."
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Average rating" value="4.2" hint="across 5 reviews" />
        <Stat label="Pending" value={String(reviews.filter((r) => r.status === "Pending").length)} />
        <Stat label="Published" value={String(reviews.filter((r) => r.status === "Published").length)} />
        <Stat label="Rejected" value={String(reviews.filter((r) => r.status === "Rejected").length)} />
      </div>

      <div className="flex items-center gap-1 border border-border bg-card p-1">
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

      <div className="space-y-3">
        {list.map((r) => (
          <article key={r.id} className="surface space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{r.customer}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.location} · {r.product} · {r.date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("size-3.5", i < r.rating ? "fill-gold text-gold" : "text-border")}
                      strokeWidth={1.25}
                    />
                  ))}
                </span>
                <Pill tone={r.status === "Published" ? "success" : r.status === "Pending" ? "warning" : "danger"}>
                  {r.status}
                </Pill>
              </div>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">“{r.text}”</p>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <button
                onClick={() => toast.success("Review published")}
                className="h-9 bg-ink px-4 text-xs tracking-widest text-primary-foreground hover:opacity-90"
              >
                PUBLISH
              </button>
              <button
                onClick={() => toast.success("Featured on the homepage")}
                className="h-9 border border-border px-4 text-xs tracking-widest hover:border-gold"
              >
                FEATURE ON HOMEPAGE
              </button>
              <button
                onClick={() => toast.success("Review rejected")}
                className="h-9 border border-destructive/40 px-4 text-xs tracking-widest text-destructive hover:bg-destructive/10"
              >
                REJECT
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

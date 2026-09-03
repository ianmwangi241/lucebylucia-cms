import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, Stat } from "@/components/admin/kit";
import { useReviews, useReviewStats, useUpdateReviewStatus, useToggleReviewFeatured } from "@/lib/queries/reviews";
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
  const { data: reviews = [], isLoading } = useReviews();
  const { data: stats } = useReviewStats();
  const updateStatus = useUpdateReviewStatus();
  const toggleFeatured = useToggleReviewFeatured();

  const list = useMemo(() => reviews.filter((r) => tab === "All" || r.status === tab), [reviews, tab]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Reviews"
        description="Approve what she says before it reaches the homepage."
      />

      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Average rating" value={(stats?.avgRating ?? 0).toFixed(1)} hint={`across ${stats?.total ?? 0} reviews`} />
        <Stat label="Pending" value={String(stats?.pending ?? 0)} />
        <Stat label="Published" value={String(stats?.published ?? 0)} />
        <Stat label="Rejected" value={String(stats?.rejected ?? 0)} />
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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading reviews…
        </div>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No reviews here yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <article key={r.id} className="surface space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{r.customer}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[r.location, r.product, new Date(r.date).toLocaleDateString()].filter(Boolean).join(" · ")}
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
                  {r.featured && <Pill tone="gold">Featured</Pill>}
                </div>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">"{r.text}"</p>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <button
                  onClick={() =>
                    updateStatus.mutate(
                      { id: r.id, status: "Published" },
                      {
                        onSuccess: () => toast.success("Review published"),
                        onError: () => toast.error("Failed to publish review"),
                      },
                    )
                  }
                  disabled={r.status === "Published"}
                  className="h-9 bg-ink px-4 text-xs tracking-widest text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  PUBLISH
                </button>
                <button
                  onClick={() =>
                    toggleFeatured.mutate(
                      { id: r.id, featured: !r.featured },
                      {
                        onSuccess: () =>
                          toast.success(r.featured ? "Removed from homepage" : "Featured on the homepage"),
                        onError: () => toast.error("Failed to update featured state"),
                      },
                    )
                  }
                  className="h-9 border border-border px-4 text-xs tracking-widest hover:border-gold"
                >
                  {r.featured ? "UNFEATURE" : "FEATURE ON HOMEPAGE"}
                </button>
                <button
                  onClick={() =>
                    updateStatus.mutate(
                      { id: r.id, status: "Rejected" },
                      {
                        onSuccess: () => toast.success("Review rejected"),
                        onError: () => toast.error("Failed to reject review"),
                      },
                    )
                  }
                  disabled={r.status === "Rejected"}
                  className="h-9 border border-destructive/40 px-4 text-xs tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  REJECT
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

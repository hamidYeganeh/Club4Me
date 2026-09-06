"use client";

import { Typography } from "@heroui/react";
import { CoachCard } from "@ui/coach-card";

const NORMAL_IMAGE =
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80";
const COMPACT_IMAGE =
  "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80";
const AUTHOR_AVATAR =
  "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=200&h=200&q=80";

export function CoachesPreviewScreen() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <Typography type="h2">Coach Card</Typography>
      </div>

      <section className="flex flex-col gap-4">
        <Typography type="h5">Normal · 276×367</Typography>
        <div className="flex flex-wrap gap-4">
          <CoachCard
            type="normal"
            title="Title Text"
            supportingText="Supporting Text"
            imageUrl={NORMAL_IMAGE}
            badge="Text"
            rating={3.5}
            reviewsCount={90}
            stats={[
              { id: "location", label: "Text" },
              { id: "mode", label: "Text" },
            ]}
            onActionPress={() => undefined}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Typography type="h5">Compact · 260×280</Typography>
        <div className="flex flex-wrap gap-4">
          <CoachCard
            type="compact"
            title="Title Text"
            imageUrl={COMPACT_IMAGE}
            badge="Text"
            meta={["Text", "Text"]}
            authorName="Author Text"
            authorAvatarUrl={AUTHOR_AVATAR}
            onActionPress={() => undefined}
          />
        </div>
      </section>
    </main>
  );
}

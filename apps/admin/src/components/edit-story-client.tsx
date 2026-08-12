"use client";

import { useEffect, useState } from "react";
import type { StoryWithPages } from "@calm-stories/shared";
import { getStory } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryForm } from "@/components/story-form";

export function EditStoryClient({ id }: { id: string }) {
  const [story, setStory] = useState<StoryWithPages | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStory(id)
      .then(setStory)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load story"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-8 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-8 text-sm text-muted-foreground">
        Story not found.
      </div>
    );
  }

  return <StoryForm story={story} />;
}

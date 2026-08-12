import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoriesTable } from "@/components/stories-table";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stories</h1>
          <p className="text-sm text-muted-foreground">
            Manage story content, pages, and publishing.
          </p>
        </div>
        <Button asChild>
          <Link href="/stories/new">
            <Plus className="h-4 w-4" /> New Story
          </Link>
        </Button>
      </div>
      <StoriesTable />
    </div>
  );
}

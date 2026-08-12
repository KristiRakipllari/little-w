"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Trash2, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import type { Story } from "@calm-stories/shared";
import { DIFFICULTY_LABELS } from "@calm-stories/shared";
import { getStories, deleteStory, updateStory } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LEVEL_CLASSES: Record<string, string> = {
  beginner: "bg-amber-100 text-amber-800",
  medium: "bg-sky-100 text-sky-800",
  advanced: "bg-violet-100 text-violet-800",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export function StoriesTable() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getStories()
      .then(setStories)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load stories"))
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async (story: Story) => {
    setPending(story.id);
    try {
      const updated = await updateStory(story.id, { is_published: !story.is_published });
      setStories((s) => s.map((x) => (x.id === story.id ? { ...x, ...updated } : x)));
      toast.success(updated.is_published ? "Story published" : "Story unpublished");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPending(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStory(deleteTarget.id);
      setStories((s) => s.filter((x) => x.id !== deleteTarget.id));
      toast.success(`Deleted "${deleteTarget.title}"`);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 rounded-xl border bg-card p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-20 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No stories yet. Create your first one.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-semibold">{s.title}</div>
                  {s.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {s.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={LEVEL_CLASSES[s.level] ?? "bg-muted text-foreground"}>
                    {DIFFICULTY_LABELS[s.level] ?? s.level}
                  </Badge>
                </TableCell>
                <TableCell>
                  {s.is_premium ? (
                    <Badge className="bg-violet-100 text-violet-800">Premium</Badge>
                  ) : (
                    <span className="text-muted-foreground">Free</span>
                  )}
                </TableCell>
                <TableCell>
                  {s.is_published ? (
                    <Badge className="bg-emerald-100 text-emerald-800">Published</Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800">Draft</Badge>
                  )}
                </TableCell>
                <TableCell>{s.page_count}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(s.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={pending === s.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/stories/${s.id}/edit`)}>
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/stories/${s.id}/pages`)}>
                        <FileText /> Pages
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePublish(s)}>
                        {s.is_published ? <EyeOff /> : <Eye />}
                        {s.is_published ? "Unpublish" : "Publish"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(s)}>
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete story?</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.title}&quot; and all its pages will be permanently
              removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  ImagePlus,
  Loader2,
  Music,
  Trash2,
  Save,
} from "lucide-react";
import type { StoryPage, StoryWithPages } from "@calm-stories/shared";
import { getStory, createPage, updatePage, deletePage, reorderPages, uploadFile } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const IMG_ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Browsers label .m4a/.aac inconsistently, so the picker also accepts the
// extensions and the API resolves the real type from them.
const AUDIO_ACCEPT = ["audio/mpeg", "audio/mp4", ".mp3", ".m4a", ".aac"];
const AUDIO_MIME = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/x-m4a"];
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

function validImage(file: File): boolean {
  if (!IMG_ACCEPT.includes(file.type)) {
    toast.error("Image must be PNG, JPEG, or WebP.");
    return false;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error("Image must be 5MB or smaller.");
    return false;
  }
  return true;
}

function validAudio(file: File): boolean {
  // An empty type means the OS didn't map the extension — let the API decide.
  if (file.type && !AUDIO_MIME.includes(file.type)) {
    toast.error("Audio must be MP3 or M4A.");
    return false;
  }
  if (file.size > MAX_AUDIO_BYTES) {
    toast.error("Audio must be 20MB or smaller.");
    return false;
  }
  return true;
}

// ─── One language's narration track ──────────
function AudioSlot({
  label,
  field,
  page,
  storyId,
  onUpdated,
}: {
  label: string;
  field: "audio_path_sq" | "audio_path_en";
  page: StoryPage;
  storyId: string;
  onUpdated: (p: StoryPage) => void;
}) {
  const [busy, setBusy] = useState(false);
  const url = page[field];

  // A computed key wouldn't narrow to UpdatePageRequest, so branch explicitly.
  const patch = (value: string) =>
    field === "audio_path_sq" ? { audio_path_sq: value } : { audio_path_en: value };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !validAudio(file)) return;
    setBusy(true);
    try {
      const uploaded = await uploadFile(
        file,
        storyId,
        field === "audio_path_sq" ? "audio_sq" : "audio_en"
      );
      onUpdated(await updatePage(storyId, page.id, patch(uploaded.url)));
      toast.success(`${label} audio updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  // Clears the pointer only — the file stays in storage, same as replacing
  // a page image.
  const remove = async () => {
    setBusy(true);
    try {
      onUpdated(await updatePage(storyId, page.id, patch("")));
      toast.success(`${label} audio removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {url ? (
        <>
          <audio controls preload="none" src={url} className="h-9 w-full" />
          <div className="flex gap-2">
            <label className="inline-block cursor-pointer">
              <span className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Music className="h-3.5 w-3.5" />}
                Replace
              </span>
              <input type="file" accept={AUDIO_ACCEPT.join(",")} className="hidden" onChange={upload} disabled={busy} />
            </label>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={remove} disabled={busy}>
              Remove
            </Button>
          </div>
        </>
      ) : (
        <label className="inline-block cursor-pointer">
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
            Add audio
          </span>
          <input type="file" accept={AUDIO_ACCEPT.join(",")} className="hidden" onChange={upload} disabled={busy} />
        </label>
      )}
    </div>
  );
}

// ─── One sortable page card ──────────────────
function SortablePage({
  page,
  index,
  storyId,
  onUpdated,
  onDelete,
}: {
  page: StoryPage;
  index: number;
  storyId: string;
  onUpdated: (p: StoryPage) => void;
  onDelete: (p: StoryPage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  const [sq, setSq] = useState(page.text_sq);
  const [en, setEn] = useState(page.text_en);
  const [savingText, setSavingText] = useState(false);
  const [uploading, setUploading] = useState(false);

  const textDirty = sq !== page.text_sq || en !== page.text_en;

  const saveText = async () => {
    if (!sq.trim() && !en.trim()) return toast.error("A page needs text in at least one language.");
    setSavingText(true);
    try {
      onUpdated(await updatePage(storyId, page.id, { text_sq: sq.trim(), text_en: en.trim() }));
      toast.success(`Page ${index + 1} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingText(false);
    }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !validImage(file)) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file, storyId, "page");
      onUpdated(await updatePage(storyId, page.id, { image_url: url }));
      toast.success("Image updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-60 ring-2 ring-ring" : ""}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-primary">Page {index + 1}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDelete(page)} aria-label="Delete page">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">🇦🇱 Shqip</Label>
            <Textarea value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Teksti në shqip…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">🇬🇧 English</Label>
            <Textarea value={en} onChange={(e) => setEn(e.target.value)} placeholder="Text in English…" />
          </div>
        </div>
        {textDirty && (
          <Button size="sm" onClick={saveText} disabled={savingText}>
            {savingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save text
          </Button>
        )}

        <Separator />

        <div className="flex items-start gap-4">
          <div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {page.image_url ? (
              <Image src={page.image_url} alt="" fill className="object-cover" unoptimized />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-block cursor-pointer">
              <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {page.image_url ? "Change image" : "Add image"}
              </span>
              <input type="file" accept={IMG_ACCEPT.join(",")} className="hidden" onChange={uploadImage} disabled={uploading} />
            </label>
            <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 5MB.</p>
          </div>
        </div>

        <details className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">
            Narration (optional)
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <AudioSlot label="🇦🇱 Shqip" field="audio_path_sq" page={page} storyId={storyId} onUpdated={onUpdated} />
            <AudioSlot label="🇬🇧 English" field="audio_path_en" page={page} storyId={storyId} onUpdated={onUpdated} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">MP3 or M4A · max 20MB per track.</p>
        </details>
      </CardContent>
    </Card>
  );
}

// ─── Page editor ─────────────────────────────
export function PageEditor({ storyId }: { storyId: string }) {
  const [story, setStory] = useState<StoryWithPages | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const [newSq, setNewSq] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StoryPage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    getStory(storyId)
      .then((s) => {
        setStory(s);
        setPages(s.pages);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load story"))
      .finally(() => setLoading(false));
  }, [storyId]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setPages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setOrderDirty(true);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const updated = await reorderPages(storyId, pages.map((p) => p.id));
      setPages(updated);
      setOrderDirty(false);
      toast.success("Page order saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setSavingOrder(false);
    }
  };

  const onPageUpdated = (p: StoryPage) =>
    setPages((prev) => prev.map((x) => (x.id === p.id ? p : x)));

  const pickNewImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !validImage(file)) return;
    setNewImage(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const addPage = async () => {
    if (!newSq.trim() && !newEn.trim()) return toast.error("Add text in at least one language.");
    setAdding(true);
    try {
      let imageUrl: string | undefined;
      if (newImage) imageUrl = (await uploadFile(newImage, storyId, "page")).url;
      const created = await createPage(storyId, {
        text_sq: newSq.trim(),
        text_en: newEn.trim(),
        image_url: imageUrl,
      });
      setPages((prev) => [...prev, created]);
      setNewSq("");
      setNewEn("");
      setNewImage(null);
      setNewImagePreview(null);
      toast.success("Page added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add page");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePage(storyId, deleteTarget.id);
      setPages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Page deleted");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-8 py-8">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to Stories
        </Link>
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{story?.title ?? "Pages"}</h1>
          <p className="text-sm text-muted-foreground">
            {pages.length} page{pages.length === 1 ? "" : "s"} · drag to reorder
          </p>
        </div>
        {orderDirty && (
          <Button onClick={saveOrder} disabled={savingOrder}>
            {savingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save order
          </Button>
        )}
      </div>

      {pages.length === 0 ? (
        <p className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
          No pages yet. Add your first page below.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {pages.map((page, i) => (
                <SortablePage
                  key={page.id}
                  page={page}
                  index={i}
                  storyId={storyId}
                  onUpdated={onPageUpdated}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add page */}
      <Card className="mt-6 border-dashed">
        <CardContent className="space-y-4 p-4">
          <h2 className="text-sm font-semibold">Add a page</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">🇦🇱 Shqip</Label>
              <Textarea value={newSq} onChange={(e) => setNewSq(e.target.value)} placeholder="Shkruaj tekstin në shqip…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">🇬🇧 English</Label>
              <Textarea value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="Write text in English…" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-block cursor-pointer">
              <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
                <ImagePlus className="h-4 w-4" />
                {newImage ? "Change image" : "Attach image"}
              </span>
              <input type="file" accept={IMG_ACCEPT.join(",")} className="hidden" onChange={pickNewImage} />
            </label>
            {newImagePreview && (
              <div className="relative h-12 w-16 overflow-hidden rounded border">
                <Image src={newImagePreview} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
          </div>
          <Button onClick={addPage} disabled={adding || (!newSq.trim() && !newEn.trim())}>
            {adding && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Page
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page?</DialogTitle>
            <DialogDescription>
              This page will be permanently removed and the remaining pages renumbered.
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
    </div>
  );
}

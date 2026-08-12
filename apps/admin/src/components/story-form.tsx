"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import type { DifficultyLevel, StoryWithPages } from "@calm-stories/shared";
import { DIFFICULTY_LEVELS, DIFFICULTY_LABELS } from "@calm-stories/shared";
import { createStory, updateStory, uploadFile } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function StoryForm({ story }: { story?: StoryWithPages }) {
  const router = useRouter();
  const isEditing = !!story;

  const [title, setTitle] = useState(story?.title ?? "");
  const [description, setDescription] = useState(story?.description ?? "");
  const [level, setLevel] = useState<DifficultyLevel>(story?.level ?? "beginner");
  const [isPremium, setIsPremium] = useState(story?.is_premium ?? false);
  const [isPublished, setIsPublished] = useState(story?.is_published ?? false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    story?.cover_image_url ?? null
  );
  const [saving, setSaving] = useState(false);

  const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Cover must be a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Cover image must be 5MB or smaller.");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required.");
    setSaving(true);
    try {
      if (isEditing && story) {
        let coverUrl = story.cover_image_url ?? undefined;
        if (coverFile) coverUrl = (await uploadFile(coverFile, story.id, "cover")).url;
        await updateStory(story.id, {
          title: title.trim(),
          description: description.trim(),
          level,
          is_premium: isPremium,
          is_published: isPublished,
          cover_image_url: coverUrl,
        });
        toast.success("Story saved");
        router.push("/dashboard");
        router.refresh();
      } else {
        const created = await createStory({
          title: title.trim(),
          description: description.trim(),
          level,
          is_premium: isPremium,
        });
        // Cover upload needs the new story id; apply it (and publish state) now.
        const patch: Parameters<typeof updateStory>[1] = {};
        if (coverFile) patch.cover_image_url = (await uploadFile(coverFile, created.id, "cover")).url;
        if (isPublished) patch.is_published = true;
        if (Object.keys(patch).length > 0) await updateStory(created.id, patch);
        toast.success("Story created — now add pages");
        router.push(`/stories/${created.id}/pages`);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to Stories
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Story" : "Create Story"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Good Morning Routine"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this story about?"
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty level</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as DifficultyLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {DIFFICULTY_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cover image</Label>
              <div className="flex items-center gap-4">
                <div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {coverPreview ? (
                    <Image src={coverPreview} alt="Cover" fill className="object-cover" unoptimized />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
                    {coverPreview ? "Change image" : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept={ACCEPTED.join(",")}
                    className="hidden"
                    onChange={onPickCover}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 5MB.</p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Premium content</Label>
                <p className="text-xs text-muted-foreground">Requires an active subscription.</p>
              </div>
              <Switch checked={isPremium} onCheckedChange={setIsPremium} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Published</Label>
                <p className="text-xs text-muted-foreground">Visible to readers in the app.</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button asChild variant="outline" type="button">
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving || !title.trim()}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Save changes" : "Create & add pages"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

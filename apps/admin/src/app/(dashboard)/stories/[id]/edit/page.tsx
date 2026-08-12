import { EditStoryClient } from "@/components/edit-story-client";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditStoryClient id={id} />;
}

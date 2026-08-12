import { PageEditor } from "@/components/page-editor";

export default async function PagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PageEditor storyId={id} />;
}

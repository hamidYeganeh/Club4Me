import { findResourceDefinition } from "@api/resources";
import { ResourceListScreen } from "@modules/resources/screens/ResourceListScreen";
import { notFound } from "next/navigation";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ category: string; resource: string }>;
}) {
  const { category, resource } = await params;
  const definition = findResourceDefinition(category, resource);
  if (!definition) notFound();
  return <ResourceListScreen definition={definition} />;
}

import { DiscoveryArticleDetailScreen } from "@modules/discovery/screens/DiscoveryArticleDetailScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/discovery/catalog/articles?limit=100",
    "articleId",
  );
}

export default async function DiscoveryArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <DiscoveryArticleDetailScreen articleId={articleId} />;
}

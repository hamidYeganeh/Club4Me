import { ArticlesEditScreen } from "@modules/articles/screens/ArticlesEditScreen";

type ArticlesEditPageProps = {
  params: Promise<{ articleId: string }>;
};

export default async function ArticlesEditPage({
  params,
}: ArticlesEditPageProps) {
  const { articleId } = await params;
  return <ArticlesEditScreen articleId={articleId} />;
}

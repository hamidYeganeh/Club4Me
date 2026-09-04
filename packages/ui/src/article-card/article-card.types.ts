export type ArticleCardOrientation = "horizontal" | "vertical";

export type ArticleCardTag = {
  id: string;
  label: string;
  kind?: "category" | "type" | (string & {});
};

export type ArticleCardProps = {
  title: string;
  description?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  badge?: string;
  authorName: string;
  authorAvatarUrl?: string;
  readTime?: string;
  tags?: ArticleCardTag[];
  tagsLabel?: string;
  orientation?: ArticleCardOrientation;
  outlined?: boolean;
  href?: string;
  menuAriaLabel?: string;
  onMenuPress?: () => void;
  className?: string;
};

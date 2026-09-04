import type { IconName } from "@repo/theme/icon";

export type ArticleCardOrientation = "horizontal" | "vertical";

export type ArticleCardTag = {
  id: string;
  label: string;
  kind?: "category" | "type" | (string & {});
  icon?: IconName;
};

export type ArticleCardProps = {
  title: string;
  description?: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string;
  badge?: string;
  authorName: string;
  authorAvatarUrl?: string | null;
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

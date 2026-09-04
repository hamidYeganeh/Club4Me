import type { IconName } from "@theme/icon";
import type { ArticleCardOrientation } from "@ui/article-card";

import type { DiscoveryArticleItem } from "@modules/discovery/discovery-articles.mock";

export type DiscoveryArticlesCardVariant = {
  orientation?: ArticleCardOrientation;
  outlined?: boolean;
};

export type DiscoveryArticlesRailSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  seeAllHref?: string;
  seeAllLabel?: string;
  items: DiscoveryArticleItem[];
  cardVariant?: DiscoveryArticlesCardVariant;
  className?: string;
};

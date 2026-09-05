export type FavoriteEntityType = "club" | "coach" | "class" | "article";

export type Favorite = {
  id: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
};

export type FavoritesResponse = { items: Favorite[] };

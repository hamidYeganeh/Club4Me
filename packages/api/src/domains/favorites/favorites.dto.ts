export type FavoriteEntityType = "club" | "coach" | "class";

export type Favorite = {
  id: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
};

export type FavoritesResponse = { items: Favorite[] };

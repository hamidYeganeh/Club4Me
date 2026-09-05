export {
  savesClient,
  useSavedItems,
  useToggleSave,
  useFavorites,
  useToggleFavorite,
} from "./favorites";
export type {
  Favorite,
  FavoriteEntityType,
  FavoritesResponse,
} from "./favorites.dto";

export type {
  Favorite as SavedItem,
  FavoriteEntityType as SavedEntityType,
  FavoritesResponse as SavedItemsResponse,
} from "./favorites.dto";

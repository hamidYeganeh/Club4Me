export type ApiSuccess<T> = {
  data: T;
  meta: {
    version: string;
  };
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type ItemList<T> = {
  items: T[];
};

export type ApiConfig = {
  baseURL: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
};

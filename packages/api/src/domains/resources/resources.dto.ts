import type { ResourceFieldDefinition } from "./resources.registry";

export type ResourceValue = string | number | boolean | string[] | null;
export type ResourceRecord = {
  id: string;
  code?: string;
  slug?: string;
  name?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  aliases?: string[];
  createdAt: string;
  updatedAt: string;
} & Record<string, ResourceValue | undefined>;
export type ResourceListParams = {
  search?: string;
  isActive?: boolean;
  parentId?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "code" | "slug" | "sortOrder" | "createdAt" | "updatedAt";
  sortDirection?: "asc" | "desc";
};
export type ResourceListResponse = {
  items: ResourceRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type ResourceMutationPayload = Record<string, ResourceValue | undefined>;
export type ResourceMutationContext = { category: string; resource: string };
export type ResourceField = ResourceFieldDefinition;
export type DeleteResourceResponse = { success: true };
export type SeedResourceResponse = {
  created: number;
  existing: number;
  dependenciesCreated: number;
  articlesCreated: number;
};

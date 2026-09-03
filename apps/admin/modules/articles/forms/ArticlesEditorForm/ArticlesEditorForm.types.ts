export type ArticlesEditorFormValues = {
  title: string;
  authorName: string;
  categoryId: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  status: "draft" | "published";
};

export type ArticlesEditorFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<ArticlesEditorFormValues>;
  categories: Array<{ id: string; name: string }>;
  categoriesLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (values: ArticlesEditorFormValues) => Promise<void>;
};

"use client";

import { EntityOptionContent, entityOptionText } from "@repo/ui/entity-option";
import { useEffect, useMemo, useRef } from "react";
import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Form, FormFieldset } from "@/components/form";
import { MediaUploaderField } from "@/components/media-uploader-field";
import { ArticlesEditorField } from "@modules/articles/components/ArticlesEditorField";

import { createArticlesEditorFormSchema } from "./ArticlesEditorForm.schema";
import { articlesEditorFormStyles } from "./ArticlesEditorForm.styles";
import type {
  ArticlesEditorFormProps,
  ArticlesEditorFormValues,
} from "./ArticlesEditorForm.types";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ArticlesEditorForm({
  mode,
  defaultValues,
  categories,
  categoriesLoading,
  isSubmitting,
  onSubmit,
}: ArticlesEditorFormProps) {
  const t = useTranslations("articlesPage");
  const styles = articlesEditorFormStyles();
  const slugTouched = useRef(Boolean(defaultValues?.slug));

  const schema = useMemo(
    () =>
      createArticlesEditorFormSchema({
        titleRequired: t("titleRequired"),
        authorRequired: t("authorRequired"),
        categoryRequired: t("categoryRequired"),
      }),
    [t],
  );

  const form = useForm<ArticlesEditorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      authorName: defaultValues?.authorName ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      slug: defaultValues?.slug ?? "",
      excerpt: defaultValues?.excerpt ?? "",
      bodyHtml: defaultValues?.bodyHtml ?? "",
      coverImageUrl: defaultValues?.coverImageUrl ?? "",
      status: defaultValues?.status ?? "draft",
    },
    mode: "onSubmit",
  });

  const title = useWatch({ control: form.control, name: "title" });

  useEffect(() => {
    if (mode === "edit" || slugTouched.current) {
      return;
    }

    form.setValue("slug", slugify(title), { shouldDirty: false });
  }, [form, mode, title]);

  useEffect(() => {
    if (!defaultValues) {
      return;
    }

    form.reset({
      title: defaultValues.title ?? "",
      authorName: defaultValues.authorName ?? "",
      categoryId: defaultValues.categoryId ?? "",
      slug: defaultValues.slug ?? "",
      excerpt: defaultValues.excerpt ?? "",
      bodyHtml: defaultValues.bodyHtml ?? "",
      coverImageUrl: defaultValues.coverImageUrl ?? "",
      status: defaultValues.status ?? "draft",
    });
    slugTouched.current = Boolean(defaultValues.slug);
  }, [defaultValues, form]);

  const busy = Boolean(isSubmitting);

  const handleSubmit = async (values: ArticlesEditorFormValues) => {
    await onSubmit({
      ...values,
      slug: values.slug.trim() || slugify(values.title),
    });
  };

  return (
    <Form form={form} className={styles.root()} onSubmit={handleSubmit}>
      <FormFieldset>
        <FormFieldset.Legend className="sr-only">
          {mode === "create" ? t("new") : t("edit")}
        </FormFieldset.Legend>
        <FormFieldset.Group className={styles.grid()}>
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                name={field.name}
                value={field.value}
                isDisabled={busy}
                isInvalid={fieldState.invalid}
                className={styles.field()}
                onBlur={field.onBlur}
                onChange={field.onChange}
              >
                <Label className={styles.label()}>{t("titleColumn")}</Label>
                <Input className={styles.input()} />
                {fieldState.error?.message ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />

          <Controller
            name="authorName"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                name={field.name}
                value={field.value}
                isDisabled={busy}
                isInvalid={fieldState.invalid}
                className={styles.field()}
                onBlur={field.onBlur}
                onChange={field.onChange}
              >
                <Label className={styles.label()}>{t("author")}</Label>
                <Input className={styles.input()} />
                {fieldState.error?.message ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />

          <Controller
            name="categoryId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className={styles.field()}>
                <Select
                  aria-label={t("category")}
                  isDisabled={busy || categoriesLoading}
                  placeholder={t("selectCategory")}
                  value={field.value || null}
                  onChange={(key) => {
                    if (typeof key === "string") {
                      field.onChange(key);
                    }
                  }}
                >
                  <Label className={styles.label()}>{t("category")}</Label>
                  <Select.Trigger className={styles.input()}>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {categories.map((item) => (
                        <ListBox.Item
                          dir="rtl"
                          key={item.id}
                          id={item.id}
                          textValue={entityOptionText(item, String(item.name))}
                        >
                          <EntityOptionContent
                            entity={item}
                            title={String(item.name)}
                          />
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                {fieldState.error?.message ? (
                  <p className={styles.error()}>{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                name={field.name}
                value={field.value}
                isDisabled={busy}
                isInvalid={fieldState.invalid}
                className={styles.field()}
                onBlur={field.onBlur}
                onChange={(value) => {
                  slugTouched.current = true;
                  field.onChange(value);
                }}
              >
                <Label className={styles.label()}>{t("slug")}</Label>
                <Input className={styles.input()} dir="ltr" />
                <p className={styles.hint()}>{t("slugHint")}</p>
              </TextField>
            )}
          />

          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <div className={styles.field()}>
                <Select
                  aria-label={t("status")}
                  isDisabled={busy}
                  value={field.value}
                  onChange={(key) => {
                    if (key === "draft" || key === "published") {
                      field.onChange(key);
                    }
                  }}
                >
                  <Label className={styles.label()}>{t("status")}</Label>
                  <Select.Trigger className={styles.input()}>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item dir="rtl" id="draft" textValue={t("draft")}>
                        {t("draft")}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item
                        dir="rtl"
                        id="published"
                        textValue={t("published")}
                      >
                        {t("published")}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            )}
          />
        </FormFieldset.Group>

        <Controller
          name="coverImageUrl"
          control={form.control}
          render={({ field }) => (
            <div className="mt-4">
              <MediaUploaderField
                label="تصویر شاخص مقاله"
                value={field.value}
                disabled={busy}
                onChange={field.onChange}
              />
            </div>
          )}
        />

        <Controller
          name="excerpt"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className={`${styles.field()} mt-4`}>
              <Label className={styles.label()} htmlFor="article-excerpt">
                {t("excerpt")}
              </Label>
              <TextArea
                id="article-excerpt"
                className={styles.textarea()}
                value={field.value}
                disabled={busy}
                rows={3}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(event.target.value)}
              />
              {fieldState.error?.message ? (
                <p className={styles.error()}>{fieldState.error.message}</p>
              ) : null}
            </div>
          )}
        />

        <Controller
          name="bodyHtml"
          control={form.control}
          render={({ field }) => (
            <div className={`${styles.editorWrap()} mt-4`}>
              <Label className={styles.label()}>{t("body")}</Label>
              <ArticlesEditorField
                value={field.value}
                onChange={field.onChange}
                disabled={busy}
              />
            </div>
          )}
        />
      </FormFieldset>

      <div className={styles.actions()}>
        <Button type="submit" variant="primary" isDisabled={busy}>
          {busy ? <Spinner size="sm" color="current" /> : null}
          {t("save")}
        </Button>
      </div>
    </Form>
  );
}

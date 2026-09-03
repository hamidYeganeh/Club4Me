"use client";

import { Button, Modal, Spinner, Switch, toast } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ResourceDefinition,
  ResourceFieldDefinition,
  ResourceMutationPayload,
  ResourceRecord,
} from "@api/resources";
import {
  useCreateResource,
  useResources,
  useUpdateResource,
} from "@api/resources";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";

type FormValue = string | boolean;
type FormValues = Record<string, FormValue>;
type DefinitionWithGroup = ResourceDefinition & { groupSegment: string };

const commonFields: readonly ResourceFieldDefinition[] = [
  { name: "name", label: "نام", kind: "text", required: true },
  { name: "code", label: "کد", kind: "text", required: true, immutable: true },
  { name: "slug", label: "اسلاگ", kind: "text" },
  { name: "description", label: "توضیحات", kind: "textarea" },
  { name: "icon", label: "آیکن", kind: "text" },
  { name: "imageUrl", label: "آدرس تصویر", kind: "url" },
  { name: "aliases", label: "نام‌های جایگزین", kind: "string-list" },
  { name: "sortOrder", label: "ترتیب نمایش", kind: "number", required: true },
];

function isSpecialPrimary(definition: DefinitionWithGroup): string {
  if (
    definition.key === "featured_collections" ||
    definition.key === "discovery_sections"
  )
    return "title";
  if (definition.key === "search_synonyms") return "canonicalTerm";
  if (definition.key === "popular_searches") return "phrase";
  return "name";
}

function needsCode(definition: DefinitionWithGroup): boolean {
  const specialized = new Set([
    "age_group_presets",
    "search_synonyms",
    "popular_searches",
    "badge_types",
    "featured_collections",
    "discovery_sections",
    "subscription_periods",
    "pricing_models",
  ]);
  return (
    !specialized.has(definition.key) ||
    definition.key === "badge_types" ||
    definition.key === "pricing_models"
  );
}

function fieldsFor(definition: DefinitionWithGroup): ResourceFieldDefinition[] {
  const primary = isSpecialPrimary(definition);
  const base = commonFields.filter((field) => {
    if (field.name === "name") return primary === "name";
    if (field.name === "code") return needsCode(definition);
    return true;
  });
  return [
    ...base,
    ...(definition.fields ?? []).filter(
      (field) => !base.some((baseField) => baseField.name === field.name),
    ),
  ];
}

function defaultValues(
  fields: readonly ResourceFieldDefinition[],
  record?: ResourceRecord,
): FormValues {
  const values: FormValues = { isActive: record?.isActive ?? true };
  for (const field of fields) {
    const value = record?.[field.name];
    values[field.name] = Array.isArray(value)
      ? value.join(", ")
      : typeof value === "boolean"
        ? value
        : value == null
          ? field.name === "sortOrder"
            ? "0"
            : ""
          : String(value).slice(0, field.kind === "date" ? 16 : undefined);
  }
  return values;
}

function makeSchema(fields: readonly ResourceFieldDefinition[]) {
  return z
    .record(z.string(), z.union([z.string(), z.boolean()]))
    .superRefine((values, context) => {
      for (const field of fields) {
        if (field.required && !String(values[field.name] ?? "").trim())
          context.addIssue({
            code: "custom",
            path: [field.name],
            message: "این فیلد الزامی است.",
          });
      }
    });
}

function RelationInput({
  field,
  value,
  onChange,
}: {
  field: ResourceFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("resourcesPage");
  const [search, setSearch] = useState("");
  const target = field.relation!;
  const resources = useResources(target.category, target.resource, {
    isActive: true,
    search,
    limit: 100,
  });
  const multiple = field.kind === "relation-list";
  const selected = new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required ? " *" : ""}
      </label>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("relationSearch")}
        className="h-9 w-full rounded-lg border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent"
      />
      {resources.isPending ? (
        <Spinner size="sm" />
      ) : (
        <select
          multiple={multiple}
          value={multiple ? [...selected] : value}
          onChange={(event) =>
            onChange(
              multiple
                ? Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ).join(",")
                : event.currentTarget.value,
            )
          }
          className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {!multiple && <option value="">{t("selectOption")}</option>}
          {(resources.data?.items ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {String(
                item.name ??
                  item.title ??
                  item.canonicalTerm ??
                  item.phrase ??
                  item.code ??
                  item.id,
              )}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function ResourceForm({
  definition,
  record,
  isOpen,
  onOpenChange,
}: {
  definition: DefinitionWithGroup;
  record?: ResourceRecord;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("resourcesPage");
  const fields = useMemo(() => fieldsFor(definition), [definition]);
  const schema = useMemo(() => makeSchema(fields), [fields]);
  const create = useCreateResource();
  const update = useUpdateResource();
  const mutationPending = create.isPending || update.isPending;
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaultValues(fields, record),
  });
  const imageUrl = useWatch({ control, name: "imageUrl" });

  useEffect(
    () => reset(defaultValues(fields, record)),
    [fields, record, reset, isOpen],
  );

  const submit = async (values: FormValues) => {
    const payload: ResourceMutationPayload = {
      isActive: Boolean(values.isActive),
    };
    for (const field of fields) {
      const raw = String(values[field.name] ?? "").trim();
      if (!raw) {
        if (
          record &&
          record[field.name] != null &&
          !field.required &&
          !field.immutable
        ) {
          payload[field.name] = null;
        }
        continue;
      }
      if (field.kind === "number") payload[field.name] = Number(raw);
      else if (field.kind === "string-list" || field.kind === "relation-list")
        payload[field.name] = raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      else payload[field.name] = raw;
    }
    try {
      if (record)
        await update.mutateAsync({
          category: definition.groupSegment,
          resource: definition.segment,
          id: record.id,
          payload,
        });
      else
        await create.mutateAsync({
          category: definition.groupSegment,
          resource: definition.segment,
          payload,
        });
      toast.success(record ? t("updateSuccess") : t("createSuccess"));
      onOpenChange(false);
    } catch {
      toast.danger(t("mutationError"));
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
      <Modal.Container size="lg" scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {record
                ? t("editTitle", { entity: definition.label })
                : t("createTitle", { entity: definition.label })}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form
              id="resource-form"
              onSubmit={handleSubmit(submit)}
              className="grid gap-4 sm:grid-cols-2"
            >
              {fields.map((field) => {
                const error = errors[field.name]?.message;
                if (field.kind === "relation" || field.kind === "relation-list")
                  return (
                    <Controller
                      key={field.name}
                      name={field.name}
                      control={control}
                      render={({ field: controlled }) => (
                        <RelationInput
                          field={field}
                          value={String(controlled.value ?? "")}
                          onChange={controlled.onChange}
                        />
                      )}
                    />
                  );
                const multiline =
                  field.kind === "textarea" || field.kind === "string-list";
                return (
                  <label
                    key={field.name}
                    className={`space-y-1.5 ${multiline ? "sm:col-span-2" : ""}`}
                  >
                    <span className="text-sm font-medium">
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    {multiline ? (
                      <textarea
                        {...register(field.name)}
                        rows={field.kind === "textarea" ? 3 : 2}
                        disabled={field.immutable && Boolean(record)}
                        className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                    ) : field.kind === "enum" ? (
                      <select
                        {...register(field.name)}
                        className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent"
                      >
                        <option value="">{t("selectOption")}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        {...register(field.name)}
                        type={
                          field.kind === "number"
                            ? "number"
                            : field.kind === "date"
                              ? "datetime-local"
                              : field.kind === "url"
                                ? "url"
                                : "text"
                        }
                        min={field.kind === "number" ? 0 : undefined}
                        disabled={field.immutable && Boolean(record)}
                        dir={
                          field.name === "code" ||
                          field.name === "slug" ||
                          field.kind === "url"
                            ? "ltr"
                            : undefined
                        }
                        className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent disabled:opacity-60"
                      />
                    )}
                    {error && (
                      <span className="block text-xs text-danger">
                        {String(error)}
                      </span>
                    )}
                  </label>
                );
              })}
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    isSelected={Boolean(field.value)}
                    onChange={field.onChange}
                  >
                    {t("active")}
                  </Switch>
                )}
              />
              {String(imageUrl ?? "") && (
                <div className="flex items-end gap-3 sm:col-span-2">
                  <img
                    src={String(imageUrl)}
                    alt={t("imagePreview")}
                    className="h-28 w-40 rounded-xl object-cover"
                  />
                  <Button
                    type="button"
                    variant="tertiary"
                    onPress={() => setValue("imageUrl", "")}
                  >
                    {t("removeImage")}
                  </Button>
                </div>
              )}
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              form="resource-form"
              isPending={mutationPending}
            >
              {mutationPending ? <Spinner size="sm" color="current" /> : null}
              {t("save")}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

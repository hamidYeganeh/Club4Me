"use client";

import { EntityOptionContent, entityOptionText } from "@repo/ui/entity-option";
import {
  Button,
  Checkbox,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Switch,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
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
import { Controller, useForm, type Resolver } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { IconPicker } from "@/components/icon-picker";
import { MediaUploaderField } from "@/components/media-uploader-field";

type FormValue = string | boolean;
type FormValues = Record<string, FormValue>;
type DefinitionWithGroup = ResourceDefinition & { groupSegment: string };

const commonFields: readonly ResourceFieldDefinition[] = [
  { name: "name", label: "نام", kind: "text", required: true },
  { name: "code", label: "کد", kind: "text", required: true, immutable: true },
  { name: "slug", label: "اسلاگ", kind: "text" },
  { name: "description", label: "توضیحات", kind: "textarea" },
  { name: "icon", label: "آیکن", kind: "text" },
  { name: "imageUrl", label: "تصویر", kind: "url" },
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
    "club_tags",
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
      <TextField value={search} onChange={setSearch}>
        <Label className="text-sm font-medium">{t("relationSearch")}</Label>
        <Input variant="secondary" />
      </TextField>
      {resources.isPending ? (
        <Spinner size="sm" />
      ) : multiple ? (
        <div className="max-h-48 space-y-2 overflow-auto rounded-xl border border-border p-3">
          {(resources.data?.items ?? []).map((item) => {
            const text = String(
              item.name ??
                item.title ??
                item.canonicalTerm ??
                item.phrase ??
                item.code ??
                item.id,
            );
            return (
              <Checkbox
                key={item.id}
                isSelected={selected.has(item.id)}
                onChange={(isSelected) => {
                  const next = new Set(selected);
                  if (isSelected) next.add(item.id);
                  else next.delete(item.id);
                  onChange(Array.from(next).join(","));
                }}
              >
                {text}
              </Checkbox>
            );
          })}
        </div>
      ) : (
        <Select
          value={value || null}
          placeholder={t("selectOption")}
          onChange={(key) => {
            if (typeof key === "string") onChange(key);
          }}
        >
          <Label className="text-sm font-medium">
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          <Select.Trigger className="h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {(resources.data?.items ?? []).map((item) => {
                const text = String(
                  item.name ??
                    item.title ??
                    item.canonicalTerm ??
                    item.phrase ??
                    item.code ??
                    item.id,
                );
                return (
                  <ListBox.Item
                    dir="rtl"
                    key={item.id}
                    id={item.id}
                    textValue={entityOptionText(item, String(text))}
                  >
                    <EntityOptionContent entity={item} title={String(text)} />
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                );
              })}
            </ListBox>
          </Select.Popover>
        </Select>
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
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaultValues(fields, record),
  });
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
      <Modal.Container size="lg" scroll="inside" className="px-3 py-5 sm:px-6">
        <Modal.Dialog
          className="overflow-hidden rounded-[1.75rem]"
          style={{ maxWidth: "48rem" }}
        >
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
              className="grid gap-x-5 gap-y-5 sm:grid-cols-2"
            >
              {fields.map((field) => (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  render={({ field: controlled, fieldState }) => {
                    if (field.name === "icon")
                      return (
                        <IconPicker
                          value={String(controlled.value ?? "")}
                          onChange={controlled.onChange}
                          disabled={mutationPending}
                        />
                      );

                    if (field.name === "imageUrl")
                      return (
                        <MediaUploaderField
                          label={field.label}
                          value={String(controlled.value ?? "")}
                          disabled={mutationPending}
                          onChange={controlled.onChange}
                        />
                      );

                    const multiline =
                      field.kind === "textarea" || field.kind === "string-list";

                    if (
                      field.kind === "relation" ||
                      field.kind === "relation-list"
                    )
                      return (
                        <div
                          className={
                            multiline
                              ? "space-y-1.5 sm:col-span-2"
                              : "space-y-1.5"
                          }
                        >
                          <RelationInput
                            field={field}
                            value={String(controlled.value ?? "")}
                            onChange={controlled.onChange}
                          />
                          {fieldState.error?.message ? (
                            <span className="block text-xs text-danger">
                              {String(fieldState.error.message)}
                            </span>
                          ) : null}
                        </div>
                      );

                    if (field.kind === "enum")
                      return (
                        <div
                          className={
                            multiline
                              ? "space-y-1.5 sm:col-span-2"
                              : "space-y-1.5"
                          }
                        >
                          <Select
                            value={String(controlled.value ?? "") || null}
                            placeholder={t("selectOption")}
                            onChange={(key) => {
                              if (typeof key === "string")
                                controlled.onChange(key);
                            }}
                          >
                            <Label className="text-sm font-semibold">
                              {field.label}
                              {field.required ? " *" : ""}
                            </Label>
                            <Select.Trigger className="h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm">
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                {field.options?.map((option) => (
                                  <ListBox.Item
                                    dir="rtl"
                                    key={option}
                                    id={option}
                                    textValue={option}
                                  >
                                    {option}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                          {fieldState.error?.message ? (
                            <span className="block text-xs text-danger">
                              {String(fieldState.error.message)}
                            </span>
                          ) : null}
                        </div>
                      );

                    if (multiline)
                      return (
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-sm font-semibold">
                            {field.label}
                            {field.required ? " *" : ""}
                          </Label>
                          <TextArea
                            value={String(controlled.value ?? "")}
                            rows={field.kind === "textarea" ? 3 : 2}
                            disabled={field.immutable && Boolean(record)}
                            onBlur={controlled.onBlur}
                            onChange={(event) =>
                              controlled.onChange(event.target.value)
                            }
                            className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm"
                          />
                          {fieldState.error?.message ? (
                            <span className="block text-xs text-danger">
                              {String(fieldState.error.message)}
                            </span>
                          ) : null}
                        </div>
                      );

                    return (
                      <TextField
                        name={controlled.name}
                        value={String(controlled.value ?? "")}
                        isDisabled={field.immutable && Boolean(record)}
                        isInvalid={fieldState.invalid}
                        className="space-y-1.5"
                        onBlur={controlled.onBlur}
                        onChange={controlled.onChange}
                      >
                        <Label className="text-sm font-semibold">
                          {field.label}
                          {field.required ? " *" : ""}
                        </Label>
                        <Input
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
                          dir={
                            field.name === "code" ||
                            field.name === "slug" ||
                            field.kind === "url"
                              ? "ltr"
                              : undefined
                          }
                          variant="secondary"
                          className="h-11 rounded-xl"
                        />
                        {fieldState.error?.message ? (
                          <span className="block text-xs text-danger">
                            {String(fieldState.error.message)}
                          </span>
                        ) : null}
                      </TextField>
                    );
                  }}
                />
              ))}
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

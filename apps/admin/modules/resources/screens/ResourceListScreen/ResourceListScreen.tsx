"use client";

import {
  Button,
  Card,
  Chip,
  Dropdown,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  Table,
  toast,
} from "@heroui/react";
import type { ResourceDefinition, ResourceRecord } from "@api/resources";
import {
  useDeleteResource,
  useResource,
  useResources,
  useSeedResource,
  useToggleResourceStatus,
} from "@api/resources";
import { Icon } from "@theme/icon";
import { useDeferredValue, useState } from "react";
import { useTranslations } from "next-intl";

import { ResourceForm } from "@modules/resources/forms/ResourceForm";

type DefinitionWithGroup = ResourceDefinition & { groupSegment: string };

function displayName(item: ResourceRecord): string {
  return String(
    item.name ??
      item.title ??
      item.canonicalTerm ??
      item.phrase ??
      item.code ??
      item.id,
  );
}

function RelationName({
  fieldName,
  value,
  definition,
}: {
  fieldName: string;
  value: unknown;
  definition: DefinitionWithGroup;
}) {
  const relation = definition.fields?.find(
    (field) => field.name === fieldName,
  )?.relation;
  const id = typeof value === "string" ? value : undefined;
  const query = useResource(
    relation?.category ?? "",
    relation?.resource ?? "",
    id,
    Boolean(relation && id),
  );
  return (
    <span className="text-muted">
      {query.data ? displayName(query.data) : (id ?? "—")}
    </span>
  );
}

function ParentFilter({
  definition,
  value,
  onChange,
}: {
  definition: NonNullable<ResourceDefinition["fields"]>[number];
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("resourcesPage");
  const relation = definition.relation!;
  const options = useResources(relation.category, relation.resource, {
    isActive: true,
    limit: 100,
  });
  return (
    <Select
      value={value}
      onChange={(next) => {
        if (typeof next === "string") onChange(next);
      }}
    >
      <Label className="sr-only">{definition.label}</Label>
      <Select.Trigger className="h-10 rounded-xl border border-border bg-surface-secondary px-3 text-sm">
        <Select.Value
          placeholder={t("allParents", { parent: definition.label })}
        />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item
            id=""
            textValue={t("allParents", { parent: definition.label })}
          >
            {t("allParents", { parent: definition.label })}
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {(options.data?.items ?? []).map((item) => (
            <ListBox.Item
              key={item.id}
              id={item.id}
              textValue={displayName(item)}
            >
              {displayName(item)}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function ResourceListScreen({
  definition,
}: {
  definition: DefinitionWithGroup;
}) {
  const t = useTranslations("resourcesPage");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState<
    "name" | "code" | "sortOrder" | "createdAt"
  >("sortOrder");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [parentId, setParentId] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRecord | undefined>();
  const parentField = definition.fields?.find(
    (field) => field.kind === "relation",
  );
  const list = useResources(definition.groupSegment, definition.segment, {
    search: deferredSearch || undefined,
    isActive: status === "all" ? undefined : status === "active",
    parentId: parentId || undefined,
    page,
    limit: 20,
    sortBy,
    sortDirection,
  });
  const toggle = useToggleResourceStatus();
  const remove = useDeleteResource();
  const seed = useSeedResource();
  const items = list.data?.items ?? [];

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const handleSeed = async () => {
    if (!window.confirm(t("confirmSeed", { entity: definition.label }))) return;
    try {
      const result = await seed.mutateAsync({
        category: definition.groupSegment,
        resource: definition.segment,
      });
      toast.success(
        t("seedSuccess", {
          created: result.created,
          dependencies: result.dependenciesCreated,
          existing: result.existing,
          articles: result.articlesCreated,
        }),
      );
    } catch {
      toast.danger(t("seedError"));
    }
  };
  const handleAction = async (action: React.Key, item: ResourceRecord) => {
    if (action === "edit") {
      setEditing(item);
      setFormOpen(true);
      return;
    }
    if (action === "toggle") {
      if (
        !window.confirm(
          item.isActive ? t("confirmDeactivate") : t("confirmActivate"),
        )
      )
        return;
      try {
        await toggle.mutateAsync({
          category: definition.groupSegment,
          resource: definition.segment,
          id: item.id,
          isActive: !item.isActive,
        });
        toast.success(t("statusSuccess"));
      } catch {
        toast.danger(t("mutationError"));
      }
      return;
    }
    if (action === "delete" && window.confirm(t("confirmDelete"))) {
      try {
        await remove.mutateAsync({
          category: definition.groupSegment,
          resource: definition.segment,
          id: item.id,
        });
        toast.success(t("deleteSuccess"));
      } catch {
        toast.danger(t("deleteError"));
      }
    }
  };

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{definition.label}</h1>
          <p className="mt-1 text-sm text-muted">{definition.description}</p>
          <p className="mt-2 text-xs text-muted">
            {t("total", { count: list.data?.total ?? 0 })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            isPending={seed.isPending}
            onPress={handleSeed}
          >
            <Icon name="database" />
            {seed.isPending ? t("seeding") : t("seed")}
          </Button>
          <Button onPress={openCreate}>
            <Icon name="plus-fat" />
            {t("create")}
          </Button>
        </div>
      </div>
      <Card
        variant="transparent"
        className="mt-5 items-stretch overflow-hidden rounded-[1.75rem] border border-border bg-surface"
      >
        <div className="flex flex-wrap gap-3 border-b border-border p-4 [&>label]:min-w-60 [&>label]:flex-1">
          <label>
            <span className="sr-only">{t("search")}</span>
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("search")}
              variant="secondary"
              className="h-10 w-full rounded-xl text-sm"
            />
          </label>
          <Select
            value={status}
            onChange={(next) => {
              if (typeof next === "string") {
                setStatus(next);
                setPage(1);
              }
            }}
          >
            <Label className="sr-only">{t("statusFilter")}</Label>
            <Select.Trigger className="h-10 rounded-xl border border-border bg-surface-secondary px-3 text-sm">
              <Select.Value placeholder={t("statusFilter")} />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue={t("all")}>
                  {t("all")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="active" textValue={t("active")}>
                  {t("active")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="inactive" textValue={t("inactive")}>
                  {t("inactive")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          {parentField && (
            <ParentFilter
              definition={parentField}
              value={parentId}
              onChange={(value) => {
                setParentId(value);
                setPage(1);
              }}
            />
          )}
          <Select
            value={sortBy}
            onChange={(next) => {
              if (
                next === "name" ||
                next === "code" ||
                next === "sortOrder" ||
                next === "createdAt"
              ) {
                setSortBy(next);
              }
            }}
          >
            <Label className="sr-only">{t("sort")}</Label>
            <Select.Trigger className="h-10 rounded-xl border border-border bg-surface-secondary px-3 text-sm">
              <Select.Value placeholder={t("sort")} />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="sortOrder" textValue={t("sortOrder")}>
                  {t("sortOrder")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="name" textValue={t("name")}>
                  {t("name")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="code" textValue={t("code")}>
                  {t("code")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="createdAt" textValue={t("createdAt")}>
                  {t("createdAt")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          <Button
            isIconOnly
            variant="secondary"
            aria-label={t("sortDirection")}
            onPress={() =>
              setSortDirection((value) => (value === "asc" ? "desc" : "asc"))
            }
          >
            <Icon name={sortDirection === "asc" ? "arrow-up" : "arrow-down"} />
          </Button>
        </div>
        {list.isPending ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : list.isError ? (
          <div className="px-6 py-16 text-center">
            <p className="text-muted">{t("loadError")}</p>
            <Button
              className="mt-4"
              variant="secondary"
              onPress={() => list.refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            {search || status !== "all" || parentId
              ? t("noResult")
              : t("empty")}
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={definition.label}>
                <Table.Header>
                  <Table.Column isRowHeader>{t("name")}</Table.Column>
                  <Table.Column>{t("code")}</Table.Column>
                  {parentField && (
                    <Table.Column>{parentField.label}</Table.Column>
                  )}
                  <Table.Column>{t("status")}</Table.Column>
                  <Table.Column>{t("sortOrder")}</Table.Column>
                  <Table.Column>{t("updatedAt")}</Table.Column>
                  <Table.Column>{t("actions")}</Table.Column>
                </Table.Header>
                <Table.Body>
                  {items.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell className="font-medium">
                        {displayName(item)}
                      </Table.Cell>
                      <Table.Cell
                        dir="ltr"
                        className="font-mono text-xs text-muted"
                      >
                        {item.code ?? "—"}
                      </Table.Cell>
                      {parentField && (
                        <Table.Cell>
                          <RelationName
                            fieldName={parentField.name}
                            value={item[parentField.name]}
                            definition={definition}
                          />
                        </Table.Cell>
                      )}
                      <Table.Cell>
                        <Chip
                          size="sm"
                          color={item.isActive ? "success" : "danger"}
                        >
                          {item.isActive ? t("active") : t("inactive")}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="tabular-nums">
                        {item.sortOrder}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-muted">
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "medium",
                        }).format(new Date(item.updatedAt))}
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            aria-label={t("actions")}
                          >
                            <Icon name="dot-three-horizontal" />
                          </Button>
                          <Dropdown.Popover>
                            <Dropdown.Menu
                              onAction={(key) => handleAction(key, item)}
                            >
                              <Dropdown.Item id="edit" textValue={t("edit")}>
                                <Label>{t("edit")}</Label>
                              </Dropdown.Item>
                              <Dropdown.Item
                                id="toggle"
                                textValue={
                                  item.isActive
                                    ? t("deactivate")
                                    : t("activate")
                                }
                              >
                                <Label>
                                  {item.isActive
                                    ? t("deactivate")
                                    : t("activate")}
                                </Label>
                              </Dropdown.Item>
                              <Dropdown.Item
                                id="delete"
                                textValue={t("delete")}
                                variant="danger"
                              >
                                <Label>{t("delete")}</Label>
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
        {(list.data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4">
            <Button
              size="sm"
              variant="secondary"
              isDisabled={page <= 1}
              onPress={() => setPage((value) => value - 1)}
            >
              {t("previous")}
            </Button>
            <span className="text-sm text-muted">
              {t("page", { page, total: list.data?.totalPages ?? 1 })}
            </span>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={page >= (list.data?.totalPages ?? 1)}
              onPress={() => setPage((value) => value + 1)}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </Card>
      <ResourceForm
        definition={definition}
        record={editing}
        isOpen={isFormOpen}
        onOpenChange={setFormOpen}
      />
    </main>
  );
}

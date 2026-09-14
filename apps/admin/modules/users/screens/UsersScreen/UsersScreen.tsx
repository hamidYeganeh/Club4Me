"use client";
import { useConfirmActionDialog } from "@repo/ui/confirm-action-dialog";

import { useSearchParams } from "next/navigation";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { useDeferredValue, useState } from "react";
import {
  Button,
  Card,
  Chip,
  Input,
  Spinner,
  Table,
  toast,
} from "@heroui/react";
import {
  type AdminUser,
  useAdminUsers,
  useUpdateAdminUserStatus,
} from "@api/admin";
import { EntityDetailsModal } from "@ui/entity-details-modal";

const roleLabels: Record<string, string> = {
  admin: "مدیر",
  owner: "مالک باشگاه",
  coach: "مربی",
  athlete: "ورزشکار",
  user: "کاربر",
  staff: "کارمند",
  receptionist: "پذیرش",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function UsersScreen() {
  const confirmation = useConfirmActionDialog();
  const params = useSearchParams();
  const search = params.get("q") ?? "";
  const role = params.get("role") ?? "";
  const statusFilter = params.get("status") ?? "";
  const setFilter = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, "", url);
  };
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const query = useDeferredValue(search.trim());
  const users = useAdminUsers(query || undefined);
  const update = useUpdateAdminUserStatus();

  const changeStatus = async (
    userId: string,
    status: "active" | "suspended",
  ) => {
    if (
      !(await confirmation.confirm(
        status === "suspended"
          ? "این کاربر تعلیق شود؟"
          : "حساب کاربر دوباره فعال شود؟",
      ))
    )
      return;
    try {
      await update.mutateAsync({ userId, status });
      toast.success("وضعیت کاربر تغییر کرد");
    } catch {
      toast.danger("تغییر وضعیت کاربر ناموفق بود");
    }
  };
  const renderActions = (user: AdminUser) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" onPress={() => setSelected(user)}>
        جزئیات
      </Button>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={update.isPending}
        onPress={() =>
          void changeStatus(
            user.id,
            user.status === "active" ? "suspended" : "active",
          )
        }
      >
        {user.status === "active" ? "تعلیق" : "فعال‌سازی"}
      </Button>
    </div>
  );
  const items = (users.data?.items ?? []).filter(
    (user) =>
      (!role || user.roles.includes(role)) &&
      (!statusFilter || user.status === statusFilter),
  );

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      {confirmation.dialog}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">مدیریت کاربران</h1>
        <Input
          type="search"
          value={search}
          onChange={(event) => setFilter("q", event.target.value)}
          placeholder="نام یا شماره موبایل"
          aria-label="جست‌وجوی کاربر"
          className="h-11 rounded-xl"
          variant="secondary"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FormSelect
          className="w-full sm:w-44"
          aria-label="فیلتر نقش"
          value={role}
          onChange={(value) => setFilter("role", value)}
        >
          <FormOption value="">همه نقش‌ها</FormOption>
          {Object.entries(roleLabels).map(([value, label]) => (
            <FormOption key={value} value={value}>
              {label}
            </FormOption>
          ))}
        </FormSelect>
        <FormSelect
          className="w-full sm:w-44"
          aria-label="فیلتر وضعیت"
          value={statusFilter}
          onChange={(value) => setFilter("status", value)}
        >
          <FormOption value="">همه وضعیت‌ها</FormOption>
          <FormOption value="active">فعال</FormOption>
          <FormOption value="suspended">تعلیق</FormOption>
        </FormSelect>
        <p role="status" className="text-sm text-muted">
          {items.length.toLocaleString("fa-IR")} کاربر در نتایج دریافتی
        </p>
      </div>
      <Card
        variant="transparent"
        className="mt-5 overflow-hidden rounded-[1.75rem] bg-surface"
      >
        {users.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner aria-label="در حال دریافت کاربران" />
          </div>
        ) : users.isError ? (
          <div className="p-8 text-center">
            <p className="text-muted">دریافت کاربران ناموفق بود.</p>
            <Button
              className="mt-4"
              variant="secondary"
              onPress={() => users.refetch()}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="p-12 text-center text-muted">کاربری پیدا نشد.</p>
        ) : (
          <>
            <div className="grid gap-3 p-3 md:hidden" aria-label="کاربران">
              {items.map((user) => (
                <article
                  key={user.id}
                  className="rounded-2xl border border-border p-4 space-y-2"
                >
                  <h2 className="font-bold">
                    {[user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(" ") || "بدون نام"}
                  </h2>
                  <p dir="ltr" className="text-start text-sm">
                    {user.phone}
                  </p>
                  <p className="text-sm text-muted">
                    {user.roles
                      .map((role) => roleLabels[role] ?? role)
                      .join("، ")}
                  </p>
                  <p className="text-sm">
                    {user.status === "active" ? "فعال" : "تعلیق"}
                  </p>
                  <Button variant="secondary" onPress={() => setSelected(user)}>
                    مشاهده پرونده
                  </Button>
                  <details>
                    <summary className="cursor-pointer py-3 text-sm">
                      اقدامات بیشتر
                    </summary>
                    {renderActions(user)}
                  </details>
                </article>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="کاربران">
                    <Table.Header>
                      <Table.Column isRowHeader>کاربر</Table.Column>
                      <Table.Column>موبایل</Table.Column>
                      <Table.Column>نقش‌ها</Table.Column>
                      <Table.Column>وضعیت</Table.Column>
                      <Table.Column>عملیات</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {items.map((user) => (
                        <Table.Row key={user.id} id={user.id}>
                          <Table.Cell>
                            {[user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(" ") || "بدون نام"}
                          </Table.Cell>
                          <Table.Cell dir="ltr">{user.phone}</Table.Cell>
                          <Table.Cell>
                            {user.roles
                              .map((role) => roleLabels[role] ?? role)
                              .join("، ")}
                          </Table.Cell>
                          <Table.Cell>
                            <Chip
                              size="sm"
                              color={
                                user.status === "active" ? "success" : "danger"
                              }
                            >
                              {user.status === "active" ? "فعال" : "تعلیق"}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>{renderActions(user)}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
          </>
        )}
      </Card>
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={
          selected
            ? [selected.firstName, selected.lastName]
                .filter(Boolean)
                .join(" ") || "کاربر بدون نام"
            : "جزئیات کاربر"
        }
        description="اطلاعات هویتی، سطح دسترسی و تاریخچه حساب"
        sections={
          selected
            ? [
                {
                  title: "حساب",
                  items: [
                    { label: "شناسه کاربر", value: selected.id, dir: "ltr" },
                    {
                      label: "شماره موبایل",
                      value: selected.phone,
                      dir: "ltr",
                    },
                    { label: "نام", value: selected.firstName },
                    { label: "نام خانوادگی", value: selected.lastName },
                    {
                      label: "نقش‌ها",
                      value: selected.roles
                        .map((role) => roleLabels[role] ?? role)
                        .join("، "),
                    },
                    {
                      label: "وضعیت",
                      value: selected.status === "active" ? "فعال" : "تعلیق",
                    },
                  ],
                },
                {
                  title: "زمان‌ها",
                  items: [
                    {
                      label: "ایجاد حساب",
                      value: formatDateTime(selected.createdAt),
                    },
                    {
                      label: "آخرین تغییر",
                      value: formatDateTime(selected.updatedAt),
                    },
                  ],
                },
              ]
            : []
        }
      />
    </main>
  );
}

"use client";

import { useDeferredValue, useState } from "react";
import { Button, Card, Chip, Input, Spinner, Table, toast } from "@heroui/react";
import { useAdminUsers, useUpdateAdminUserStatus } from "@api/admin";

export function UsersScreen() {
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim());
  const users = useAdminUsers(query || undefined);
  const update = useUpdateAdminUserStatus();
  const changeStatus = async (userId: string, status: "active" | "suspended") => {
    if (!window.confirm(status === "suspended" ? "این کاربر تعلیق شود؟" : "حساب کاربر دوباره فعال شود؟")) return;
    try {
      await update.mutateAsync({ userId, status });
      toast.success("وضعیت کاربر تغییر کرد");
    } catch {
      toast.danger("تغییر وضعیت کاربر ناموفق بود");
    }
  };
  const items = users.data?.items ?? [];
  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">مدیریت کاربران</h1>
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="نام یا شماره موبایل"
          className="h-11 rounded-xl"
          variant="secondary"
        />
      </div>
      <Card variant="transparent" className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface">
        {users.isLoading ? <div className="flex justify-center py-16"><Spinner /></div> : users.isError ? <Button className="m-8" onPress={() => users.refetch()}>تلاش دوباره</Button> : items.length === 0 ? <p className="p-12 text-center text-muted">کاربری پیدا نشد.</p> : (
          <Table><Table.ScrollContainer><Table.Content aria-label="کاربران"><Table.Header><Table.Column isRowHeader>کاربر</Table.Column><Table.Column>موبایل</Table.Column><Table.Column>نقش‌ها</Table.Column><Table.Column>وضعیت</Table.Column><Table.Column>عملیات</Table.Column></Table.Header><Table.Body>
            {items.map((user) => <Table.Row key={user.id} id={user.id}><Table.Cell>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "بدون نام"}</Table.Cell><Table.Cell dir="ltr">{user.phone}</Table.Cell><Table.Cell>{user.roles.join("، ")}</Table.Cell><Table.Cell><Chip size="sm" color={user.status === "active" ? "success" : "danger"}>{user.status === "active" ? "فعال" : "تعلیق"}</Chip></Table.Cell><Table.Cell><Button size="sm" variant="secondary" isDisabled={update.isPending} onPress={() => void changeStatus(user.id, user.status === "active" ? "suspended" : "active")}>{user.status === "active" ? "تعلیق" : "فعال‌سازی"}</Button></Table.Cell></Table.Row>)}
          </Table.Body></Table.Content></Table.ScrollContainer></Table>
        )}
      </Card>
    </main>
  );
}

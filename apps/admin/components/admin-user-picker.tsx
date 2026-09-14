"use client";
import { useDeferredValue, useState } from "react";
import { useAdminUsers } from "@api/admin";
import { Button, Input } from "@heroui/react";
import { FormSelect, FormOption } from "@repo/ui/form-select";
export function AdminUserPicker() {
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim());
  const users = useAdminUsers(query || undefined);
  const [selected, setSelected] = useState("");
  return (
    <div className="grid gap-2">
      <label htmlFor="wallet-user-search">جستجوی کاربر با نام یا موبایل</label>
      <Input
        id="wallet-user-search"
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelected("");
        }}
        placeholder="نام یا شماره موبایل"
      />
      {users.isError ? (
        <div role="alert">
          دریافت کاربران انجام نشد.{" "}
          <Button variant="secondary" onPress={() => users.refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : (
        <>
          <FormSelect
            name="userId"
            required
            aria-label="کاربر دریافت‌کننده اعتبار"
            value={selected}
            onChange={setSelected}
          >
            <FormOption value="">انتخاب کاربر</FormOption>
            {(users.data?.items ?? []).map((user) => (
              <FormOption key={user.id} value={user.id}>
                {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  "بدون نام"}{" "}
                — {user.phone}
              </FormOption>
            ))}
          </FormSelect>
          <p role="status" className="text-sm text-muted">
            {users.isPending
              ? "در حال دریافت کاربران…"
              : !users.data?.items.length
                ? "کاربری پیدا نشد؛ نام یا شماره دیگری جستجو کنید."
                : selected
                  ? "پیش از ثبت، نام و شماره دریافت‌کننده را بررسی کنید."
                  : "کاربر دریافت‌کننده را انتخاب کنید."}
          </p>
        </>
      )}
    </div>
  );
}

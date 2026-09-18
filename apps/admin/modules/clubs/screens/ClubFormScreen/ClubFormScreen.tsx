"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Input, Spinner, TextArea, toast } from "@heroui/react";
import {
  useAdminClubs,
  useAdminUsers,
  useCreateAdminClub,
  useUpdateAdminClub,
} from "@api/admin";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/button-link";

type ClubFormScreenProps = {
  clubId?: string;
};

export function ClubFormScreen({ clubId }: ClubFormScreenProps) {
  const router = useRouter();
  const clubs = useAdminClubs();
  const users = useAdminUsers();
  const createClub = useCreateAdminClub();
  const updateClub = useUpdateAdminClub();
  const existing = clubId
    ? (clubs.data?.items.find((item) => item.id === clubId) ?? null)
    : null;
  const isNew = !clubId;

  const [ownerQuery, setOwnerQuery] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftShortDescription, setDraftShortDescription] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    if (!existing) return;
    setDraftName(existing.name);
    setDraftShortDescription(existing.shortDescription);
    setDraftDescription(existing.description);
  }, [existing]);

  if (clubId && clubs.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Spinner />
      </main>
    );
  }

  if (clubId && !existing) {
    return (
      <main className="flex-1 space-y-4 p-4 lg:p-6">
        <p className="text-muted">باشگاه برای ویرایش پیدا نشد.</p>
        <ButtonLink href="/clubs" variant="secondary">
          بازگشت
        </ButtonLink>
      </main>
    );
  }

  const userLabel = (user: {
    firstName?: string;
    lastName?: string;
    phone: string;
  }) =>
    `${[user.firstName, user.lastName].filter(Boolean).join(" ") || "کاربر"} · ${user.phone}`;

  const saveClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (isNew) {
        const owner = users.data?.items.find(
          (user) => userLabel(user) === ownerQuery,
        );
        if (!owner) {
          toast.danger("یک کاربر از فهرست انتخاب کنید");
          return;
        }
        const created = await createClub.mutateAsync({
          ownerId: owner.id,
          name: draftName,
          shortDescription: draftShortDescription,
          description: draftDescription,
        });
        toast.success("باشگاه ذخیره شد");
        router.replace(`/clubs/${created.id}`);
        return;
      }
      await updateClub.mutateAsync({
        clubId: clubId!,
        payload: {
          name: draftName,
          shortDescription: draftShortDescription,
          description: draftDescription,
        },
      });
      toast.success("باشگاه ذخیره شد");
      router.push(`/clubs/${clubId}`);
    } catch {
      toast.danger("ذخیره باشگاه انجام نشد");
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <ButtonLink
            href={clubId ? `/clubs/${clubId}` : "/clubs"}
            variant="ghost"
            size="sm"
            className="mb-2"
          >
            بازگشت
          </ButtonLink>
          <h1 className="text-2xl font-semibold">
            {isNew ? "ساخت باشگاه برای کاربر" : "ویرایش باشگاه"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            مشخصات پایه باشگاه را وارد کنید؛ بقیه جزئیات در پرونده باشگاه دیده
            می‌شود.
          </p>
        </div>
        <Card className="rounded-[1.5rem] bg-surface p-5 shadow-none">
          <form onSubmit={saveClub} className="grid gap-4">
            {isNew ? (
              <label className="grid gap-2 text-sm">
                مالک باشگاه
                <Input
                  list="admin-club-owners"
                  role="combobox"
                  aria-label="جست‌وجو و انتخاب کاربر"
                  required
                  value={ownerQuery}
                  onChange={(event) => setOwnerQuery(event.target.value)}
                  placeholder="نام یا شماره کاربر"
                />
                <datalist id="admin-club-owners">
                  {users.data?.items
                    .filter((user) => user.status === "active")
                    .map((user) => (
                      <option key={user.id} value={userLabel(user)} />
                    ))}
                </datalist>
              </label>
            ) : null}
            <label className="grid gap-2 text-sm">
              نام باشگاه
              <Input
                required
                minLength={2}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              توضیح کوتاه
              <Input
                maxLength={300}
                value={draftShortDescription}
                onChange={(event) =>
                  setDraftShortDescription(event.target.value)
                }
              />
            </label>
            <label className="grid gap-2 text-sm">
              توضیحات
              <TextArea
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                isPending={createClub.isPending || updateClub.isPending}
              >
                ذخیره
              </Button>
              <ButtonLink
                href={clubId ? `/clubs/${clubId}` : "/clubs"}
                variant="ghost"
              >
                انصراف
              </ButtonLink>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

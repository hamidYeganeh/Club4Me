"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { http } from "@api/http/client";
import { Button, Card, TextArea, toast } from "@heroui/react";

type FollowUp = { studentId: string; name: string; note: string };
export function FollowUpFormScreen({
  clubId,
  studentId,
}: {
  clubId: string;
  studentId: string;
}) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["business", clubId, "member-follow-ups"],
    queryFn: () =>
      http.get<{ items: FollowUp[] }>(
        `/business/clubs/${clubId}/operations/follow-ups`,
      ),
  });
  const item = query.data?.items.find((row) => row.studentId === studentId);
  const [note, setNote] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (value: string) =>
      http.post(
        `/business/clubs/${clubId}/operations/follow-ups/${studentId}`,
        { note: value, remindInDays: 7 },
      ),
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await mutation.mutateAsync(note ?? item?.note ?? "");
      toast.success("نتیجه پیگیری ثبت شد");
      router.push("/");
    } catch {
      toast.danger("ثبت نتیجه پیگیری انجام نشد");
    }
  }
  if (query.isPending) return <main className="p-6">در حال بارگذاری...</main>;
  if (!item)
    return <main className="p-6">شاگرد در فهرست پیگیری پیدا نشد.</main>;
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-accent">
          بازگشت به داشبورد
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          نتیجه پیگیری {item.name}
        </h1>
        <Card className="mt-6 p-5">
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-2 text-sm">
              یادداشت پیگیری
              <TextArea
                variant="secondary"
                required
                maxLength={500}
                value={note ?? item.note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                isPending={mutation.isPending}
                isDisabled={!(note ?? item.note).trim()}
              >
                ذخیره و یادآوری هفت روز بعد
              </Button>
              <Button variant="ghost">
                <Link href="/">انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

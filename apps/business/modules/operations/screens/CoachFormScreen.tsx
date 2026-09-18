"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { CatalogMultiSelect } from "@repo/ui/catalog-multi-select";
import { usePublicCatalogResource } from "@api";
import {
  useClubCoachProfiles,
  useCreateClubCoach,
  useUpdateClubCoach,
} from "@api/business";
import { IRANIAN_PHONE_INPUT_PATTERN } from "@/lib/phone";
import { useSelectedClub } from "@/lib/use-selected-club";

const weekdays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
type Slot = { weekday: number; startTime: string; endTime: string };
export function CoachFormScreen({
  requestedClubId,
  coachId,
}: {
  requestedClubId?: string;
  coachId?: string;
}) {
  const router = useRouter();
  const { clubs, clubId: defaultClubId } = useSelectedClub();
  const clubId = clubs.data?.items.some((club) => club.id === requestedClubId)
    ? requestedClubId!
    : defaultClubId;
  const coachList = useClubCoachProfiles(clubId);
  const coach = coachList.data?.items.find((item) => item.id === coachId);
  const employment = usePublicCatalogResource("sports", "employment-type", {
    limit: 100,
  });
  const specialties = usePublicCatalogResource("sports", "coach-specialty", {
    limit: 100,
  });
  const create = useCreateClubCoach(clubId);
  const update = useUpdateClubCoach(clubId);
  const [type, setType] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [percent, setPercent] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  useEffect(() => {
    if (!coach || loadedId === coach.id) return;
    setLoadedId(coach.id);
    setType(coach.employmentType);
    setSelected(coach.specialties);
    setSlots(coach.weeklyAvailability);
    setPercent(String(coach.commissionPercent ?? ""));
  }, [coach, loadedId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: String(data.get("firstName")).trim(),
      lastName: String(data.get("lastName")).trim(),
      phone: String(data.get("phone")).trim(),
      specialties: selected,
      employmentType: type,
      notes: String(data.get("notes") ?? ""),
      status: coach?.status ?? ("active" as const),
      ...(type === "COMMISSION"
        ? { commissionPercent: Number(percent) }
        : {}),
      ...(type === "PART_TIME" ? { weeklyAvailability: slots } : {}),
    };
    try {
      if (coachId) await update.mutateAsync({ id: coachId, payload });
      else await create.mutateAsync(payload);
      toast.success("مربی ذخیره شد");
      router.push("/coaches");
    } catch {
      toast.danger("ذخیره مربی انجام نشد؛ شرایط همکاری را بررسی کنید");
    }
  }
  if (coachId && coachList.isPending)
    return <main className="p-6">در حال بارگذاری...</main>;
  if (coachId && !coach) return <main className="p-6">مربی پیدا نشد.</main>;
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/coaches" className="text-sm text-accent">
          بازگشت به مربی‌ها
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {coachId ? "ویرایش مربی" : "افزودن مربی"}
        </h1>
        <Card className="mt-6 app-card p-5 shadow-none active:scale-100">
          <form
            key={coach?.id ?? clubId}
            onSubmit={submit}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-muted">
              باشگاه:{" "}
              {clubs.data?.items.find((item) => item.id === clubId)?.name ??
                "—"}
            </p>
            <TextField
              name="firstName"
              isRequired
              minLength={2}
              defaultValue={coach?.firstName}
              fullWidth
              variant="secondary"
            >
              <Label>نام</Label>
              <Input variant="secondary" />
            </TextField>
            <TextField
              name="lastName"
              isRequired
              minLength={2}
              defaultValue={coach?.lastName}
              fullWidth
              variant="secondary"
            >
              <Label>نام خانوادگی</Label>
              <Input variant="secondary" />
            </TextField>
            <TextField
              name="phone"
              isRequired
              type="tel"
              defaultValue={coach?.phone}
              fullWidth
              variant="secondary"
            >
              <Label>شماره تماس</Label>
              <Input
                variant="secondary"
                dir="ltr"
                inputMode="tel"
                pattern={IRANIAN_PHONE_INPUT_PATTERN}
                title="مثال: 09383729627، 9383729627 یا 989383729627"
              />
            </TextField>
            <CatalogMultiSelect
              label="تخصص‌ها"
              options={(specialties.data?.items ?? []).map((item) => ({
                id: item.name,
                name: item.name,
              }))}
              value={selected}
              onChange={setSelected}
              isPending={specialties.isPending}
              isError={specialties.isError}
              onRetry={() => void specialties.refetch()}
            />
            <div className="flex flex-col gap-2">
              <Label>نوع همکاری</Label>
              <FormSelect
                aria-label="نوع همکاری"
                value={type}
                onChange={setType}
                disabled={employment.isPending}
              >
                <FormOption value="">انتخاب نوع همکاری</FormOption>
                {employment.data?.items.map((item) => (
                  <FormOption key={item.id} value={String(item.code)}>
                    {item.name}
                  </FormOption>
                ))}
              </FormSelect>
            </div>
            {type === "COMMISSION" && (
              <TextField
                type="number"
                isRequired
                value={percent}
                onChange={setPercent}
                fullWidth
                variant="secondary"
              >
                <Label>درصد سهم مربی</Label>
                <Input variant="secondary" min={1} max={100} step="0.1" />
              </TextField>
            )}
            {type === "PART_TIME" && (
              <fieldset>
                <legend className="mb-3 font-medium">
                  روزها و ساعت‌های حضور
                </legend>
                <div className="flex flex-col gap-3">
                  {weekdays.map((day, weekday) => {
                    const slot = slots.find((item) => item.weekday === weekday);
                    return (
                      <div
                        key={day}
                        className="rounded-xl border border-default p-3"
                      >
                        <Checkbox
                          variant="secondary"
                          isSelected={!!slot}
                          onChange={(checked) =>
                            setSlots((current) =>
                              checked
                                ? [
                                  ...current,
                                  {
                                    weekday,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                  },
                                ]
                                : current.filter(
                                  (item) => item.weekday !== weekday,
                                ),
                            )
                          }
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            {day}
                          </Checkbox.Content>
                        </Checkbox>
                        {slot && (
                          <div dir="ltr" className="mt-3 flex flex-col gap-3">
                            <TextField
                              type="time"
                              value={slot.startTime}
                              onChange={(value) =>
                                setSlots((current) =>
                                  current.map((item) =>
                                    item.weekday === weekday
                                      ? { ...item, startTime: value }
                                      : item,
                                  ),
                                )
                              }
                              fullWidth
                              variant="secondary"
                            >
                              <Label>شروع {day}</Label>
                              <Input variant="secondary" />
                            </TextField>
                            <TextField
                              type="time"
                              value={slot.endTime}
                              onChange={(value) =>
                                setSlots((current) =>
                                  current.map((item) =>
                                    item.weekday === weekday
                                      ? { ...item, endTime: value }
                                      : item,
                                  ),
                                )
                              }
                              fullWidth
                              variant="secondary"
                            >
                              <Label>پایان {day}</Label>
                              <Input variant="secondary" />
                            </TextField>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <TextField
              name="notes"
              defaultValue={coach?.notes}
              fullWidth
              variant="secondary"
            >
              <Label>یادداشت</Label>
              <TextArea variant="secondary" rows={3} />
            </TextField>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending || update.isPending}
                isDisabled={!clubId}
              >
                ذخیره
              </Button>
              <Button variant="ghost">
                <Link href="/coaches">انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

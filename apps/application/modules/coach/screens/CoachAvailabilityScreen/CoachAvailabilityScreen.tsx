"use client";

import { IranDateInput } from "@repo/ui/iran-date-input";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  useAddCoachAvailabilityException,
  useCoachAvailability,
  useReplaceCoachAvailability,
} from "@api";
import { AvailabilityScheduler, WEEKDAYS } from "@ui/availability-scheduler";

import { useCatalogClubs } from "@api/discovery";
import {
  availabilityDraft,
  availabilityPayload,
  newAvailabilityDetails,
  AVAILABILITY_MODES,
  type AvailabilityDetails,
} from "@/lib/coach-availability";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

export function CoachAvailabilityScreen() {
  const availability = useCoachAvailability();
  const replace = useReplaceCoachAvailability();
  const addException = useAddCoachAvailabilityException();
  const [draft, setDraft] = useState(() => availabilityDraft([]));
  const [defaults] = useState(newAvailabilityDetails);
  const dirty = useRef(false);
  const clubs = useCatalogClubs({ limit: 100 });
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");

  useEffect(() => {
    if (!availability.data || dirty.current) return;
    const frame = requestAnimationFrame(() =>
      setDraft(availabilityDraft(availability.data.rules)),
    );
    return () => cancelAnimationFrame(frame);
  }, [availability.data]);

  const updateDetails = (key: string, value: AvailabilityDetails) => {
    dirty.current = true;
    setDraft((current) => ({
      ...current,
      details: { ...current.details, [key]: value },
    }));
  };
  const save = async () => {
    if (!availability.data || availability.isError || replace.isPending) return;
    try {
      const rules = availabilityPayload(draft, defaults);
      const saved = await replace.mutateAsync(rules);
      dirty.current = false;
      setDraft(availabilityDraft(saved.rules));
      toast.success("برنامه دسترسی ذخیره شد");
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "ذخیره برنامه انجام نشد",
      );
    }
  };

  const blockDate = async () => {
    if (!exceptionDate) return;
    try {
      await addException.mutateAsync({
        date: exceptionDate,
        type: "unavailable",
        reason: exceptionReason || undefined,
      });
      setExceptionDate("");
      setExceptionReason("");
      toast.success("روز استثنا ثبت شد");
    } catch {
      toast.danger("ثبت روز استثنا انجام نشد");
    }
  };

  return (
    <main className="app-page gap-5">
      <SecondaryHeader showFilter={false} title="زمان‌های در دسترس" />
      {availability.isPending ? (
        <div className="grid min-h-64 place-items-center">
          <Spinner />
        </div>
      ) : availability.isError ? (
        <Card className="app-card p-5">
          <p role="alert">
            دریافت برنامه انجام نشد. برای جلوگیری از حذف زمان‌های قبلی، ابتدا
            دوباره تلاش کنید.
          </p>
          <Button onPress={() => void availability.refetch()}>
            تلاش دوباره
          </Button>
        </Card>
      ) : (
        <>
          <Card className="app-card rounded-3xl p-5 shadow-none">
            <Card.Title>برنامه هفتگی</Card.Title>
            <p className="mt-2 text-xs leading-6 text-muted">
              روزها و بازه‌هایی را که امکان پذیرش رزرو دارید مشخص کنید.
            </p>
            <AvailabilityScheduler
              value={draft.week}
              maxRanges={100}
              onChange={(week) => {
                dirty.current = true;
                setDraft((current) => ({ ...current, week }));
              }}
              className="mt-4"
            />
            <fieldset disabled={replace.isPending} className="mt-4 space-y-4">
              <legend className="font-bold">جزئیات هر بازه</legend>
              {WEEKDAYS.flatMap(({ key, label }) =>
                draft.week[key].enabled
                  ? draft.week[key].ranges.map((range) => {
                      const detailKey = `${key}:${range.id}`;
                      const detail = draft.details[detailKey] ?? defaults;
                      return (
                        <div
                          key={detailKey}
                          className="space-y-3 rounded-2xl border border-border p-3"
                        >
                          <p className="text-sm font-bold">
                            {label} · {range.start} تا {range.end}
                          </p>
                          <div className="flex flex-wrap gap-4">
                            {AVAILABILITY_MODES.map((mode) => (
                              <label
                                key={mode.value}
                                className="flex min-h-11 items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={detail.deliveryModes.includes(
                                    mode.value,
                                  )}
                                  onChange={(event) =>
                                    updateDetails(detailKey, {
                                      ...detail,
                                      deliveryModes: event.target.checked
                                        ? [...detail.deliveryModes, mode.value]
                                        : detail.deliveryModes.filter(
                                            (value) => value !== mode.value,
                                          ),
                                    })
                                  }
                                />
                                {mode.label}
                              </label>
                            ))}
                          </div>
                          {detail.deliveryModes.includes("club") ||
                          detail.clubId ? (
                            <label className="block text-sm">
                              باشگاه (اختیاری)
                              <select
                                className="mt-1 w-full rounded-xl border border-border bg-surface p-3"
                                value={detail.clubId ?? ""}
                                onChange={(event) =>
                                  updateDetails(detailKey, {
                                    ...detail,
                                    clubId: event.target.value || null,
                                  })
                                }
                              >
                                <option value="">همه باشگاه‌ها</option>
                                {detail.clubId &&
                                !clubs.data?.items.some(
                                  (club) => club.id === detail.clubId,
                                ) ? (
                                  <option value={detail.clubId}>
                                    باشگاه ذخیره‌شده
                                  </option>
                                ) : null}
                                {clubs.data?.items.map((club) => (
                                  <option key={club.id} value={club.id}>
                                    {club.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                          <div className="grid grid-cols-2 gap-3">
                            <label className="text-sm">
                              معتبر از
                              <IranDateInput
                                required
                                value={detail.validFrom.slice(0, 10)}
                                className="mt-1 w-full rounded-xl border border-border bg-surface p-2"
                                onValueChange={(dateValue) =>
                                  updateDetails(detailKey, {
                                    ...detail,
                                    validFrom: dateValue,
                                  })
                                }
                              />
                            </label>
                            <label className="text-sm">
                              معتبر تا (اختیاری)
                              <IranDateInput
                                min={detail.validFrom.slice(0, 10)}
                                value={detail.validUntil?.slice(0, 10) ?? ""}
                                className="mt-1 w-full rounded-xl border border-border bg-surface p-2"
                                onValueChange={(dateValue) =>
                                  updateDetails(detailKey, {
                                    ...detail,
                                    validUntil: dateValue || null,
                                  })
                                }
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })
                  : [],
              )}
            </fieldset>
            <Button
              className="mt-5 w-full"
              variant="primary"
              isPending={replace.isPending}
              onPress={() => void save()}
            >
              ذخیره برنامه
            </Button>
          </Card>
          <Card className="app-card rounded-3xl p-5 shadow-none">
            <Card.Title>روز تعطیل یا استثنا</Card.Title>
            <div className="mt-4 grid gap-3">
              <IranDateInput
                value={exceptionDate}
                onValueChange={(dateValue) => setExceptionDate(dateValue)}
                className="h-12 rounded-xl border border-border bg-surface-secondary px-3"
              />
              <input
                value={exceptionReason}
                onChange={(event) => setExceptionReason(event.target.value)}
                placeholder="دلیل (اختیاری)"
                className="h-12 rounded-xl border border-border bg-surface-secondary px-3"
              />
              <Button
                variant="secondary"
                isPending={addException.isPending}
                isDisabled={!exceptionDate}
                onPress={() => void blockDate()}
              >
                ثبت روز غیرقابل رزرو
              </Button>
            </div>
            {availability.data?.exceptions.length ? (
              <div className="mt-4 space-y-2 text-sm text-muted">
                {availability.data.exceptions.map((item) => (
                  <p key={item.id}>
                    {new Date(item.date).toLocaleDateString("fa-IR")}{" "}
                    {item.reason ? `— ${item.reason}` : ""}
                  </p>
                ))}
              </div>
            ) : null}
          </Card>
        </>
      )}
    </main>
  );
}

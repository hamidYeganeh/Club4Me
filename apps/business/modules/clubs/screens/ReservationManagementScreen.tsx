"use client";

import { IranDateInput } from "@repo/ui/iran-date-input";
import { tehranLocalDate } from "@repo/ui/iran-date";

import { FormEvent, useState } from "react";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  useBusinessCatalog,
  useBusinessClub,
  useBusinessSessions,
  useCancelBusinessSession,
  useClubReservations,
  useCompleteSession,
  useMarkClubReservationNoShow,
  useReservableClubClasses,
  useClubCoaches,
  useClubCourts,
  type ClubCourt,
  useCreateSession,
} from "@api/business";
import { useTranslations } from "next-intl";

import { CourtEditor } from "../components/CourtEditor";

import { PanelNumberField } from "@/components/form/PanelNumberField";

const input =
  "h-11 w-full rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm outline-none focus:border-accent";

type OptionDraft = {
  type: "equipment" | "amenity";
  resourceId: string;
  availableQuantity: number;
  maxPerReservation: number;
  unitPrice: number;
};

const paymentStatusLabels: Record<string, string> = {
  not_required: "رایگان",
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  refunded: "بازپرداخت‌شده",
  failed: "پرداخت ناموفق",
};

export function ReservationManagementScreen({ clubId }: { clubId: string }) {
  const t = useTranslations("businessReservations");
  const club = useBusinessClub(clubId);
  const courts = useClubCourts(clubId);
  const sessions = useBusinessSessions(clubId);
  const reservations = useClubReservations(clubId);
  const coaches = useClubCoaches(clubId);
  const classes = useReservableClubClasses(clubId);
  const equipmentCatalog = useBusinessCatalog("facilities", "equipment");
  const amenitiesCatalog = useBusinessCatalog("facilities", "amenity");
  const createSession = useCreateSession(clubId);
  const completeSession = useCompleteSession(clubId);
  const cancelSession = useCancelBusinessSession(clubId);
  const markNoShow = useMarkClubReservationNoShow(clubId);
  const [editingCourt, setEditingCourt] = useState<ClubCourt>();
  const [editorVersion, setEditorVersion] = useState(0);
  const [title, setTitle] = useState("");
  const [courtId, setCourtId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [classId, setClassId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [pricingUnit, setPricingUnit] = useState<
    "per_participant" | "per_session" | "per_court"
  >("per_participant");
  const [policyId, setPolicyId] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([]);

  const addSession = async (event: FormEvent) => {
    event.preventDefault();
    const policy = club.data?.cancellationRules.find(
      (item) => item.id === policyId && item.isActive !== false,
    );
    if (!policy) {
      toast.danger(t("policyRequired"));
      return;
    }

    const start = tehranLocalDate(startsAt);
    const end = tehranLocalDate(endsAt);
    if (
      !startsAt ||
      !endsAt ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      toast.danger(t("invalidSessionTime"));
      return;
    }

    try {
      await createSession.mutateAsync({
        title,
        courtId: courtId || undefined,
        coachId: coachId || undefined,
        classId: classId || undefined,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        capacity,
        basePrice,
        currency: "IRR",
        pricingUnit,
        options: options
          .filter((item) => item.resourceId)
          .map((item) => ({
            ...item,
            title: (item.type === "equipment"
              ? equipmentCatalog.data?.items
              : amenitiesCatalog.data?.items
            )?.find((resource) => resource.id === item.resourceId)?.name,
          })),
        cancellationPolicy: policy,
      });
      setTitle("");
      setOptions([]);
      toast.success(t("sessionCreated"));
    } catch {
      toast.danger(t("error"));
    }
  };

  if (
    club.isPending ||
    courts.isPending ||
    sessions.isPending ||
    reservations.isPending
  )
    return (
      <div className="flex flex-1 justify-center py-20">
        <Spinner />
      </div>
    );
  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card
            variant="transparent"
            className="app-card shadow-none active:scale-100 p-5"
          >
            <CourtEditor
              key={editingCourt?.id ?? `new-${editorVersion}`}
              clubId={clubId}
              initial={editingCourt}
              onCancel={() => setEditingCourt(undefined)}
              onSaved={() => {
                setEditingCourt(undefined);
                setEditorVersion((value) => value + 1);
              }}
            />
            <div className="mt-5 divide-y divide-border">
              {(courts.data?.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-3 text-sm"
                >
                  <div>
                    <span>{item.name}</span>
                    <p className="mt-1 text-xs text-muted">
                      {t("capacityValue", { count: item.capacity })} ·{" "}
                      {item.status === "active" && item.isReservable
                        ? "رزرو فعال"
                        : "فروش متوقف"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => setEditingCourt(item)}
                    aria-label={`ویرایش زمین ${item.name}`}
                  >
                    ویرایش
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          <Card
            variant="transparent"
            className="app-card shadow-none active:scale-100 p-5"
          >
            <h2 className="font-semibold">{t("newSession")}</h2>
            <form onSubmit={addSession} className="mt-4 space-y-3">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={input}
                placeholder={t("sessionTitle")}
              />
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className={input}
              >
                <option value="">{t("withoutCourt")}</option>
                {(courts.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className={input}
              >
                <option value="">{t("coachOptional")}</option>
                {(coaches.data?.items ?? []).map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.displayName}
                  </option>
                ))}
              </select>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className={input}
              >
                <option value="">{t("classOptional")}</option>
                {(classes.data?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-2 text-sm">
                  <span>{t("startsAt")}</span>
                  <IranDateInput
                    required
                    dir="ltr"
                    withTime
                    value={startsAt}
                    onValueChange={(dateValue) => setStartsAt(dateValue)}
                    className={input}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>{t("endsAt")}</span>
                  <IranDateInput
                    required
                    dir="ltr"
                    withTime
                    min={startsAt || undefined}
                    value={endsAt}
                    onValueChange={(dateValue) => setEndsAt(dateValue)}
                    className={input}
                  />
                </label>
              </div>
              <label className="block space-y-2 text-sm">
                <span>واحد قیمت‌گذاری</span>
                <select
                  className={input}
                  value={pricingUnit}
                  onChange={(event) =>
                    setPricingUnit(event.target.value as typeof pricingUnit)
                  }
                >
                  <option value="per_participant">به‌ازای هر نفر</option>
                  <option value="per_session">کل سانس</option>
                  <option value="per_court">کل زمین</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm">
                <span>قانون لغو این سانس</span>
                <select
                  required
                  className={input}
                  value={policyId}
                  onChange={(event) => setPolicyId(event.target.value)}
                >
                  <option value="">قانون را انتخاب کنید</option>
                  {club.data?.cancellationRules
                    .filter((item) => item.isActive !== false)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                </select>
              </label>
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t("addons")}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() =>
                        setOptions((items) => [
                          ...items,
                          {
                            type: "equipment",
                            resourceId: "",
                            availableQuantity: 1,
                            maxPerReservation: 1,
                            unitPrice: 0,
                          },
                        ])
                      }
                    >
                      {t("addEquipment")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() =>
                        setOptions((items) => [
                          ...items,
                          {
                            type: "amenity",
                            resourceId: "",
                            availableQuantity: 1,
                            maxPerReservation: 1,
                            unitPrice: 0,
                          },
                        ])
                      }
                    >
                      {t("addAmenity")}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  {options.map((option, index) => {
                    const selectedIds =
                      option.type === "equipment"
                        ? club.data?.equipment.map((item) => item.equipmentId)
                        : club.data?.amenities.map((item) => item.amenityId);
                    const catalog =
                      option.type === "equipment"
                        ? equipmentCatalog.data?.items
                        : amenitiesCatalog.data?.items;
                    return (
                      <div
                        key={`${option.type}-${index}`}
                        className="grid gap-2 rounded-lg bg-surface-secondary p-2 md:grid-cols-4"
                      >
                        <select
                          required
                          className={input}
                          value={option.resourceId}
                          onChange={(event) =>
                            setOptions((items) =>
                              items.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, resourceId: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        >
                          <option value="">{t("selectAddon")}</option>
                          {(catalog ?? [])
                            .filter((item) => selectedIds?.includes(item.id))
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                        </select>
                        {(
                          [
                            "availableQuantity",
                            "maxPerReservation",
                            "unitPrice",
                          ] as const
                        ).map((fieldName) => (
                          <PanelNumberField
                            key={fieldName}
                            aria-label={t(fieldName)}
                            minValue={fieldName === "unitPrice" ? 0 : 1}
                            value={option[fieldName]}
                            onChange={(next) =>
                              setOptions((items) =>
                                items.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        [fieldName]: next,
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PanelNumberField
                  aria-label={t("capacity")}
                  minValue={1}
                  value={capacity}
                  onChange={setCapacity}
                />
                <PanelNumberField
                  aria-label={t("price")}
                  minValue={0}
                  value={basePrice}
                  onChange={setBasePrice}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                isPending={createSession.isPending}
              >
                {t("createSession")}
              </Button>
            </form>
          </Card>
        </div>
        <section className="mt-5">
          <h2 className="text-lg font-semibold">{t("sessions")}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(sessions.data?.items ?? []).map((item) => (
              <Card
                key={item.id}
                variant="transparent"
                className="app-card shadow-none active:scale-100 p-4"
              >
                <div className="flex justify-between gap-3">
                  <strong>{item.title}</strong>
                  <span className="text-sm text-muted">
                    {item.reservedCount}/{item.capacity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {new Intl.DateTimeFormat("fa-IR", {
                    timeZone: "Asia/Tehran",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.startsAt))}
                </p>
                {item.status === "active" ? (
                  <div className="mt-3 flex gap-2">
                    {new Date(item.endsAt) <= new Date() ? (
                      <Button
                        size="sm"
                        variant="primary"
                        isPending={completeSession.isPending}
                        onPress={() =>
                          completeSession
                            .mutateAsync(item.id)
                            .then(() => toast.success(t("sessionCompleted")))
                            .catch(() => toast.danger(t("sessionActionError")))
                        }
                      >
                        {t("completeSession")}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="danger"
                      isPending={cancelSession.isPending}
                      onPress={() => {
                        if (!window.confirm(t("cancelSessionConfirm"))) return;
                        cancelSession
                          .mutateAsync(item.id)
                          .then(() => toast.success(t("sessionCancelled")))
                          .catch(() => toast.danger(t("sessionActionError")));
                      }}
                    >
                      {t("cancelSession")}
                    </Button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">رزروهای ثبت‌شده</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(reservations.data?.items ?? []).map((item) => (
              <Card
                key={item.id}
                variant="transparent"
                className="app-card shadow-none active:scale-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{item.sessionTitle}</strong>
                    <p className="mt-1 text-xs text-muted">
                      کاربر {item.userId.slice(-8)} ·{" "}
                      {item.participantCount.toLocaleString("fa-IR")} نفر
                    </p>
                  </div>
                  <span className="text-xs text-muted">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {new Intl.DateTimeFormat("fa-IR", {
                    timeZone: "Asia/Tehran",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.sessionStartsAt))}
                  {" · "}
                  {item.totalPrice.toLocaleString("fa-IR")} ریال
                </p>
                <p className="mt-1 text-xs text-muted">
                  پرداخت: {paymentStatusLabels[item.paymentStatus]}
                </p>
                {item.status === "reserved" &&
                item.paymentStatus !== "pending" &&
                new Date(item.sessionStartsAt) <= new Date() ? (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="danger"
                    isPending={markNoShow.isPending}
                    onPress={() =>
                      markNoShow
                        .mutateAsync(item.id)
                        .then(() => toast.success("عدم حضور ثبت شد"))
                        .catch(() => toast.danger("ثبت عدم حضور انجام نشد"))
                    }
                  >
                    ثبت عدم حضور
                  </Button>
                ) : null}
              </Card>
            ))}
            {!reservations.data?.items.length ? (
              <p className="py-6 text-sm text-muted">
                هنوز رزروی ثبت نشده است.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

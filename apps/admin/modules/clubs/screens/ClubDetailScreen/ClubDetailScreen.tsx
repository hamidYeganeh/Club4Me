"use client";

import { useConfirmActionDialog } from "@repo/ui/confirm-action-dialog";
import { useTextActionDialog } from "@repo/ui/text-action-dialog";
import {
  Button,
  Card,
  Chip,
  Spinner,
  toast,
} from "@heroui/react";
import {
  useAdminClubs,
  useReviewClub,
  useUpdateClubSupplyQuality,
  useVerifyClub,
} from "@api/admin";
import type { BusinessClub } from "@api/business";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/button-link";

const dayNames = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const audienceLabels: Record<string, string> = {
  men: "آقایان",
  women: "بانوان",
  mixed: "مختلط",
  children: "کودکان",
  family: "خانواده",
};

const operationalLabels: Record<string, string> = {
  active: "فعال",
  temporarily_closed: "موقتاً بسته",
  permanently_closed: "دائماً بسته",
  under_maintenance: "در تعمیر",
};

const qualityLabels: Record<string, string> = {
  active: "فعال",
  review_required: "نیاز به بررسی",
  suspended: "متوقف",
};

const visibilityLabels: Record<string, string> = {
  public: "عمومی",
  hidden: "مخفی",
};

function formatDate(value?: string | null) {
  if (!value) return "ثبت نشده";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailItem({
  label,
  value,
  dir,
  wide,
}: {
  label: string;
  value: ReactNode;
  dir?: "ltr" | "rtl";
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-surface-secondary/70 p-3.5 ${wide ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className="mt-1.5 wrap-break-word text-sm leading-6 text-foreground"
        dir={dir}
      >
        {value === "" || value == null ? "ثبت نشده" : value}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[1.5rem] bg-surface p-5 shadow-none">
      <h2 className="text-base font-semibold">{title}</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">{children}</dl>
    </Card>
  );
}

function resourceName(
  club: BusinessClub,
  id: string,
  fallback: string,
) {
  return club.profileResources?.[id]?.name ?? fallback;
}

export function ClubDetailScreen({ clubId }: { clubId: string }) {
  const t = useTranslations("clubsPage");
  const router = useRouter();
  const confirmation = useConfirmActionDialog();
  const textAction = useTextActionDialog();
  const clubs = useAdminClubs();
  const review = useReviewClub();
  const verification = useVerifyClub();
  const updateQuality = useUpdateClubSupplyQuality();
  const [reviewing, setReviewing] = useState(false);

  const club = useMemo(
    () => clubs.data?.items.find((item) => item.id === clubId) ?? null,
    [clubId, clubs.data?.items],
  );

  const decide = async (status: "approved" | "rejected") => {
    if (!club || review.isPending) return;
    if (status === "rejected") {
      textAction.open({
        title: "دلیل رد باشگاه",
        onSubmit: async (reason) => {
          await review.mutateAsync({ clubId: club.id, status, reason });
          toast.success("نتیجه بررسی ثبت شد");
        },
      });
      return;
    }
    if (!(await confirmation.confirm(t("approveConfirm")))) return;
    setReviewing(true);
    try {
      await review.mutateAsync({ clubId: club.id, status });
      toast.success(t("approveSuccess"));
    } catch {
      toast.danger(t("reviewError"));
    } finally {
      setReviewing(false);
    }
  };

  const toggleVerification = async (
    kind: "identity" | "documents" | "on_site",
    label: string,
  ) => {
    if (!club) return;
    try {
      await verification.mutateAsync({
        clubId: club.id,
        kind,
        verified: !club.verifications?.[kind],
      });
      toast.success(`نشان تأیید ${label} به‌روزرسانی شد`);
    } catch {
      toast.danger("به‌روزرسانی نشان انجام نشد");
    }
  };

  if (clubs.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Spinner />
      </main>
    );
  }

  if (!club) {
    return (
      <main className="flex-1 space-y-4 p-4 lg:p-6">
        <p className="text-muted">باشگاه پیدا نشد.</p>
        <ButtonLink href="/clubs" variant="secondary">
          بازگشت به فهرست
        </ButtonLink>
      </main>
    );
  }

  const ownerName =
    [club.owner?.firstName, club.owner?.lastName].filter(Boolean).join(" ") ||
    null;

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      {confirmation.dialog}
      {textAction.dialog}
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <ButtonLink href="/clubs" variant="ghost" size="sm" className="mb-2">
              بازگشت به باشگاه‌ها
            </ButtonLink>
            <h1 className="text-2xl font-semibold">{club.name}</h1>
            <p className="mt-1 text-sm text-muted">
              پرونده کامل باشگاه برای بررسی، تأیید و کنترل عرضه
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip
                color={
                  club.reviewStatus === "approved"
                    ? "success"
                    : club.reviewStatus === "rejected"
                      ? "danger"
                      : club.reviewStatus === "pending"
                        ? "warning"
                        : "default"
                }
                size="sm"
              >
                {t(club.reviewStatus)}
              </Chip>
              <Chip size="sm" variant="soft">
                {visibilityLabels[club.visibility] ?? club.visibility}
              </Chip>
              <Chip size="sm" variant="soft">
                {operationalLabels[club.operationalStatus] ??
                  club.operationalStatus}
              </Chip>
              <Chip
                size="sm"
                color={
                  club.qualityStatus === "suspended"
                    ? "danger"
                    : club.qualityStatus === "review_required"
                      ? "warning"
                      : "success"
                }
                variant="soft"
              >
                کیفیت: {qualityLabels[club.qualityStatus] ?? club.qualityStatus}
              </Chip>
            </div>
          </div>
          <ButtonLink href={`/clubs/${club.id}/edit`} variant="secondary">
            ویرایش مشخصات
          </ButtonLink>
        </div>

        <Card className="rounded-[1.5rem] bg-surface p-5 shadow-none">
          <h2 className="text-base font-semibold">اقدامات بررسی</h2>
          <p className="mt-1 text-sm text-muted">
            تأییدها، کنترل کیفیت و عرضه از همین صفحه انجام می‌شود.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["identity", "هویت"],
                ["documents", "مدارک"],
                ["on_site", "بازدید حضوری"],
              ] as const
            ).map(([kind, label]) => (
              <Button
                key={kind}
                size="sm"
                variant={club.verifications?.[kind] ? "secondary" : "primary"}
                isDisabled={verification.isPending}
                onPress={() => void toggleVerification(kind, label)}
              >
                {club.verifications?.[kind] ? "لغو تأیید" : "تأیید"} {label}
              </Button>
            ))}
            {club.reviewStatus === "pending" ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  isPending={reviewing && review.isPending}
                  isDisabled={review.isPending}
                  onPress={() => void decide("approved")}
                >
                  {t("approve")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  isDisabled={review.isPending}
                  onPress={() => void decide("rejected")}
                >
                  {t("reject")}
                </Button>
              </>
            ) : null}
            <Button
              size="sm"
              variant={club.qualityStatus === "active" ? "secondary" : "primary"}
              isPending={updateQuality.isPending}
              onPress={() =>
                void updateQuality
                  .mutateAsync({
                    clubId: club.id,
                    status: "active",
                    reasons: [],
                    nextReviewAt: new Date(
                      Date.now() + 90 * 86_400_000,
                    ).toISOString(),
                  })
                  .then(() => toast.success("عرضه تا ۹۰ روز تأیید شد"))
                  .catch(() => toast.danger("ثبت کنترل کیفیت انجام نشد"))
              }
            >
              تأیید تازگی (۹۰ روز)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isDisabled={updateQuality.isPending}
              onPress={() =>
                textAction.open({
                  title: "علت توقف عرضه",
                  onSubmit: async (reason) => {
                    await updateQuality.mutateAsync({
                      clubId: club.id,
                      status: "suspended",
                      reasons: [reason],
                    });
                    toast.success("عرضه متوقف شد");
                  },
                })
              }
            >
              توقف عرضه
            </Button>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <DetailSection title="شناسه و وضعیت">
              <DetailItem label="شناسه باشگاه" value={club.id} dir="ltr" />
              <DetailItem label="شناسه مالک" value={club.ownerId} dir="ltr" />
              <DetailItem label="نامک" value={club.slug} dir="ltr" />
              <DetailItem
                label="گروه شعبه"
                value={club.branchGroupId}
                dir="ltr"
              />
              <DetailItem label="وضعیت بررسی" value={t(club.reviewStatus)} />
              <DetailItem
                label="نمایش عمومی"
                value={visibilityLabels[club.visibility] ?? club.visibility}
              />
              <DetailItem
                label="وضعیت عملیاتی"
                value={
                  operationalLabels[club.operationalStatus] ??
                  club.operationalStatus
                }
              />
              <DetailItem
                label="وضعیت کیفیت عرضه"
                value={qualityLabels[club.qualityStatus] ?? club.qualityStatus}
              />
              <DetailItem
                label="علت رد"
                value={club.rejectionReason}
                wide
              />
              <DetailItem
                label="دلایل کیفیت"
                value={
                  club.qualityReasons.length
                    ? club.qualityReasons.join(" · ")
                    : null
                }
                wide
              />
            </DetailSection>

            <DetailSection title="معرفی">
              <DetailItem
                label="توضیح کوتاه"
                value={club.shortDescription}
                wide
              />
              <DetailItem label="توضیحات" value={club.description} wide />
              <DetailItem
                label="گروه مخاطب"
                value={
                  club.audience.length
                    ? club.audience
                        .map((item) => audienceLabels[item] ?? item)
                        .join("، ")
                    : null
                }
              />
              <DetailItem
                label="بازه سنی"
                value={
                  club.minAge == null && club.maxAge == null
                    ? null
                    : `${club.minAge == null ? "—" : club.minAge.toLocaleString("fa-IR")} تا ${club.maxAge == null ? "—" : club.maxAge.toLocaleString("fa-IR")} سال`
                }
              />
              <DetailItem
                label="تگ‌ها"
                value={club.tags.length ? club.tags.join("، ") : null}
                wide
              />
              <DetailItem
                label="قوانین"
                value={club.rules.length ? club.rules.join(" | ") : null}
                wide
              />
              <DetailItem
                label="امتیاز"
                value={`${club.averageRating.toLocaleString("fa-IR")} از ۵ · ${club.reviewsCount.toLocaleString("fa-IR")} نظر`}
              />
              <DetailItem
                label="ارز / مالیات"
                value={`${club.currency} · ${club.taxPercent.toLocaleString("fa-IR")}٪`}
              />
            </DetailSection>

            <DetailSection title="پرسش‌های متداول">
              {club.faqs.length === 0 ? (
                <DetailItem label="FAQ" value={null} wide />
              ) : (
                club.faqs.map((item, index) => (
                  <DetailItem
                    key={`${item.question}-${index}`}
                    label={item.question || `سؤال ${index + 1}`}
                    value={item.answer}
                    wide
                  />
                ))
              )}
            </DetailSection>

            <DetailSection title="ساعت کاری و تعطیلی">
              {club.weeklyHours.length === 0 ? (
                <DetailItem label="برنامه هفتگی" value={null} wide />
              ) : (
                club.weeklyHours.map((day) => (
                  <DetailItem
                    key={day.dayOfWeek}
                    label={dayNames[day.dayOfWeek] ?? `روز ${day.dayOfWeek}`}
                    value={
                      day.isClosed
                        ? "بسته"
                        : day.periods
                            .map(
                              (period) =>
                                `${period.opensAt}–${period.closesAt}${
                                  period.audience
                                    ? ` (${audienceLabels[period.audience] ?? period.audience})`
                                    : ""
                                }`,
                            )
                            .join(" · ") || "بدون بازه"
                    }
                    wide
                  />
                ))
              )}
              <DetailItem
                label="تعطیلی‌های موردی"
                value={
                  club.closures.length
                    ? club.closures
                        .map(
                          (item) =>
                            `${formatDate(item.startsAt)} تا ${formatDate(item.endsAt)}: ${item.reason}`,
                        )
                        .join(" | ")
                    : null
                }
                wide
              />
            </DetailSection>
          </div>

          <div className="space-y-5">
            <DetailSection title="مالک">
              <DetailItem label="نام" value={ownerName} />
              <DetailItem
                label="شماره تماس"
                value={club.owner?.phone}
                dir="ltr"
              />
            </DetailSection>

            <DetailSection title="تأییدها و عرضه">
              <DetailItem
                label="هویت"
                value={
                  club.verifications?.identity
                    ? `تأیید شده · ${formatDate(club.verifications.identity.verifiedAt)}`
                    : "تأیید نشده"
                }
              />
              <DetailItem
                label="مدارک"
                value={
                  club.verifications?.documents
                    ? `تأیید شده · ${formatDate(club.verifications.documents.verifiedAt)}`
                    : "تأیید نشده"
                }
              />
              <DetailItem
                label="بازدید حضوری"
                value={
                  club.verifications?.on_site
                    ? `تأیید شده · ${formatDate(club.verifications.on_site.verifiedAt)}`
                    : "تأیید نشده"
                }
              />
              <DetailItem
                label="آخرین تأیید عرضه"
                value={formatDate(club.supplyVerifiedAt)}
              />
              <DetailItem
                label="موعد بررسی عرضه"
                value={formatDate(club.supplyReviewDueAt)}
              />
              <DetailItem
                label="منتشر شده"
                value={formatDate(club.publishedAt)}
              />
              <DetailItem
                label="بایگانی / تعلیق"
                value={
                  club.archivedAt || club.suspendedAt
                    ? `بایگانی: ${formatDate(club.archivedAt)} · تعلیق: ${formatDate(club.suspendedAt)}`
                    : null
                }
                wide
              />
            </DetailSection>

            <DetailSection title="مکان">
              <DetailItem
                label="نشانی"
                value={club.location?.address}
                wide
              />
              <DetailItem
                label="منطقه زمانی"
                value={club.location?.timezone}
                dir="ltr"
              />
              <DetailItem
                label="مختصات"
                value={
                  club.location
                    ? `${club.location.latitude}, ${club.location.longitude}`
                    : null
                }
                dir="ltr"
              />
              <DetailItem
                label="کد پستی"
                value={club.location?.postalCode}
                dir="ltr"
              />
              <DetailItem
                label="یادداشت مکان"
                value={club.location?.locationNotes}
                wide
              />
            </DetailSection>

            <DetailSection title="رشته‌ها، امکانات و تجهیزات">
              <DetailItem
                label="رشته‌ها"
                value={
                  club.sportIds.length
                    ? club.sportIds
                        .map((id) => resourceName(club, id, id))
                        .join("، ")
                    : "۰"
                }
                wide
              />
              <DetailItem
                label="نوع باشگاه"
                value={
                  club.clubTypeIds.length
                    ? club.clubTypeIds
                        .map((id) => resourceName(club, id, id))
                        .join("، ")
                    : null
                }
                wide
              />
              <DetailItem
                label="امکانات"
                value={
                  club.amenities.length
                    ? club.amenities
                        .map(
                          (item) =>
                            `${resourceName(club, item.amenityId, item.amenityId)}${
                              item.quantity
                                ? ` × ${item.quantity.toLocaleString("fa-IR")}`
                                : ""
                            }`,
                        )
                        .join(" · ")
                    : "۰"
                }
                wide
              />
              <DetailItem
                label="تجهیزات"
                value={
                  club.equipment.length
                    ? club.equipment
                        .map(
                          (item) =>
                            `${resourceName(club, item.equipmentId, item.equipmentId)} × ${item.quantity.toLocaleString("fa-IR")}`,
                        )
                        .join(" · ")
                    : "۰"
                }
                wide
              />
              <DetailItem
                label="رسانه‌های گالری"
                value={club.gallery.length.toLocaleString("fa-IR")}
              />
              <DetailItem
                label="شبکه‌های اجتماعی"
                value={
                  club.socialMedia.length
                    ? club.socialMedia
                        .map((item) => `${item.platform}: ${item.link}`)
                        .join(" | ")
                    : null
                }
                wide
              />
            </DetailSection>

            <DetailSection title="قوانین لغو و پرداخت حضوری">
              <DetailItem
                label="قوانین لغو"
                value={
                  club.cancellationRules.length
                    ? club.cancellationRules
                        .map((rule) => {
                          const tiers = rule.tiers
                            .map(
                              (tier) =>
                                `${tier.hoursBefore.toLocaleString("fa-IR")}س → ${tier.refundPercent.toLocaleString("fa-IR")}٪`,
                            )
                            .join("، ");
                          return `${rule.title}${tiers ? ` (${tiers})` : ""}`;
                        })
                        .join(" | ")
                    : null
                }
                wide
              />
              <DetailItem
                label="روش‌های پرداخت حضوری"
                value={
                  club.onSitePaymentMethods?.length
                    ? club.onSitePaymentMethods.join("، ")
                    : null
                }
              />
              <DetailItem
                label="جلسه آزمایشی"
                value={
                  club.trialBookingEnabled
                    ? `فعال · ${(club.trialBookingPrice ?? 0).toLocaleString("fa-IR")} ریال`
                    : "غیرفعال"
                }
              />
            </DetailSection>

            <DetailSection title="ساعات شلوغی">
              {club.busyHours?.length ? (
                club.busyHours.map((item, index) => (
                  <DetailItem
                    key={`${item.dayOfWeek}-${item.hour}-${index}`}
                    label={dayNames[item.dayOfWeek] ?? `روز ${item.dayOfWeek}`}
                    value={`${item.hour.toLocaleString("fa-IR")}:۰۰ · ${
                      item.level === "quiet"
                        ? "خلوت"
                        : item.level === "moderate"
                          ? "متوسط"
                          : "شلوغ"
                    }`}
                  />
                ))
              ) : (
                <DetailItem label="ساعات شلوغی" value={null} wide />
              )}
              <DetailItem
                label="منبع / آخرین به‌روزرسانی"
                value={
                  club.busyHoursUpdatedAt || club.busyHoursSource
                    ? `${club.busyHoursSource === "owner_reported" ? "گزارش مالک" : (club.busyHoursSource ?? "—")} · ${formatDate(club.busyHoursUpdatedAt)}`
                    : null
                }
                wide
              />
            </DetailSection>

            <DetailSection title="پروفایل تخصصی">
              <DetailItem
                label="مساحت تمرین"
                value={
                  club.profile?.trainingAreaSquareMeters != null
                    ? `${club.profile.trainingAreaSquareMeters.toLocaleString("fa-IR")} متر مربع`
                    : null
                }
              />
              <DetailItem
                label="ظرفیت کلاس"
                value={
                  club.profile?.classCapacity != null
                    ? club.profile.classCapacity.toLocaleString("fa-IR")
                    : null
                }
              />
              <DetailItem
                label="تهویه / سرمایش / پارکینگ"
                value={
                  [
                    club.profile?.ventilation,
                    club.profile?.cooling,
                    club.profile?.parking,
                  ]
                    .filter(Boolean)
                    .join(" · ") || null
                }
                wide
              />
              <DetailItem
                label="دسترسی ویلچر"
                value={
                  club.profile?.wheelchairAccess
                    ? {
                        yes: "بله",
                        partial: "جزئی",
                        no: "خیر",
                        unknown: "نامشخص",
                      }[club.profile.wheelchairAccess]
                    : null
                }
              />
              <DetailItem
                label="فضاهای تخصصی"
                value={
                  club.profile?.spaces?.length
                    ? club.profile.spaces
                        .map((space) => {
                          const bits = [
                            space.name,
                            space.courtCount != null
                              ? `${space.courtCount.toLocaleString("fa-IR")} زمین`
                              : null,
                            space.areaSquareMeters != null
                              ? `${space.areaSquareMeters.toLocaleString("fa-IR")} م²`
                              : null,
                            space.roofType,
                          ].filter(Boolean);
                          return bits.join(" · ");
                        })
                        .join(" | ")
                    : null
                }
                wide
              />
              <DetailItem
                label="اولین بازدید"
                value={
                  club.profile?.firstVisit
                    ? [
                        club.profile.firstVisit.visitAvailable === false
                          ? "بازدید غیرفعال"
                          : "بازدید فعال",
                        club.profile.firstVisit.arrivalMinutesBefore != null
                          ? `${club.profile.firstVisit.arrivalMinutesBefore.toLocaleString("fa-IR")} دقیقه زودتر`
                          : null,
                        club.profile.firstVisit.instructions,
                        club.profile.firstVisit.extraFees,
                      ]
                        .filter(Boolean)
                        .join(" · ") || null
                    : null
                }
                wide
              />
            </DetailSection>

            <DetailSection title="زمان‌ها">
              <DetailItem label="ایجاد" value={formatDate(club.createdAt)} />
              <DetailItem
                label="آخرین تغییر"
                value={formatDate(club.updatedAt)}
              />
              <DetailItem
                label="نسخه طرح‌واره"
                value={club.schemaVersion.toLocaleString("fa-IR")}
              />
            </DetailSection>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-8">
          <Button variant="secondary" onPress={() => router.push("/clubs")}>
            بازگشت
          </Button>
          <ButtonLink href={`/clubs/${club.id}/edit`} variant="primary">
            ویرایش
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

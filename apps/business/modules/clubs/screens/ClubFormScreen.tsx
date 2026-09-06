"use client";

import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Autocomplete,
  Button,
  Card,
  ComboBox,
  Description,
  Disclosure,
  Input,
  Label,
  ListBox,
  ListLayout,
  NumberField,
  ScrollShadow,
  SearchField,
  Select,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  toast,
  useFilter,
  Virtualizer,
} from "@heroui/react";
import { Icon } from "@theme/icon";
import type { IconName } from "@theme/icon";
import {
  useBusinessCatalog,
  useBusinessClub,
  useBusinessMedia,
  useBusinessTags,
  useCreateBusinessClub,
  useCreateBusinessMedia,
  useInfiniteBusinessCatalog,
  useSubmitBusinessClub,
  useUpdateBusinessClub,
  type ClubCancellationRule,
  type BusinessTag,
  type SocialPlatform,
} from "@api/business";
import {
  imageUploaderAccept,
  Uploader,
  type UploaderLabels,
} from "@ui/uploader";
import {
  AvailabilityScheduler,
  defaultWeek,
  weekAvailabilityToWeeklyHours,
  weeklyHoursToWeekAvailability,
  type WeekAvailability,
} from "@ui/availability-scheduler";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";

import { ClubLocationMap } from "@/components/maps/club-location-map";
import { ClubProfileFields } from "./ClubProfileFields";
import type {
  ClubProfile,
  ClubBusyHour,
  ClubGalleryCategory,
} from "@api/business";

const inputClass =
  "box-border h-11 w-full min-w-0 max-w-full rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm outline-none backdrop-blur-md transition-[border-color,box-shadow] duration-200 focus:border-focus focus:ring-3 focus:ring-focus/15";
const textareaClass = `${inputClass} h-auto min-h-28 py-3`;
const platforms: SocialPlatform[] = [
  "instagram",
  "telegram",
  "whatsapp",
  "youtube",
  "aparat",
  "facebook",
  "linkedin",
  "x",
  "website",
  "email",
];
const clubFormSteps = [
  "basic",
  "gallery",
  "equipment",
  "amenities",
  "policies",
  "location",
  "profile",
  "operations",
  "completion",
] as const;
type ClubFormStep = (typeof clubFormSteps)[number];

type FacilityDraft = { quantity: number; description: string; name: string };
type FacilityMap = Record<string, FacilityDraft>;
type CatalogOption = { id: string; name: string; description?: string };
type ClubDynamicFields = {
  rules: Array<{ value: string }>;
  faqs: Array<{ question: string; answer: string }>;
};
type GalleryDraft = {
  category?: ClubGalleryCategory;
  takenOn?: string;
  mediaId?: string;
  url: string;
  title: string;
  altText: string;
  kind: "image" | "video";
  isCover: boolean;
};
type SocialDraft = { platform: SocialPlatform; link: string };

const platformIcons: Record<SocialPlatform, IconName> = {
  instagram: "camera-1",
  telegram: "paper-plane-horizontal",
  whatsapp: "chat",
  youtube: "video",
  aparat: "video",
  facebook: "users-two",
  linkedin: "briefcase-1",
  x: "close-x",
  website: "globe",
  email: "email-at",
};
const timezones = ["Asia/Tehran"] as const;

const defaultCancellationRules: ClubCancellationRule[] = [
  {
    title: "روزهای عادی",
    tiers: [
      { hoursBefore: 72, refundPercent: 40 },
      { hoursBefore: 24, refundPercent: 20 },
      { hoursBefore: 0, refundPercent: 0 },
    ],
  },
];

export function ClubFormScreen({ clubId }: { clubId?: string }) {
  const t = useTranslations("businessClubs");
  const tu = useTranslations("uploader");
  const { contains } = useFilter({ sensitivity: "base" });
  const router = useRouter();
  const club = useBusinessClub(clubId ?? "", Boolean(clubId));
  const media = useBusinessMedia();
  const create = useCreateBusinessClub();
  const update = useUpdateBusinessClub(clubId ?? "");
  const createMedia = useCreateBusinessMedia();
  const tagsQuery = useBusinessTags();
  const submitClub = useSubmitBusinessClub(clubId ?? "");
  const ageGroups = useBusinessCatalog("classes", "age-group");
  const countries = useBusinessCatalog("location", "country");
  const [activeStep, setActiveStep] = useState<ClubFormStep>("basic");

  const [name, setName] = useState("");
  const [profile, setProfile] = useState<ClubProfile>({});
  const [trialBookingEnabled, setTrialBookingEnabled] = useState(false);
  const [busyHours, setBusyHours] = useState<ClubBusyHour[]>([]);
  const [amenityAccess, setAmenityAccess] = useState<
    Record<
      string,
      {
        availability: "included" | "paid" | "unavailable";
        amount?: number;
        currency?: string;
      }
    >
  >({});
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClubTypes, setSelectedClubTypes] = useState<string[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<FacilityMap>({});
  const [amenities, setAmenities] = useState<FacilityMap>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [gallery, setGallery] = useState<GalleryDraft[]>([]);
  const [galleryUploaderKey, setGalleryUploaderKey] = useState(0);
  const [galleryUploaderBusy, setGalleryUploaderBusy] = useState(false);
  const [socialMedia, setSocialMedia] = useState<SocialDraft[]>([]);
  const [countryId, setCountryId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState("Asia/Tehran");
  const [locationNotes, setLocationNotes] = useState("");
  const [audience, setAudience] = useState<string[]>(["mixed"]);
  const [ageGroupId, setAgeGroupId] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [taxPercent, setTaxPercent] = useState(0);
  const [operationalStatus, setOperationalStatus] = useState<
    "active" | "temporarily_closed" | "permanently_closed" | "under_maintenance"
  >("active");
  const [weekAvailability, setWeekAvailability] = useState<WeekAvailability>(
    () => defaultWeek(),
  );
  const [cancellationRules, setCancellationRules] = useState<
    ClubCancellationRule[]
  >(defaultCancellationRules);
  const [formError, setFormError] = useState("");
  const dynamicForm = useForm<ClubDynamicFields>({
    defaultValues: { rules: [], faqs: [] },
  });
  const rulesFieldArray = useFieldArray({
    control: dynamicForm.control,
    name: "rules",
  });
  const faqsFieldArray = useFieldArray({
    control: dynamicForm.control,
    name: "faqs",
  });

  const provinces = useBusinessCatalog(
    "location",
    "province",
    { parentId: countryId },
    Boolean(countryId),
  );
  const cities = useBusinessCatalog(
    "location",
    "city",
    { parentId: provinceId },
    Boolean(provinceId),
  );
  const districts = useBusinessCatalog(
    "location",
    "district",
    { parentId: cityId },
    Boolean(cityId),
  );

  const locationPoint = useMemo(() => {
    if (!latitude.trim() || !longitude.trim()) return null;
    const nextLatitude = Number(latitude);
    const nextLongitude = Number(longitude);
    if (
      !Number.isFinite(nextLatitude) ||
      !Number.isFinite(nextLongitude) ||
      nextLatitude < -90 ||
      nextLatitude > 90 ||
      nextLongitude < -180 ||
      nextLongitude > 180
    ) {
      return null;
    }
    return { latitude: nextLatitude, longitude: nextLongitude };
  }, [latitude, longitude]);

  const mediaById = useMemo(
    () => new Map((media.data?.items ?? []).map((item) => [item.id, item])),
    [media.data?.items],
  );
  const tagOptions = useMemo(() => {
    const options = new Map<string, BusinessTag>();
    for (const item of tagsQuery.data?.items ?? []) {
      options.set(normalizeTagName(item.name), item);
    }
    for (const name of tags) {
      const normalized = normalizeTagName(name);
      if (!options.has(normalized)) {
        options.set(normalized, { id: `selected-${normalized}`, name });
      }
    }
    return [...options.values()];
  }, [tags, tagsQuery.data?.items]);
  const uploaderLabels: UploaderLabels = useMemo(
    () => ({
      clickToUpload: tu("clickToUpload"),
      dropHint: tu("dropHint"),
      formats: tu("formats"),
      progress: tu("progress"),
      success: tu("success"),
      error: tu("error"),
      retry: tu("retry"),
      remove: tu("remove"),
      dropzoneAria: tu("dropzoneAria"),
    }),
    [tu],
  );

  useEffect(() => {
    const value = club.data;
    if (!value) return;
    // The fetched entity is the initial value of this edit form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(value.name);
    setShortDescription(value.shortDescription);
    setDescription(value.description);
    setSelectedClubTypes(value.clubTypeIds);
    setSelectedSports(value.sportIds);
    setEquipment(
      Object.fromEntries(
        value.equipment.map((item) => [
          item.equipmentId,
          {
            quantity: item.quantity,
            description: item.description ?? "",
            name: "",
          },
        ]),
      ),
    );
    setAmenities(
      Object.fromEntries(
        value.amenities.map((item) => [
          item.amenityId,
          {
            quantity: item.quantity ?? 1,
            description: item.description ?? "",
            name: "",
          },
        ]),
      ),
    );
    dynamicForm.reset({
      rules: value.rules.map((rule) => ({ value: rule })),
      faqs: value.faqs,
    });
    setTags(value.tags);
    setProfile(value.profile ?? {});
    setTrialBookingEnabled(value.trialBookingEnabled ?? false);
    setBusyHours(value.busyHours ?? []);
    setAmenityAccess(
      Object.fromEntries(
        value.amenities.map((item) => [
          item.amenityId,
          {
            availability: item.availability,
            amount: item.price?.amount,
            currency: item.price?.currency,
          },
        ]),
      ),
    );
    setGallery(
      value.gallery.map((item) => ({
        mediaId: item.mediaId,
        url: "",
        title: item.title ?? "",
        altText: item.altText ?? "",
        kind: item.kind,
        isCover: item.isCover,
        category: item.category,
        takenOn: item.takenOn,
      })),
    );
    setSocialMedia(value.socialMedia);
    setCancellationRules(
      value.cancellationRules.length
        ? value.cancellationRules
        : defaultCancellationRules,
    );
    setAudience(value.audience);
    setCurrency(value.currency);
    setTaxPercent(value.taxPercent);
    setOperationalStatus(value.operationalStatus);
    setWeekAvailability(
      value.weeklyHours.length
        ? weeklyHoursToWeekAvailability(value.weeklyHours)
        : defaultWeek(),
    );
    if (value.location) {
      setCountryId(value.location.countryId);
      setProvinceId(value.location.provinceId);
      setCityId(value.location.cityId);
      setDistrictId(value.location.districtId ?? "");
      setAddress(value.location.address);
      setLatitude(String(value.location.latitude));
      setLongitude(String(value.location.longitude));
      setTimezone(value.location.timezone ?? "Asia/Tehran");
      setLocationNotes(value.location.locationNotes ?? "");
    }
  }, [club.data, dynamicForm]);

  const ageGroupOptions = useMemo(
    () =>
      (ageGroups.data?.items ?? [])
        .map((item) => {
          const min = Number(item.minAge);
          const max = Number(item.maxAge);
          if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
          return {
            id: item.id,
            name: item.name,
            minAge: min,
            maxAge: max,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [ageGroups.data?.items],
  );

  useEffect(() => {
    const value = club.data;
    if (!value || ageGroupOptions.length === 0) return;
    const matched = ageGroupOptions.find(
      (item) => item.minAge === value.minAge && item.maxAge === value.maxAge,
    );
    // Sync selected preset after catalog loads for an existing club.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgeGroupId(matched?.id ?? "");
  }, [ageGroupOptions, club.data]);

  const selectedAgeGroup = useMemo(
    () => ageGroupOptions.find((item) => item.id === ageGroupId) ?? null,
    [ageGroupId, ageGroupOptions],
  );

  const busy = create.isPending || update.isPending || createMedia.isPending;
  const selectCounted = (
    setter: React.Dispatch<React.SetStateAction<FacilityMap>>,
    selectedIds: string[],
    options: CatalogOption[],
  ) =>
    setter((current) => {
      const byId = new Map(options.map((item) => [item.id, item]));
      return Object.fromEntries(
        selectedIds.map((id) => {
          const existing = current[id];
          const option = byId.get(id);
          return [
            id,
            {
              quantity: existing?.quantity ?? 1,
              description: existing?.description ?? "",
              name: option?.name || existing?.name || id,
            },
          ];
        }),
      );
    });

  const save = dynamicForm.handleSubmit(async (dynamicValues) => {
    const cleanName = name.trim();
    const minimumAge = selectedAgeGroup?.minAge ?? null;
    const maximumAge = selectedAgeGroup?.maxAge ?? null;
    const hasSomeLocation = [
      countryId,
      provinceId,
      cityId,
      districtId,
      address,
      latitude,
      longitude,
    ].some((value) => value.trim().length > 0);
    const hasCompleteLocation = Boolean(
      countryId &&
      provinceId &&
      cityId &&
      address.trim() &&
      latitude.trim() &&
      longitude.trim(),
    );
    let validationError = "";
    let validationStep: ClubFormStep = "basic";
    if (cleanName.length < 2) {
      validationError = "نام باشگاه باید حداقل ۲ نویسه باشد.";
    } else if (selectedSports.length === 0) {
      validationError = "حداقل یک رشته ورزشی را انتخاب کنید.";
    } else if (audience.length === 0) {
      validationError = "حداقل یک گروه مخاطب را انتخاب کنید.";
      validationStep = "operations";
    } else if (!/^[A-Z]{3}$/.test(currency)) {
      validationError = "کد ارز باید سه حرف بزرگ انگلیسی باشد؛ مانند IRR.";
      validationStep = "operations";
    } else if (hasSomeLocation && !hasCompleteLocation) {
      validationError =
        "برای ثبت مکان، کشور، استان، شهر، نشانی و هر دو مختصات را کامل کنید.";
      validationStep = "location";
    } else if (
      hasCompleteLocation &&
      (Number(latitude) < -90 || Number(latitude) > 90)
    ) {
      validationError = "عرض جغرافیایی باید بین ۹۰- و ۹۰ باشد.";
      validationStep = "location";
    } else if (
      hasCompleteLocation &&
      (Number(longitude) < -180 || Number(longitude) > 180)
    ) {
      validationError = "طول جغرافیایی باید بین ۱۸۰- و ۱۸۰ باشد.";
      validationStep = "location";
    }

    if (
      !validationError &&
      profile.spaces?.some(
        (space) =>
          !space.name.trim() ||
          (space.poolMinDepthMeters != null &&
            space.poolMaxDepthMeters != null &&
            space.poolMinDepthMeters > space.poolMaxDepthMeters),
      )
    ) {
      validationError =
        "نام فضاها و بازه عمق استخر را بررسی کنید؛ بیشترین عمق نباید کمتر از کمترین عمق باشد.";
      validationStep = "profile";
    }
    if (
      !validationError &&
      Object.keys(amenities).some(
        (id) =>
          amenityAccess[id]?.availability === "paid" &&
          (amenityAccess[id]?.amount == null || amenityAccess[id]!.amount! < 0),
      )
    ) {
      validationError = "برای امکانات با هزینه جدا، مبلغ را مشخص کنید.";
      validationStep = "amenities";
    }
    if (validationError) {
      setFormError(validationError);
      setActiveStep(validationStep);
      requestAnimationFrame(() => {
        const error = document.getElementById("club-form-error");
        error?.focus();
        error?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setFormError("");
    try {
      const galleryPayload = await Promise.all(
        gallery
          .filter((item) => item.mediaId || item.url.trim())
          .map(async (item, index) => {
            if (item.mediaId)
              return {
                mediaId: item.mediaId,
                ...(item.title.trim() ? { title: item.title.trim() } : {}),
                ...(item.altText.trim()
                  ? { altText: item.altText.trim() }
                  : {}),
                kind: item.kind,
                position: index,
                isCover: item.isCover,
                category: item.category,
                takenOn: item.takenOn || undefined,
              };
            const created = await createMedia.mutateAsync({
              url: item.url.trim(),
              mimeType: "image/external",
            });
            return {
              mediaId: created.id,
              ...(item.title.trim() ? { title: item.title.trim() } : {}),
              ...(item.altText.trim() ? { altText: item.altText.trim() } : {}),
              kind: item.kind,
              position: index,
              isCover: item.isCover,
              category: item.category,
              takenOn: item.takenOn || undefined,
            };
          }),
      );
      const payload = {
        profile: {
          ...profile,
          firstVisit: profile.firstVisit
            ? {
                ...profile.firstVisit,
                requiredItems: profile.firstVisit.requiredItems
                  ?.map((item) => item.trim())
                  .filter(Boolean),
              }
            : undefined,
        },
        trialBookingEnabled,
        busyHours,
        name: cleanName,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        gallery: galleryPayload,
        clubTypeIds: selectedClubTypes,
        sportIds: selectedSports,
        equipment: Object.entries(equipment).map(([resourceId, item]) => ({
          resourceId,
          quantity: item.quantity,
          reservableQuantity: item.quantity,
          status: "available" as const,
          ...(item.description.trim()
            ? { description: item.description.trim() }
            : {}),
        })),
        amenities: Object.entries(amenities).map(([resourceId, item]) => ({
          resourceId,
          quantity: item.quantity,
          availability:
            amenityAccess[resourceId]?.availability ?? ("included" as const),
          ...(amenityAccess[resourceId]?.availability === "paid"
            ? {
                price: {
                  amount: amenityAccess[resourceId]?.amount ?? 0,
                  currency: amenityAccess[resourceId]?.currency ?? currency,
                },
              }
            : {}),
          ...(item.description.trim()
            ? { description: item.description.trim() }
            : {}),
        })),
        rules: dynamicValues.rules
          .map((item) => item.value.trim())
          .filter(Boolean),
        faqs: dynamicValues.faqs
          .map((item) => ({
            question: item.question.trim(),
            answer: item.answer.trim(),
          }))
          .filter((item) => item.question && item.answer),
        tags,
        socialMedia: socialMedia.filter((item) => item.link.trim()),
        cancellationRules,
        audience: audience as Array<
          "men" | "women" | "mixed" | "children" | "family"
        >,
        minAge: minimumAge,
        maxAge: maximumAge,
        currency,
        taxPercent,
        operationalStatus,
        weeklyHours: weekAvailabilityToWeeklyHours(weekAvailability),
        ...(hasCompleteLocation
          ? {
              location: {
                countryId,
                provinceId,
                cityId,
                districtId: districtId || null,
                address: address.trim(),
                latitude: Number(latitude),
                longitude: Number(longitude),
                timezone,
                locationNotes: locationNotes.trim(),
              },
            }
          : {}),
      };
      const result = clubId
        ? await update.mutateAsync(payload)
        : await create.mutateAsync(payload);
      toast.success(t("saveSuccess"));
      router.replace(`/clubs/${result.id}`);
    } catch {
      toast.danger(t("saveError"));
    }
  });

  const submitForReview = async () => {
    if (!clubId || !window.confirm(t("submitConfirm"))) return;
    try {
      await submitClub.mutateAsync();
      toast.success(t("submitSuccess"));
    } catch {
      toast.danger(t("submitError"));
    }
  };
  const addTag = async (value: string) => {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) return;

    const existing = tagOptions.find(
      (item) => normalizeTagName(item.name) === normalizeTagName(name),
    );
    if (existing) {
      if (
        !tags.some(
          (tag) => normalizeTagName(tag) === normalizeTagName(existing.name),
        ) &&
        tags.length >= 30
      ) {
        toast.danger(t("tagLimit"));
        return;
      }
      setTags((current) => uniqueTagNames([...current, existing.name]));
      setTagInput("");
      return;
    }
    if (tags.length >= 30) {
      toast.danger(t("tagLimit"));
      return;
    }

    toast.danger("تگ جدید باید توسط ادمین تعریف شود.");
  };
  const activeStepIndex = clubFormSteps.indexOf(activeStep);
  const selectStep = (index: number) => {
    const step = clubFormSteps[index];
    if (step) setActiveStep(step);
  };

  if (clubId && club.isPending)
    return (
      <div className="flex flex-1 justify-center py-20">
        <Spinner />
      </div>
    );

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">
              {clubId ? t("editTitle") : t("createTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted">{t("hint")}</p>
          </div>
          {clubId && (
            <Link
              href={`/clubs/${clubId}/reservations`}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:border-accent"
            >
              {t("manageReservations")}
            </Link>
          )}
          {club.data?.reviewStatus === "rejected" && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {club.data.rejectionReason}
            </p>
          )}
        </div>
        <form onSubmit={save} className="mt-6 min-w-0 space-y-5">
          {formError ? (
            <p
              id="club-form-error"
              role="alert"
              tabIndex={-1}
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger outline-none"
            >
              {formError}
            </p>
          ) : null}
          <Tabs
            selectedKey={activeStep}
            onSelectionChange={(key) =>
              setActiveStep(String(key) as ClubFormStep)
            }
            className="w-full min-w-0 max-w-full gap-5"
          >
            <Tabs.ListContainer className="w-full min-w-0 max-w-full">
              <Tabs.List aria-label={t("stepsLabel")}>
                {clubFormSteps.map((step, index) => (
                  <Tabs.Tab
                    key={step}
                    id={step}
                    className="w-auto shrink-0 whitespace-nowrap"
                  >
                    <span>{`${index + 1}. ${step === "profile" ? "معرفی تخصصی و شلوغی" : t(`steps.${step}`)}`}</span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id="basic" className="min-w-0 space-y-5">
              <Section title={t("basic")}>
                <Field label={t("name")} required>
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("description")} wide>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={textareaClass}
                  />
                </Field>
                <Field label={t("shortDescription")} wide>
                  <input
                    value={shortDescription}
                    maxLength={300}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("clubTypes")} wide group>
                  <SelectableList
                    category="sports"
                    resource="club-type"
                    selected={selectedClubTypes}
                    ariaLabel={t("clubTypes")}
                    selectionHint={t("facilitySelectionHint")}
                    searchPlaceholder={t("catalogSearchPlaceholder")}
                    onSelectionChange={setSelectedClubTypes}
                  />
                </Field>
                <Field label={t("sports")} wide group>
                  <SelectableList
                    category="sports"
                    resource="sport"
                    selected={selectedSports}
                    ariaLabel={t("sports")}
                    selectionHint={t("facilitySelectionHint")}
                    searchPlaceholder={t("catalogSearchPlaceholder")}
                    onSelectionChange={setSelectedSports}
                  />
                </Field>
                <Field label={t("tags")} wide group>
                  <div className="min-w-0 max-w-full">
                    <Autocomplete<BusinessTag, "multiple">
                      fullWidth
                      variant="secondary"
                      selectionMode="multiple"
                      value={tags}
                      onChange={(value) => {
                        const selected = Array.isArray(value)
                          ? value.map(String)
                          : value === null
                            ? []
                            : [String(value)];
                        setTags(uniqueTagNames(selected).slice(0, 30));
                        setTagInput("");
                      }}
                      placeholder={t("tagsPlaceholder")}
                      allowsEmptyCollection
                      className="min-w-0 max-w-full"
                    >
                      <Label className="sr-only">{t("tags")}</Label>
                      <Autocomplete.Trigger>
                        <Autocomplete.Value>
                          {({
                            defaultChildren,
                            isPlaceholder,
                            selectedText,
                          }) =>
                            isPlaceholder ? defaultChildren : selectedText
                          }
                        </Autocomplete.Value>
                        <Autocomplete.ClearButton aria-label={t("clearTags")} />
                        <Autocomplete.Indicator />
                      </Autocomplete.Trigger>
                      <Autocomplete.Popover aria-label={t("tagsSuggestions")}>
                        <Autocomplete.Filter
                          filter={contains}
                          inputValue={tagInput}
                          onInputChange={setTagInput}
                        >
                          <div
                            onKeyDownCapture={(
                              event: KeyboardEvent<HTMLDivElement>,
                            ) => {
                              const isNewTag = !tagOptions.some(
                                (item) =>
                                  normalizeTagName(item.name) ===
                                  normalizeTagName(tagInput),
                              );
                              if (
                                event.key === "Enter" &&
                                tagInput.trim() &&
                                isNewTag
                              ) {
                                event.preventDefault();
                                event.stopPropagation();
                                void addTag(tagInput);
                              }
                            }}
                          >
                            <SearchField
                              fullWidth
                              variant="secondary"
                              onSubmit={(value) => void addTag(value)}
                            >
                              <SearchField.Group>
                                <Icon
                                  name="magnifying-glass"
                                  className="shrink-0 text-muted"
                                />
                                <SearchField.Input
                                  placeholder={t("tagsSearchPlaceholder")}
                                  maxLength={50}
                                />
                                <SearchField.ClearButton />
                              </SearchField.Group>
                            </SearchField>
                          </div>
                          {tagInput.trim() &&
                          !tagOptions.some(
                            (item) =>
                              normalizeTagName(item.name) ===
                              normalizeTagName(tagInput),
                          ) ? (
                            <p className="p-3 text-xs text-muted">
                              تگ جدید باید توسط ادمین تعریف شود.
                            </p>
                          ) : null}
                          <ListBox items={tagOptions}>
                            {(item) => (
                              <ListBox.Item
                                id={item.name}
                                textValue={item.name}
                              >
                                {item.name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            )}
                          </ListBox>
                        </Autocomplete.Filter>
                      </Autocomplete.Popover>
                    </Autocomplete>
                  </div>
                  <p className="text-xs text-muted">
                    از تگ‌های تعریف‌شده توسط ادمین انتخاب کنید.
                  </p>
                </Field>
              </Section>
            </Tabs.Panel>

            <Tabs.Panel id="gallery" className="min-w-0 space-y-5">
              <Section title={t("gallery")}>
                <div className="md:col-span-2 min-w-0 space-y-4">
                  <Uploader
                    key={galleryUploaderKey}
                    multiple={false}
                    accept={imageUploaderAccept}
                    labels={uploaderLabels}
                    className="min-w-0"
                    onDrop={() => setGalleryUploaderBusy(true)}
                    onRemove={() => setGalleryUploaderBusy(false)}
                    onUpload={async (file) => {
                      const created = await createMedia.mutateAsync(file);
                      setGallery((current) => [
                        ...current,
                        {
                          mediaId: created.id,
                          url: created.url,
                          title: "",
                          altText: "",
                          kind: "image",
                          isCover: current.length === 0,
                        },
                      ]);
                      setGalleryUploaderBusy(false);
                      setGalleryUploaderKey((current) => current + 1);
                    }}
                  />
                  {gallery.length === 0 && !galleryUploaderBusy ? (
                    <CatalogEmptyState
                      icon="image-1"
                      title={t("galleryEmpty")}
                      description={t("galleryEmptyHint")}
                    />
                  ) : null}
                  {gallery.map((item, index) => {
                    const previewUrl =
                      item.url ||
                      (item.mediaId
                        ? mediaById.get(item.mediaId)?.url
                        : undefined);

                    return (
                      <div
                        key={`${item.mediaId ?? "new"}-${index}`}
                        className="app-surface grid min-w-0 gap-3 rounded-[1.15rem] p-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto]"
                      >
                        {previewUrl ? (
                          // Dynamic uploader previews may be blob/data URLs.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={item.altText || item.title || "gallery"}
                            className="h-28 w-full rounded-xl border border-white/10 object-cover sm:h-24"
                          />
                        ) : (
                          <div className="grid h-28 place-items-center rounded-xl border border-dashed border-white/10 text-xs text-muted sm:h-24">
                            {t("image")}
                          </div>
                        )}
                        <div className="grid min-w-0 gap-2">
                          <label className="text-sm">
                            دسته عکس
                            <select
                              className={inputClass}
                              value={item.category ?? "other"}
                              onChange={(e) =>
                                setGallery((current) =>
                                  current.map((v, i) =>
                                    i === index
                                      ? {
                                          ...v,
                                          category: e.target
                                            .value as ClubGalleryCategory,
                                        }
                                      : v,
                                  ),
                                )
                              }
                            >
                              <option value="training">فضای تمرین</option>
                              <option value="equipment">تجهیزات</option>
                              <option value="changing_room">رختکن</option>
                              <option value="entrance">نمای ورودی</option>
                              <option value="other">سایر</option>
                            </select>
                          </label>
                          <label className="text-sm">
                            تاریخ ثبت عکس
                            <input
                              type="date"
                              max={new Date().toISOString().slice(0, 10)}
                              className={inputClass}
                              value={item.takenOn ?? ""}
                              onChange={(e) =>
                                setGallery((current) =>
                                  current.map((v, i) =>
                                    i === index
                                      ? { ...v, takenOn: e.target.value }
                                      : v,
                                  ),
                                )
                              }
                            />
                          </label>
                          <input
                            value={item.title}
                            onChange={(e) =>
                              setGallery((current) =>
                                current.map((value, i) =>
                                  i === index
                                    ? { ...value, title: e.target.value }
                                    : value,
                                ),
                              )
                            }
                            className={inputClass}
                            placeholder={t("mediaTitle")}
                          />
                          <input
                            value={item.altText}
                            onChange={(e) =>
                              setGallery((current) =>
                                current.map((value, i) =>
                                  i === index
                                    ? { ...value, altText: e.target.value }
                                    : value,
                                ),
                              )
                            }
                            className={inputClass}
                            placeholder={t("mediaAlt")}
                          />
                          <Switch
                            isSelected={item.isCover}
                            onChange={(checked) => {
                              if (!checked) return;
                              setGallery((current) =>
                                current.map((value, i) => ({
                                  ...value,
                                  isCover: i === index,
                                })),
                              );
                            }}
                          >
                            <Switch.Content>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              {t("cover")}
                            </Switch.Content>
                          </Switch>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          isIconOnly
                          aria-label={t("remove")}
                          className="justify-self-end sm:justify-self-auto"
                          onPress={() =>
                            setGallery((current) => {
                              const next = current.filter(
                                (_, i) => i !== index,
                              );
                              if (
                                next.length > 0 &&
                                !next.some((value) => value.isCover)
                              ) {
                                next[0] = { ...next[0]!, isCover: true };
                              }
                              return next;
                            })
                          }
                        >
                          <Icon name="trash-1" size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </Tabs.Panel>

            <Tabs.Panel id="equipment" className="min-w-0 space-y-5">
              <Section title={t("equipment")}>
                <Field label={t("equipment")} wide group>
                  <CountedGrid
                    category="facilities"
                    resource="equipment"
                    values={equipment}
                    ariaLabel={t("equipment")}
                    selectionHint={t("facilitySelectionHint")}
                    searchPlaceholder={t("catalogSearchPlaceholder")}
                    selectedLabel={t("selectedFacilityItems")}
                    removeLabel={t("remove")}
                    quantityLabel={t("quantity")}
                    descriptionLabel={t("itemDescription")}
                    onSelectionChange={(selectedIds, options) =>
                      selectCounted(setEquipment, selectedIds, options)
                    }
                    onQuantity={(id, quantity) =>
                      setEquipment((current) => ({
                        ...current,
                        [id]: {
                          quantity,
                          description: current[id]?.description ?? "",
                          name: current[id]?.name ?? id,
                        },
                      }))
                    }
                    onDescription={(id, description) =>
                      setEquipment((current) => ({
                        ...current,
                        [id]: {
                          quantity: current[id]?.quantity ?? 1,
                          description,
                          name: current[id]?.name ?? id,
                        },
                      }))
                    }
                  />
                </Field>
              </Section>
            </Tabs.Panel>

            <Tabs.Panel id="amenities" className="min-w-0 space-y-5">
              <Section title={t("amenities")}>
                <Field label={t("amenities")} wide group>
                  <CountedGrid
                    category="facilities"
                    resource="amenity"
                    renderExtra={(id) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm">
                          وضعیت استفاده
                          <select
                            className={inputClass}
                            value={
                              amenityAccess[id]?.availability ?? "included"
                            }
                            onChange={(e) =>
                              setAmenityAccess((current) => ({
                                ...current,
                                [id]: {
                                  ...current[id],
                                  availability: e.target.value as
                                    "included" | "paid" | "unavailable",
                                },
                              }))
                            }
                          >
                            <option value="included">داخل شهریه</option>
                            <option value="paid">با هزینه جدا</option>
                            <option value="unavailable">فعلاً غیرفعال</option>
                          </select>
                        </label>
                        {amenityAccess[id]?.availability === "paid" && (
                          <label className="text-sm">
                            هزینه ({amenityAccess[id]?.currency ?? currency})
                            <input
                              type="number"
                              min={0}
                              step={1}
                              className={inputClass}
                              value={amenityAccess[id]?.amount ?? ""}
                              onChange={(e) =>
                                setAmenityAccess((current) => ({
                                  ...current,
                                  [id]: {
                                    ...current[id]!,
                                    amount:
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value),
                                  },
                                }))
                              }
                            />
                          </label>
                        )}
                      </div>
                    )}
                    values={amenities}
                    ariaLabel={t("amenities")}
                    selectionHint={t("facilitySelectionHint")}
                    searchPlaceholder={t("catalogSearchPlaceholder")}
                    selectedLabel={t("selectedFacilityItems")}
                    removeLabel={t("remove")}
                    quantityLabel={t("quantity")}
                    descriptionLabel={t("itemDescription")}
                    onSelectionChange={(selectedIds, options) =>
                      selectCounted(setAmenities, selectedIds, options)
                    }
                    onQuantity={(id, quantity) =>
                      setAmenities((current) => ({
                        ...current,
                        [id]: {
                          quantity,
                          description: current[id]?.description ?? "",
                          name: current[id]?.name ?? id,
                        },
                      }))
                    }
                    onDescription={(id, description) =>
                      setAmenities((current) => ({
                        ...current,
                        [id]: {
                          quantity: current[id]?.quantity ?? 1,
                          description,
                          name: current[id]?.name ?? id,
                        },
                      }))
                    }
                  />
                </Field>
              </Section>
            </Tabs.Panel>

            <Tabs.Panel id="policies" className="min-w-0 space-y-5">
              <Section title={t("policiesAndFaqs")}>
                <Field label={t("rules")} wide group>
                  <div className="space-y-2">
                    {rulesFieldArray.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-start gap-2 rounded-xl border border-border p-3"
                      >
                        <TextArea
                          {...dynamicForm.register(`rules.${index}.value`)}
                          fullWidth
                          variant="secondary"
                          className="min-h-20"
                          placeholder={t("rulePlaceholder")}
                          aria-label={`${t("rules")} ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          isIconOnly
                          aria-label={t("remove")}
                          onPress={() => rulesFieldArray.remove(index)}
                        >
                          <Icon name="trash-1" size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() => rulesFieldArray.append({ value: "" })}
                    >
                      {t("addRule")}
                    </Button>
                  </div>
                </Field>
                <Field label={t("faqs")} wide group>
                  <div className="space-y-3">
                    {faqsFieldArray.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="space-y-3 rounded-xl border border-border p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {t("faqItemTitle", { index: index + 1 })}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            isIconOnly
                            aria-label={t("remove")}
                            onPress={() => faqsFieldArray.remove(index)}
                          >
                            <Icon name="trash-1" size={16} />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <input
                            {...dynamicForm.register(`faqs.${index}.question`)}
                            className={inputClass}
                            placeholder={t("faqQuestion")}
                            aria-label={`${t("faqQuestion")} ${index + 1}`}
                          />
                          <TextArea
                            {...dynamicForm.register(`faqs.${index}.answer`)}
                            fullWidth
                            variant="secondary"
                            className="min-h-20"
                            placeholder={t("faqAnswer")}
                            aria-label={`${t("faqAnswer")} ${index + 1}`}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() =>
                        faqsFieldArray.append({ question: "", answer: "" })
                      }
                    >
                      {t("addFaq")}
                    </Button>
                  </div>
                </Field>
              </Section>
            </Tabs.Panel>

            <Tabs.Panel id="location" className="min-w-0 space-y-5">
              <Section title={t("location")}>
                <CatalogComboBox
                  label={t("country")}
                  value={countryId}
                  items={countries.data?.items ?? []}
                  placeholder={t("locationSearchPlaceholder", {
                    field: t("country"),
                  })}
                  onChange={(value) => {
                    setCountryId(value);
                    setProvinceId("");
                    setCityId("");
                    setDistrictId("");
                  }}
                />
                <CatalogComboBox
                  label={t("province")}
                  value={provinceId}
                  items={provinces.data?.items ?? []}
                  placeholder={t("locationSearchPlaceholder", {
                    field: t("province"),
                  })}
                  isDisabled={!countryId}
                  onChange={(value) => {
                    setProvinceId(value);
                    setCityId("");
                    setDistrictId("");
                  }}
                />
                <CatalogComboBox
                  label={t("city")}
                  value={cityId}
                  items={cities.data?.items ?? []}
                  placeholder={t("locationSearchPlaceholder", {
                    field: t("city"),
                  })}
                  isDisabled={!provinceId}
                  onChange={(value) => {
                    setCityId(value);
                    setDistrictId("");
                  }}
                />
                <CatalogComboBox
                  label={t("district")}
                  value={districtId}
                  items={districts.data?.items ?? []}
                  placeholder={t("locationSearchPlaceholder", {
                    field: t("district"),
                  })}
                  isDisabled={!cityId}
                  onChange={setDistrictId}
                />
                <Field label={t("address")} wide>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={textareaClass}
                  />
                </Field>
                {activeStep === "location" ? (
                  <ClubLocationMap
                    point={locationPoint}
                    onPointChange={(point) => {
                      setLatitude(point.latitude.toFixed(6));
                      setLongitude(point.longitude.toFixed(6));
                    }}
                    labels={{
                      loading: t("mapLoading"),
                      unavailable: t("mapUnavailable"),
                      instructions: t("mapInstructions"),
                    }}
                  />
                ) : null}
                {locationPoint ? (
                  <div
                    dir="ltr"
                    className="md:col-span-2 grid min-w-0 grid-cols-2 gap-3 text-sm"
                  >
                    <div className="rounded-xl bg-surface-secondary px-3 py-2">
                      <span className="block text-xs text-muted">
                        {t("latitude")}
                      </span>
                      {latitude}
                    </div>
                    <div className="rounded-xl bg-surface-secondary px-3 py-2">
                      <span className="block text-xs text-muted">
                        {t("longitude")}
                      </span>
                      {longitude}
                    </div>
                  </div>
                ) : null}
                <Select
                  fullWidth
                  variant="secondary"
                  value={timezone}
                  isDisabled
                >
                  <Label>{t("timezone")}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {timezones.map((value) => (
                        <ListBox.Item key={value} id={value} textValue={value}>
                          <span dir="ltr">{value}</span>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <Field label={t("locationNotes")} wide>
                  <input
                    value={locationNotes}
                    onChange={(e) => setLocationNotes(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </Section>
            </Tabs.Panel>

            <Tabs.Panel id="profile" className="min-w-0 space-y-5">
              <Section title="معرفی تخصصی و تجربه مراجعه">
                <ClubProfileFields
                  resourceLabels={club.data?.profileResources}
                  value={profile}
                  onChange={setProfile}
                  trial={trialBookingEnabled}
                  onTrialChange={setTrialBookingEnabled}
                  busyHours={busyHours}
                  onBusyHoursChange={setBusyHours}
                />
              </Section>
            </Tabs.Panel>
            <Tabs.Panel id="operations" className="min-w-0 space-y-5">
              <Section title={t("operations")}>
                <Field label={t("operationalStatus")}>
                  <select
                    className={inputClass}
                    value={operationalStatus}
                    onChange={(e) =>
                      setOperationalStatus(
                        e.target.value as typeof operationalStatus,
                      )
                    }
                  >
                    {(
                      [
                        "active",
                        "temporarily_closed",
                        "permanently_closed",
                        "under_maintenance",
                      ] as const
                    ).map((value) => (
                      <option key={value} value={value}>
                        {t(`statuses.${value}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("currency")}>
                  <input
                    dir="ltr"
                    required
                    minLength={3}
                    maxLength={3}
                    pattern="[A-Z]{3}"
                    title="کد ارز باید سه حرف بزرگ انگلیسی باشد؛ مانند IRR."
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("taxPercent")}>
                  <NumberField
                    aria-label={t("taxPercent")}
                    minValue={0}
                    maxValue={100}
                    step={1}
                    value={taxPercent}
                    onChange={(value) =>
                      setTaxPercent(
                        typeof value === "number" && Number.isFinite(value)
                          ? Math.max(0, Math.min(100, Math.round(value)))
                          : 0,
                      )
                    }
                    fullWidth
                    variant="secondary"
                  >
                    <Label className="sr-only">{t("taxPercent")}</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton />
                      <NumberField.Input />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
                </Field>
                <Field label={t("ageRange")} wide>
                  <Select
                    fullWidth
                    variant="secondary"
                    value={ageGroupId || null}
                    onChange={(value) => {
                      if (typeof value === "string") setAgeGroupId(value);
                      else setAgeGroupId("");
                    }}
                    placeholder={t("ageGroupPlaceholder")}
                  >
                    <Label className="sr-only">{t("ageRange")}</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox items={ageGroupOptions}>
                        {(item) => (
                          <ListBox.Item
                            id={item.id}
                            textValue={`${item.name} ${item.minAge}-${item.maxAge}`}
                          >
                            <div className="flex min-w-0 flex-col">
                              <Label>{item.name}</Label>
                              <Description>
                                {t("ageGroupRange", {
                                  min: item.minAge,
                                  max: item.maxAge,
                                })}
                              </Description>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  {ageGroupOptions.length === 0 ? (
                    <p className="mt-2 text-xs text-muted">
                      {t("ageGroupEmpty")}
                    </p>
                  ) : null}
                </Field>
                <Field label={t("audience")} wide group>
                  <div className="flex flex-wrap gap-3">
                    {(
                      ["men", "women", "mixed", "children", "family"] as const
                    ).map((value) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={audience.includes(value)}
                          onChange={(e) =>
                            setAudience((current) =>
                              e.target.checked
                                ? [...new Set([...current, value])]
                                : current.filter((item) => item !== value),
                            )
                          }
                        />
                        {t(`audiences.${value}`)}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label={t("weeklyHours")} wide group>
                  {activeStep === "operations" ? (
                    <AvailabilityScheduler
                      className="max-w-none rounded-[1.15rem] border border-white/10 bg-surface/80/40 px-3"
                      value={weekAvailability}
                      onChange={setWeekAvailability}
                      step={30}
                      maxRanges={2}
                    />
                  ) : null}
                </Field>
              </Section>
            </Tabs.Panel>

            <Tabs.Panel id="completion" className="min-w-0 space-y-5">
              <Section title={t("socialMedia")}>
                <div className="grid gap-3 md:col-span-2 sm:grid-cols-2 xl:grid-cols-3">
                  {socialMedia.map((item, index) => (
                    <div
                      key={index}
                      className="flex min-w-0 flex-col gap-3 rounded-xl border border-border p-3"
                    >
                      <Select
                        fullWidth
                        variant="secondary"
                        value={item.platform}
                        onChange={(selected) => {
                          if (typeof selected !== "string") return;
                          setSocialMedia((current) =>
                            current.map((value, i) =>
                              i === index
                                ? {
                                    ...value,
                                    platform: selected as SocialPlatform,
                                  }
                                : value,
                            ),
                          );
                        }}
                      >
                        <Label>{t("socialPlatform")}</Label>
                        <Select.Trigger>
                          <Select.Value>
                            {({ defaultChildren, isPlaceholder }) => {
                              if (isPlaceholder) return defaultChildren;
                              return (
                                <span className="flex min-w-0 items-center gap-2">
                                  <SocialPlatformIcon
                                    platform={item.platform}
                                  />
                                  <span className="truncate">
                                    {t(`platforms.${item.platform}`)}
                                  </span>
                                </span>
                              );
                            }}
                          </Select.Value>
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {platforms.map((platform) => (
                              <ListBox.Item
                                key={platform}
                                id={platform}
                                textValue={t(`platforms.${platform}`)}
                              >
                                <span className="flex items-center gap-2">
                                  <SocialPlatformIcon platform={platform} />
                                  <span>{t(`platforms.${platform}`)}</span>
                                </span>
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <label className="space-y-2">
                        <span className="block text-sm font-medium">
                          {t("socialLink")}
                        </span>
                        <input
                          dir="ltr"
                          type={item.platform === "email" ? "email" : "url"}
                          value={item.link}
                          onChange={(e) =>
                            setSocialMedia((current) =>
                              current.map((value, i) =>
                                i === index
                                  ? { ...value, link: e.target.value }
                                  : value,
                              ),
                            )
                          }
                          className={inputClass}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        className="self-end"
                        onPress={() =>
                          setSocialMedia((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        {t("remove")}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onPress={() =>
                      setSocialMedia((current) => [
                        ...current,
                        { platform: "instagram", link: "" },
                      ])
                    }
                  >
                    {t("addSocial")}
                  </Button>
                </div>
              </Section>

              <Section title={t("cancellation")}>
                {cancellationRules.map((rule, ruleIndex) => (
                  <div
                    key={ruleIndex}
                    className="space-y-3 rounded-xl border border-border p-4"
                  >
                    <div className="flex gap-2">
                      <input
                        value={rule.title}
                        onChange={(e) =>
                          setCancellationRules((current) =>
                            current.map((value, i) =>
                              i === ruleIndex
                                ? { ...value, title: e.target.value }
                                : value,
                            ),
                          )
                        }
                        className={inputClass}
                        placeholder={t("policyTitle")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() =>
                          setCancellationRules((current) =>
                            current.filter((_, i) => i !== ruleIndex),
                          )
                        }
                      >
                        {t("remove")}
                      </Button>
                    </div>
                    {rule.tiers.map((tier, tierIndex) => (
                      <div
                        key={tierIndex}
                        className="grid min-w-0 grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_1fr_auto]"
                      >
                        <NumberField
                          aria-label={t("hoursBefore")}
                          minValue={0}
                          step={1}
                          value={tier.hoursBefore}
                          onChange={(value) =>
                            updateTier(
                              setCancellationRules,
                              ruleIndex,
                              tierIndex,
                              "hoursBefore",
                              Number.isFinite(value)
                                ? Math.max(0, Math.round(value))
                                : 0,
                            )
                          }
                          fullWidth
                          variant="secondary"
                        >
                          <Label>{t("hoursBefore")}</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </NumberField>
                        <NumberField
                          aria-label={t("refundPercent")}
                          minValue={0}
                          maxValue={100}
                          step={1}
                          value={tier.refundPercent}
                          onChange={(value) =>
                            updateTier(
                              setCancellationRules,
                              ruleIndex,
                              tierIndex,
                              "refundPercent",
                              Number.isFinite(value)
                                ? Math.max(0, Math.min(100, Math.round(value)))
                                : 0,
                            )
                          }
                          fullWidth
                          variant="secondary"
                        >
                          <Label>{t("refundPercent")}</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </NumberField>
                        <Button
                          type="button"
                          variant="ghost"
                          onPress={() =>
                            setCancellationRules((current) =>
                              current.map((value, i) =>
                                i === ruleIndex
                                  ? {
                                      ...value,
                                      tiers: value.tiers.filter(
                                        (_, j) => j !== tierIndex,
                                      ),
                                    }
                                  : value,
                              ),
                            )
                          }
                        >
                          {t("remove")}
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() =>
                        setCancellationRules((current) =>
                          current.map((value, i) =>
                            i === ruleIndex
                              ? {
                                  ...value,
                                  tiers: [
                                    ...value.tiers,
                                    { hoursBefore: 0, refundPercent: 0 },
                                  ],
                                }
                              : value,
                          ),
                        )
                      }
                    >
                      {t("addTier")}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onPress={() =>
                    setCancellationRules((current) => [
                      ...current,
                      {
                        title: "",
                        tiers: [{ hoursBefore: 0, refundPercent: 0 }],
                      },
                    ])
                  }
                >
                  {t("addPolicy")}
                </Button>
              </Section>
            </Tabs.Panel>
          </Tabs>

          <div className="app-surface sticky bottom-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] p-3 shadow-lg">
            <span className="me-auto text-sm text-muted">
              {t("stepProgress", {
                current: activeStepIndex + 1,
                total: clubFormSteps.length,
              })}
            </span>
            {activeStepIndex > 0 ? (
              <Button
                type="button"
                variant="tertiary"
                onPress={() => selectStep(activeStepIndex - 1)}
              >
                {t("previousStep")}
              </Button>
            ) : null}
            {activeStepIndex < clubFormSteps.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onPress={() => selectStep(activeStepIndex + 1)}
              >
                {t("nextStep")}
              </Button>
            ) : null}
            {activeStep === "completion" &&
              clubId &&
              (club.data?.reviewStatus === "draft" ||
                club.data?.reviewStatus === "rejected") && (
                <Button
                  type="button"
                  variant="secondary"
                  onPress={submitForReview}
                  isPending={submitClub.isPending}
                >
                  {t("submit")}
                </Button>
              )}
            {activeStep === "completion" ? (
              <Button type="submit" variant="primary" isPending={busy}>
                {t("save")}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      variant="transparent"
      className="app-card min-w-0 max-w-full overflow-hidden p-4 shadow-none active:scale-100 sm:p-5"
    >
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}
function Field({
  label,
  children,
  wide,
  required,
  group,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  required?: boolean;
  group?: boolean;
}) {
  const className = `min-w-0 space-y-2 ${wide ? "md:col-span-2" : ""}`;
  const labelContent = (
    <span className="block text-sm font-medium">
      {label}
      {required ? " *" : ""}
    </span>
  );

  if (group) {
    return (
      <div className={className} role="group" aria-label={label}>
        {labelContent}
        {children}
      </div>
    );
  }

  return (
    <label className={className}>
      {labelContent}
      {children}
    </label>
  );
}
function mergeCatalogSelection(
  currentIds: string[],
  visibleIds: string[],
  selection: "all" | Set<React.Key>,
) {
  const visible = new Set(visibleIds);
  const nextVisible =
    selection === "all" ? visibleIds : [...selection].map(String);
  const preserved = currentIds.filter((id) => !visible.has(id));
  return [...new Set([...preserved, ...nextVisible])];
}

function useDebouncedValue(value: string, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}

function CatalogSearchField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <SearchField
      value={value}
      onChange={onChange}
      fullWidth
      variant="secondary"
      aria-label={placeholder}
    >
      <Label className="sr-only">{placeholder}</Label>
      <SearchField.Group>
        <Icon name="magnifying-glass" className="shrink-0 text-muted" />
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}

function useCatalogOptions(
  category: string,
  resource: string,
  search: string,
  enabled: boolean,
) {
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useInfiniteBusinessCatalog(
    category,
    resource,
    debouncedSearch ? { search: debouncedSearch } : undefined,
    enabled,
  );
  const items = useMemo(
    () =>
      (query.data?.pages ?? []).flatMap((page) =>
        page.items.map((item) => ({
          id: item.id,
          name: item.name,
          description:
            typeof item.description === "string" ? item.description : undefined,
        })),
      ),
    [query.data?.pages],
  );

  return { ...query, items };
}

function CatalogScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, onLoadMore]);

  if (!hasNextPage && !isFetchingNextPage) return null;

  return (
    <div
      ref={sentinelRef}
      className="grid h-10 place-items-center text-xs text-muted"
    >
      {isFetchingNextPage ? <Spinner size="sm" /> : null}
    </div>
  );
}

function CatalogEmptyState({
  title,
  description,
  icon = "magnifying-glass",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <div className="app-surface flex min-h-52 flex-col items-center justify-center rounded-[1.35rem] px-5 py-8 text-center">
      <div className="grid size-14 place-items-center rounded-[1.1rem] bg-surface-secondary/80 text-muted">
        <Icon name={icon} size="lg" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-[36ch] text-xs leading-6 text-muted">
        {description}
      </p>
    </div>
  );
}

function CatalogScrollArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ScrollShadow
      hideScrollBar
      size={48}
      orientation="vertical"
      className={
        className ??
        "h-80 min-w-0 max-w-full rounded-[1.15rem] border border-white/10 bg-surface/80"
      }
    >
      {children}
    </ScrollShadow>
  );
}

function SelectableList({
  category,
  resource,
  selected,
  ariaLabel,
  selectionHint,
  searchPlaceholder,
  onSelectionChange,
}: {
  category: string;
  resource: string;
  selected: string[];
  ariaLabel: string;
  selectionHint: string;
  searchPlaceholder: string;
  onSelectionChange: (ids: string[]) => void;
}) {
  const t = useTranslations("businessClubs");
  const [search, setSearch] = useState("");
  const catalog = useCatalogOptions(category, resource, search, true);
  const isEmpty = !catalog.isPending && catalog.items.length === 0;

  return (
    <div className="min-w-0 max-w-full space-y-3">
      <CatalogSearchField
        value={search}
        placeholder={searchPlaceholder}
        onChange={setSearch}
      />
      <CatalogScrollArea>
        {catalog.isPending ? (
          <div className="grid h-full min-h-52 place-items-center">
            <Spinner />
          </div>
        ) : isEmpty ? (
          <div className="p-3">
            <CatalogEmptyState
              icon="list-two-bullet"
              title={
                search.trim() ? t("catalogEmptySearch") : t("catalogEmpty")
              }
              description={t("catalogEmptyHint")}
            />
          </div>
        ) : (
          <>
            <Virtualizer
              layout={ListLayout}
              layoutOptions={{ gap: 4, padding: 8, rowHeight: 58 }}
            >
              <ListBox
                aria-label={ariaLabel}
                className="w-full min-w-0 max-w-full"
                items={catalog.items}
                selectedKeys={new Set(selected)}
                selectionMode="multiple"
                onSelectionChange={(selection) =>
                  onSelectionChange(
                    mergeCatalogSelection(
                      selected,
                      catalog.items.map((item) => item.id),
                      selection,
                    ),
                  )
                }
              >
                {(item) => (
                  <ListBox.Item id={item.id} textValue={item.name}>
                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                      <Label className="truncate">{item.name}</Label>
                      <Description className="line-clamp-1">
                        {item.description ?? selectionHint}
                      </Description>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </Virtualizer>
            <CatalogScrollSentinel
              hasNextPage={Boolean(catalog.hasNextPage)}
              isFetchingNextPage={catalog.isFetchingNextPage}
              onLoadMore={() => {
                if (catalog.hasNextPage && !catalog.isFetchingNextPage) {
                  void catalog.fetchNextPage();
                }
              }}
            />
          </>
        )}
      </CatalogScrollArea>
    </div>
  );
}

function CountedGrid({
  category,
  resource,
  values,
  ariaLabel,
  selectionHint,
  searchPlaceholder,
  selectedLabel,
  removeLabel,
  quantityLabel,
  descriptionLabel,
  onSelectionChange,
  onQuantity,
  onDescription,
  renderExtra,
}: {
  category: string;
  resource: string;
  values: FacilityMap;
  ariaLabel: string;
  selectionHint: string;
  searchPlaceholder: string;
  selectedLabel: string;
  removeLabel: string;
  quantityLabel: string;
  descriptionLabel: string;
  onSelectionChange: (ids: string[], options: CatalogOption[]) => void;
  onQuantity: (id: string, quantity: number) => void;
  onDescription: (id: string, description: string) => void;
  renderExtra?: (id: string) => React.ReactNode;
}) {
  const t = useTranslations("businessClubs");
  const [search, setSearch] = useState("");
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const catalog = useCatalogOptions(category, resource, search, true);
  const isEmpty = !catalog.isPending && catalog.items.length === 0;
  const selectedItems = useMemo(
    () =>
      Object.entries(values).map(([id, draft]) => {
        const option = catalog.items.find((item) => item.id === id);
        return {
          id,
          name: option?.name || draft.name || id,
          description: draft.description,
          quantity: draft.quantity,
        };
      }),
    [catalog.items, values],
  );

  return (
    <div className="min-w-0 max-w-full space-y-5">
      <div className="min-w-0 max-w-full space-y-3">
        <CatalogSearchField
          value={search}
          placeholder={searchPlaceholder}
          onChange={setSearch}
        />
        <CatalogScrollArea>
          {catalog.isPending ? (
            <div className="grid h-full min-h-52 place-items-center">
              <Spinner />
            </div>
          ) : isEmpty ? (
            <div className="p-3">
              <CatalogEmptyState
                icon="list-two-bullet"
                title={
                  search.trim() ? t("catalogEmptySearch") : t("catalogEmpty")
                }
                description={t("catalogEmptyHint")}
              />
            </div>
          ) : (
            <>
              <Virtualizer
                layout={ListLayout}
                layoutOptions={{ gap: 4, padding: 8, rowHeight: 58 }}
              >
                <ListBox
                  aria-label={ariaLabel}
                  className="w-full min-w-0 max-w-full"
                  items={catalog.items}
                  selectedKeys={new Set(Object.keys(values))}
                  selectionMode="multiple"
                  onSelectionChange={(selection) =>
                    onSelectionChange(
                      mergeCatalogSelection(
                        Object.keys(values),
                        catalog.items.map((item) => item.id),
                        selection,
                      ),
                      catalog.items,
                    )
                  }
                >
                  {(item) => (
                    <ListBox.Item id={item.id} textValue={item.name}>
                      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        <Label className="truncate">{item.name}</Label>
                        <Description className="line-clamp-1">
                          {item.description ?? selectionHint}
                        </Description>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )}
                </ListBox>
              </Virtualizer>
              <CatalogScrollSentinel
                hasNextPage={Boolean(catalog.hasNextPage)}
                isFetchingNextPage={catalog.isFetchingNextPage}
                onLoadMore={() => {
                  if (catalog.hasNextPage && !catalog.isFetchingNextPage) {
                    void catalog.fetchNextPage();
                  }
                }}
              />
            </>
          )}
        </CatalogScrollArea>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">
          {selectedLabel} ({selectedItems.length})
        </p>
        {selectedItems.length === 0 ? (
          <CatalogEmptyState
            icon="check-circle"
            title={t("selectedFacilityEmpty")}
            description={t("selectedFacilityEmptyHint")}
          />
        ) : (
          <CatalogScrollArea className="max-h-96 min-w-0 max-w-full space-y-3 rounded-[1.15rem] border border-white/10 bg-surface/60 p-3">
            <div className="space-y-3">
              {selectedItems.map((item) => {
                const isNotesOpen =
                  notesOpen[item.id] ?? Boolean(item.description.trim());
                return (
                  <div
                    key={item.id}
                    className="app-surface w-full space-y-3 rounded-[1.15rem] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Label className="min-w-0 flex-1 truncate">
                        {item.name}
                      </Label>
                      <NumberField
                        aria-label={`${quantityLabel} ${item.name}`}
                        minValue={1}
                        step={1}
                        value={item.quantity}
                        onChange={(quantity) =>
                          onQuantity(
                            item.id,
                            Number.isFinite(quantity)
                              ? Math.max(1, Math.round(quantity))
                              : 1,
                          )
                        }
                        className="w-36"
                        variant="secondary"
                      >
                        <Label className="sr-only">{quantityLabel}</Label>
                        <NumberField.Group>
                          <NumberField.DecrementButton />
                          <NumberField.Input />
                          <NumberField.IncrementButton />
                        </NumberField.Group>
                      </NumberField>
                      <Switch
                        isSelected={isNotesOpen}
                        onChange={(checked) =>
                          setNotesOpen((current) => ({
                            ...current,
                            [item.id]: checked,
                          }))
                        }
                      >
                        <Switch.Content>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                          {descriptionLabel}
                        </Switch.Content>
                      </Switch>
                      <Button
                        type="button"
                        variant="ghost"
                        isIconOnly
                        size="sm"
                        aria-label={removeLabel}
                        onPress={() =>
                          onSelectionChange(
                            selectedItems
                              .filter((selected) => selected.id !== item.id)
                              .map((selected) => selected.id),
                            catalog.items,
                          )
                        }
                      >
                        <Icon name="trash-1" size={16} />
                      </Button>
                    </div>
                    <Disclosure
                      isExpanded={isNotesOpen}
                      onExpandedChange={(expanded) =>
                        setNotesOpen((current) => ({
                          ...current,
                          [item.id]: expanded,
                        }))
                      }
                    >
                      <Disclosure.Content>
                        <Disclosure.Body className="pt-1">
                          <TextArea
                            value={item.description}
                            onChange={(e) =>
                              onDescription(item.id, e.target.value)
                            }
                            fullWidth
                            variant="secondary"
                            className="min-h-20"
                            placeholder={descriptionLabel}
                            aria-label={`${descriptionLabel} ${item.name}`}
                          />
                        </Disclosure.Body>
                      </Disclosure.Content>
                    </Disclosure>
                    {renderExtra?.(item.id)}
                  </div>
                );
              })}
            </div>
          </CatalogScrollArea>
        )}
      </div>
    </div>
  );
}

function SocialPlatformIcon({ platform }: { platform: SocialPlatform }) {
  return (
    <Icon
      name={platformIcons[platform]}
      size={18}
      className="shrink-0 text-muted"
    />
  );
}

function CatalogComboBox({
  label,
  value,
  items,
  placeholder,
  isDisabled = false,
  onChange,
}: {
  label: string;
  value: string;
  items: Array<{ id: string; name: string }>;
  placeholder: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <ComboBox
      fullWidth
      variant="secondary"
      items={items}
      selectedKey={value || null}
      isDisabled={isDisabled}
      onSelectionChange={(key) => onChange(key === null ? "" : String(key))}
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} variant="secondary" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox items={items}>
          {(item) => (
            <ListBox.Item id={item.id} textValue={item.name}>
              {item.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
function updateTier(
  setter: React.Dispatch<React.SetStateAction<ClubCancellationRule[]>>,
  ruleIndex: number,
  tierIndex: number,
  key: "hoursBefore" | "refundPercent",
  value: number,
) {
  setter((current) =>
    current.map((rule, i) =>
      i === ruleIndex
        ? {
            ...rule,
            tiers: rule.tiers.map((tier, j) =>
              j === tierIndex ? { ...tier, [key]: value } : tier,
            ),
          }
        : rule,
    ),
  );
}

function normalizeTagName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLocaleLowerCase("fa");
}

function uniqueTagNames(values: string[]): string[] {
  const result = new Map<string, string>();
  for (const value of values) {
    const name = value.trim().replace(/\s+/g, " ");
    if (name) result.set(normalizeTagName(name), name);
  }
  return [...result.values()];
}

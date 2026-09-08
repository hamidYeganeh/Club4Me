"use client";
import { FormSectionNavigation, FormSectionHeading } from "@/components/form-section-navigation";

import { CroppedImageUpload } from "@/components/cropped-image-upload";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button, Card, Skeleton, toast, Typography } from "@heroui/react";
import {
  emptyCoachProfessionalProfile,
  type CoachProfessionalProfile,
  type CoachProfile,
  useMedia,
  useCoachProfile,
  useCoachSports,
  useCreateMedia,
  useCreatePrivateMedia,
  useReplaceCoachSports,
  useUpdateCoachProfile,
} from "@api";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { FormPageSkeleton } from "@/components/loading-skeletons";

import { CoachProfessionalFields } from "../../components/CoachProfessionalFields";

const input =
  "h-12 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent";

export function CoachProfileFormScreen() {
  const profile = useCoachProfile();
  const update = useUpdateCoachProfile();
  const coachSports = useCoachSports();
  const replaceSports = useReplaceCoachSports();
  const createMedia = useCreateMedia();
  const createPrivateMedia = useCreatePrivateMedia();
  const ownedMedia = useMedia(profile.data?.galleryMediaIds);
  const profileHydrated = useRef("");
  const sportsHydrated = useRef(false);
  const [profileReady, setProfileReady] = useState(false);
  const [sportsReady, setSportsReady] = useState(false);
  const [geo, setGeo] = useState<CoachProfile["geo"]>(null);
  const [geoDirty, setGeoDirty] = useState(false);
  const [travelRadiusKm, setTravelRadiusKm] = useState(0);
  const [geoSearch, setGeoSearch] = useState({
    country: "",
    province: "",
    city: "",
    district: "",
    region: "",
  });
  const countries = usePublicCatalogResource("location", "country", {
    limit: 100,
    q: geoSearch.country,
  });
  const provinces = usePublicCatalogResource(
    "location",
    "province",
    { parentId: geo?.countryId, limit: 100, q: geoSearch.province },
    Boolean(geo?.countryId),
  );
  const cities = usePublicCatalogResource(
    "location",
    "city",
    { parentId: geo?.provinceId, limit: 100, q: geoSearch.city },
    Boolean(geo?.provinceId),
  );
  const districts = usePublicCatalogResource(
    "location",
    "district",
    { parentId: geo?.cityId, limit: 100, q: geoSearch.district },
    Boolean(geo?.cityId),
  );
  const regions = usePublicCatalogResource(
    "location",
    "city-region",
    { parentId: geo?.cityId, limit: 100, q: geoSearch.region },
    Boolean(geo?.cityId),
  );
  const changeGeo = (value: CoachProfile["geo"]) => {
    setGeo(value);
    setGeoDirty(true);
  };
  const sportsCatalog = usePublicCatalogResource("sports", "sport");
  const [professionalProfile, setProfessionalProfile] =
    useState<CoachProfessionalProfile>(emptyCoachProfessionalProfile);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [languages, setLanguages] = useState("فارسی");
  const [serviceModes, setServiceModes] = useState<string[]>(["club"]);
  const [phone, setPhone] = useState("");
  const [sportIds, setSportIds] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState("");
  const [trainingStyles, setTrainingStyles] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [faqs, setFaqs] = useState("");
  const [portfolioMedia, setPortfolioMedia] = useState<
    Array<{ id: string; url: string }>
  >([]);

  useEffect(() => {
    const data = profile.data;
    if (
      !data ||
      !profile.isFetchedAfterMount ||
      profile.isFetching ||
      profile.isError ||
      profileHydrated.current === data.id
    )
      return;
    const frame = requestAnimationFrame(() => {
      profileHydrated.current = data.id;
      setProfileReady(true);
      setGeo(data.geo ?? null);
      setTravelRadiusKm(data.travelRadiusKm ?? 0);
      setPortfolioMedia(data.galleryMediaIds.map((id) => ({ id, url: "" })));
      setDisplayName(data.displayName);
      setProfessionalProfile({
        ...emptyCoachProfessionalProfile(),
        ...data.professionalProfile,
      });
      setMinAge(data.minAcceptedAge == null ? "" : String(data.minAcceptedAge));
      setMaxAge(data.maxAcceptedAge == null ? "" : String(data.maxAcceptedAge));
      setShortBio(data.shortBio);
      setBio(data.bio);
      setExperienceYears(data.experienceYears);
      setLanguages(data.languages.join("، "));
      setServiceModes(data.serviceModes);
      setSpecialties(
        data.specialties
          .map((item) => `${item.title} | ${item.description}`)
          .join("\n"),
      );
      setTrainingStyles(
        (data.trainingStyles ?? [])
          .map((item) =>
            [
              item.title,
              item.description,
              item.imageMediaId ? `media:${item.imageMediaId}` : "",
            ]
              .filter(Boolean)
              .join(" | "),
          )
          .join("\n"),
      );
      setExperienceSummary(data.experienceSummary ?? "");
      setExperience(
        data.experience
          .map((item) =>
            [
              item.title,
              item.organization ?? "",
              item.period ?? "",
              item.description ?? "",
            ].join(" | "),
          )
          .join("\n"),
      );
      setFaqs(
        data.faqs.map((item) => `${item.question} | ${item.answer}`).join("\n"),
      );
      const currentPhone = data.contact.phone;
      setPhone(typeof currentPhone === "string" ? currentPhone : "");
    });
    return () => cancelAnimationFrame(frame);
  }, [
    profile.data,
    profile.isFetchedAfterMount,
    profile.isFetching,
    profile.isError,
  ]);

  useEffect(() => {
    const data = coachSports.data;
    if (
      !data ||
      !coachSports.isFetchedAfterMount ||
      coachSports.isFetching ||
      coachSports.isError ||
      sportsHydrated.current
    )
      return;
    const frame = requestAnimationFrame(() => {
      sportsHydrated.current = true;
      setSportsReady(true);
      setSportIds(data.items.map((item) => item.sportId));
    });
    return () => cancelAnimationFrame(frame);
  }, [
    coachSports.data,
    coachSports.isFetchedAfterMount,
    coachSports.isFetching,
    coachSports.isError,
  ]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile.data || !coachSports.data || saving || createMedia.isPending)
      return;
    if (minAge !== "" && maxAge !== "" && Number(minAge) > Number(maxAge)) {
      toast.danger("حداکثر سن باید برابر یا بیشتر از حداقل سن باشد");
      return;
    }
    const goals = [
      ...new Set(
        professionalProfile.goals.map((item) => item.trim()).filter(Boolean),
      ),
    ];
    if (
      goals.length > 12 ||
      goals.some((goal) => goal.length < 2 || goal.length > 100)
    ) {
      toast.danger("حداکثر ۱۲ هدف با طول ۲ تا ۱۰۰ نویسه وارد کنید");
      return;
    }
    const videoUrl = professionalProfile.introductionVideoUrl.trim();
    if (videoUrl) {
      try {
        const url = new URL(videoUrl);
        if (url.protocol !== "https:" || url.username || url.password)
          throw new Error();
      } catch {
        toast.danger("لینک ویدئو باید یک نشانی معتبر با https باشد");
        return;
      }
    }
    setSaving(true);
    try {
      const sportsChanged =
        sportIds.length !== coachSports.data.items.length ||
        sportIds.some(
          (id) => !coachSports.data.items.some((item) => item.sportId === id),
        );
      await update.mutateAsync({
        ...(geoDirty ? { geo: geo ?? null } : {}),
        travelRadiusKm,
        displayName,
        shortBio,
        bio,
        experienceYears,
        professionalProfile: {
          ...professionalProfile,
          goals,
          introductionVideoUrl: videoUrl,
        },
        minAcceptedAge: minAge === "" ? null : Number(minAge),
        maxAcceptedAge: maxAge === "" ? null : Number(maxAge),
        languages: languages
          .split(/[،,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        serviceModes,
        contact: { ...profile.data.contact, phone: phone.trim() },
        specialties: parseRows(specialties, 2).map(([title, description]) => ({
          title,
          description,
        })),
        trainingStyles: parseRows(trainingStyles, 2).map(
          ([title, description, image]) => ({
            title,
            description,
            ...(image?.startsWith("media:")
              ? { imageMediaId: image.slice(6) }
              : {}),
          }),
        ),
        experienceSummary,
        experience: parseRows(experience, 1).map(
          ([title, organization, period, description]) => ({
            title,
            organization,
            period,
            description,
          }),
        ),
        faqs: parseRows(faqs, 2).map(([question, answer]) => ({
          question,
          answer,
        })),
        galleryMediaIds: portfolioMedia.map((item) => item.id),
      });
      setGeoDirty(false);
      if (sportsChanged) {
        try {
          await replaceSports.mutateAsync(
            sportIds.map((sportId) => {
              const existing = coachSports.data.items.find(
                (item) => item.sportId === sportId,
              );
              return {
                sportId,
                specialtyIds: existing?.specialtyIds ?? [],
                skillLevelId: existing?.skillLevelId,
                experienceYears: existing?.experienceYears ?? 0,
                certificateMediaIds: existing?.certificateMediaIds ?? [],
                achievements: existing?.achievements ?? [],
                customAttributes: existing?.customAttributes ?? {},
              };
            }),
          );
        } catch {
          toast.danger(
            "پروفایل ذخیره شد، اما تغییر رشته‌ها ذخیره نشد. دوباره تلاش کنید.",
          );
          return;
        }
      }
      toast.success("پروفایل حرفه‌ای ذخیره شد");
    } catch {
      toast.danger("ذخیره پروفایل ناموفق بود؛ اطلاعات واردشده را بررسی کنید");
    } finally {
      setSaving(false);
    }
  };

  if (
    (!profileReady && !profile.isError) ||
    (!sportsReady && !coachSports.isError)
  )
    return <FormPageSkeleton fields={7} />;
  if (
    (profile.isError && !profileReady) ||
    (coachSports.isError && !sportsReady) ||
    !profile.data
  )
    return (
      <main className="space-y-4 p-5">
        <p role="alert">دریافت اطلاعات پروفایل ناموفق بود.</p>
        <Button
          onPress={() => {
            void profile.refetch();
            void coachSports.refetch();
          }}
        >
          تلاش دوباره
        </Button>
      </main>
    );
  return (
    <main className="app-page gap-5">
      <DiscoveryPageHeader
        title="پروفایل حرفه‌ای"
        description="اطلاعاتی که ورزشکاران در صفحه مربی می‌بینند."
      />
      <FormSectionNavigation sections={[{"id": "profile-basics", "title": "اطلاعات پایه"}, {"id": "profile-about", "title": "معرفی مربی"}, {"id": "profile-expertise", "title": "تخصص و مدارک"}]} />
      <Card className="app-card coach-editor p-5 shadow-none">
        <form onSubmit={submit}>
          <fieldset
            className="min-w-0 space-y-4"
            disabled={
              saving ||
              createMedia.isPending ||
              profile.data.reviewStatus === "pending_review"
            }
          >
            {profile.data.reviewStatus === "pending_review" ? (
              <p role="status" className="text-sm text-muted">
                پروفایل در حال بررسی است؛ پس از پایان بررسی می‌توانید آن را
                ویرایش کنید.
              </p>
            ) : null}
            <FormSectionHeading id="profile-basics" title="اطلاعات پایه" description="نام و محدوده‌ای که در آن خدمت ارائه می‌کنید." />
          <Field label="نام نمایشی">
              <input
                required
                minLength={2}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={input}
              />
            </Field>
            <fieldset className="space-y-4 rounded-2xl border border-border p-4">
              <legend className="px-2 text-sm font-bold">
                محدوده ارائه خدمت
              </legend>
              <GeoSelect
                search={geoSearch.country}
                onSearch={(value) =>
                  setGeoSearch((current) => ({ ...current, country: value }))
                }
                label="کشور"
                value={geo?.countryId}
                items={countries.data?.items}
                onChange={(id) =>
                  changeGeo(id ? { countryId: id, cityRegionIds: [] } : null)
                }
              />
              {geo?.countryId ? (
                <GeoSelect
                  search={geoSearch.province}
                  onSearch={(value) =>
                    setGeoSearch((current) => ({ ...current, province: value }))
                  }
                  label="استان"
                  value={geo.provinceId}
                  items={provinces.data?.items}
                  onChange={(id) =>
                    changeGeo({
                      countryId: geo.countryId,
                      provinceId: id || undefined,
                      cityRegionIds: [],
                    })
                  }
                />
              ) : null}
              {geo?.provinceId ? (
                <GeoSelect
                  search={geoSearch.city}
                  onSearch={(value) =>
                    setGeoSearch((current) => ({ ...current, city: value }))
                  }
                  label="شهر"
                  value={geo.cityId}
                  items={cities.data?.items}
                  onChange={(id) =>
                    changeGeo({
                      countryId: geo.countryId,
                      provinceId: geo.provinceId,
                      cityId: id || undefined,
                      cityRegionIds: [],
                    })
                  }
                />
              ) : null}
              {geo?.cityId ? (
                <>
                  <GeoSelect
                    search={geoSearch.district}
                    onSearch={(value) =>
                      setGeoSearch((current) => ({
                        ...current,
                        district: value,
                      }))
                    }
                    label="منطقه شهری"
                    value={geo.districtId}
                    items={districts.data?.items}
                    onChange={(id) =>
                      changeGeo({ ...geo, districtId: id || undefined })
                    }
                  />
                  <fieldset>
                    <legend className="mb-2 text-sm">محله‌های تحت پوشش</legend>
                    <input
                      className={input}
                      aria-label="جستجوی محله"
                      placeholder="جستجوی محله"
                      value={geoSearch.region}
                      onChange={(event) =>
                        setGeoSearch((current) => ({
                          ...current,
                          region: event.target.value,
                        }))
                      }
                    />
                    <div className="grid max-h-64 gap-2 overflow-y-auto">
                      {[
                        ...new Set([
                          ...(geo.cityRegionIds ?? []),
                          ...(regions.data?.items.map((item) => item.id) ?? []),
                        ]),
                      ].map((id) => (
                        <label
                          key={id}
                          className="flex min-h-11 items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={geo.cityRegionIds.includes(id)}
                            onChange={(event) =>
                              changeGeo({
                                ...geo,
                                cityRegionIds: event.target.checked
                                  ? [...geo.cityRegionIds, id]
                                  : geo.cityRegionIds.filter(
                                      (value) => value !== id,
                                    ),
                              })
                            }
                          />
                          {regions.data?.items.find((item) => item.id === id)
                            ?.name ?? "محله ثبت‌شده"}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : null}
              {[countries, provinces, cities, districts, regions].some(
                (query) => query.isError,
              ) ? (
                <Button
                  size="sm"
                  onPress={() => {
                    for (const query of [
                      countries,
                      provinces,
                      cities,
                      districts,
                      regions,
                    ])
                      if (query.isError) void query.refetch();
                  }}
                >
                  دریافت دوباره محدوده‌ها
                </Button>
              ) : null}
              <Field label="شعاع رفت‌وآمد (کیلومتر)">
                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={1}
                  required
                  className={input}
                  value={travelRadiusKm}
                  onChange={(event) =>
                    setTravelRadiusKm(Number(event.target.value))
                  }
                />
              </Field>
            </fieldset>
            <FormSectionHeading id="profile-about" title="آشنایی با شما" description="تجربه و روش کارتان را برای ورزشکار توضیح دهید." />
          <Field label="معرفی کوتاه">
              <input
                required
                value={shortBio}
                onChange={(event) => setShortBio(event.target.value)}
                className={input}
              />
            </Field>
            <Field label="درباره من">
              <textarea
                required
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className={`${input} min-h-36 py-3`}
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="سال تجربه">
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={experienceYears}
                  onChange={(event) =>
                    setExperienceYears(Number(event.target.value))
                  }
                  className={input}
                />
              </Field>
              <Field label="تلفن عمومی">
                <input
                  dir="ltr"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={input}
                />
              </Field>
            </div>
            <Field label="زبان‌ها">
              <input
                value={languages}
                onChange={(event) => setLanguages(event.target.value)}
                className={input}
                placeholder="فارسی، انگلیسی"
              />
            </Field>
            <FormSectionHeading id="profile-expertise" title="تخصص و مدارک" description="رشته‌ها و مستندات حرفه‌ای خود را تکمیل کنید." />
          <Field label="رشته‌های ورزشی">
              <div className="flex flex-wrap gap-2">
                {sportsCatalog.isPending || coachSports.isPending
                  ? Array.from({ length: 5 }, (_, index) => (
                      <Skeleton key={index} className="h-8 w-20 rounded-full" />
                    ))
                  : null}
                {(sportsCatalog.data?.items ?? []).map((sport) => (
                  <Button
                    key={sport.id}
                    type="button"
                    size="sm"
                    variant={
                      sportIds.includes(sport.id) ? "primary" : "secondary"
                    }
                    onPress={() =>
                      setSportIds((items) =>
                        items.includes(sport.id)
                          ? items.filter((item) => item !== sport.id)
                          : [...items, sport.id],
                      )
                    }
                  >
                    {sport.name}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="شیوه ارائه">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "club", label: "باشگاه" },
                  { value: "online", label: "آنلاین" },
                  { value: "home", label: "منزل" },
                  { value: "outdoor", label: "فضای باز" },
                ].map((mode) => (
                  <Button
                    key={mode.value}
                    type="button"
                    size="sm"
                    variant={
                      serviceModes.includes(mode.value)
                        ? "primary"
                        : "secondary"
                    }
                    onPress={() =>
                      setServiceModes((items) =>
                        items.includes(mode.value)
                          ? items.filter((item) => item !== mode.value)
                          : [...items, mode.value],
                      )
                    }
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="تخصص‌ها و توضیح">
              <textarea
                value={specialties}
                onChange={(event) => setSpecialties(event.target.value)}
                className={`${input} min-h-28 py-3`}
                placeholder="کاهش وزن | برنامه شخصی‌سازی‌شده بر اساس شرایط بدنی"
              />
            </Field>
            <Field label="سبک‌های تمرینی">
              <textarea
                value={trainingStyles}
                onChange={(event) => setTrainingStyles(event.target.value)}
                className={`${input} min-h-32 py-3`}
                placeholder="تمرین قدرتی دقیق | تمرکز بر فرم و پیشرفت تدریجی"
              />
              <p className="mt-1 text-xs leading-6 text-muted">
                هر خط: عنوان | توضیح. تصویر هر سبک را با دکمه زیر انتخاب کنید.
              </p>
            </Field>
            {trainingStyles.split("\n").map((row, index) => {
              const [title, description] = row
                .split("|")
                .map((part) => part.trim());
              if (!title || !description) return null;
              return (
                <CroppedImageUpload
                  key={index}
                  label={`تصویر ${title}`}
                  disabled={createMedia.isPending}
                  onFile={async (file) => {
                    const media = await createMedia.mutateAsync(file);
                    setTrainingStyles((value) =>
                      value
                        .split("\n")
                        .map((line, lineIndex) =>
                          lineIndex === index
                            ? `${line.split("|").slice(0, 2).join(" | ")} | media:${media.id}`
                            : line,
                        )
                        .join("\n"),
                    );
                  }}
                />
              );
            })}
            <div className="space-y-3">
              <p className="text-sm font-bold">افزودن تصاویر نمونه‌کار</p>
              <CroppedImageUpload
                disabled={createMedia.isPending || portfolioMedia.length >= 30}
                onFile={async (file) => {
                  const media = await createMedia.mutateAsync(file);
                  setPortfolioMedia((items) =>
                    items.some((item) => item.id === media.id)
                      ? items
                      : [...items, { id: media.id, url: media.url }],
                  );
                }}
              />
              <div className="flex flex-wrap gap-2">
                {portfolioMedia.map((media, index) => (
                  <div key={media.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        media.url ||
                        ownedMedia.data?.items.find(
                          (item) => item.id === media.id,
                        )?.url
                      }
                      alt={`تصویر نمونه‌کار ${index + 1}`}
                      className="size-24 rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded bg-background px-2"
                      aria-label={`حذف تصویر ${index + 1}`}
                      onClick={() =>
                        setPortfolioMedia((items) =>
                          items.filter((item) => item.id !== media.id),
                        )
                      }
                    >
                      ×
                    </button>
                    <div className="mt-1 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`جلو بردن تصویر ${index + 1}`}
                        isDisabled={index === 0}
                        onPress={() =>
                          setPortfolioMedia((items) => {
                            const next = [...items];
                            [next[index - 1], next[index]] = [
                              next[index]!,
                              next[index - 1]!,
                            ];
                            return next;
                          })
                        }
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`عقب بردن تصویر ${index + 1}`}
                        isDisabled={index === portfolioMedia.length - 1}
                        onPress={() =>
                          setPortfolioMedia((items) => {
                            const next = [...items];
                            [next[index], next[index + 1]] = [
                              next[index + 1]!,
                              next[index]!,
                            ];
                            return next;
                          })
                        }
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Field label="سوابق حرفه‌ای">
              <textarea
                value={experienceSummary}
                onChange={(event) => setExperienceSummary(event.target.value)}
                className={`${input} mb-3 min-h-24 py-3`}
                placeholder="خلاصه‌ای از سال‌ها و زمینه تجربه حرفه‌ای شما"
              />
              <textarea
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                className={`${input} min-h-28 py-3`}
                placeholder="مربی ارشد | باشگاه نمونه | ۱۴۰۰ تا امروز | شرح کوتاه"
              />
            </Field>
            <CoachProfessionalFields
              value={professionalProfile}
              onChange={setProfessionalProfile}
              minAge={minAge}
              maxAge={maxAge}
              onMinAge={setMinAge}
              onMaxAge={setMaxAge}
              uploading={createPrivateMedia.isPending}
              upload={async (file) => (await createPrivateMedia.mutateAsync(file)).id}
            />
            <Field label="سوالات متداول">
              <textarea
                value={faqs}
                onChange={(event) => setFaqs(event.target.value)}
                className={`${input} min-h-28 py-3`}
                placeholder="آیا جلسه آنلاین دارید؟ | بله، با هماهنگی قبلی."
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isDisabled={
                saving ||
                createMedia.isPending ||
                profile.data.reviewStatus === "pending_review"
              }
              isPending={
                saving ||
                update.isPending ||
                replaceSports.isPending ||
                createMedia.isPending
              }
            >
              ذخیره پروفایل
            </Button>
          </fieldset>
        </form>
      </Card>
    </main>
  );
}

function parseRows(value: string, minimumParts: number) {
  return value
    .split("\n")
    .map((row) => row.split("|").map((part) => part.trim()))
    .filter(
      (parts) =>
        parts.length >= minimumParts &&
        parts.slice(0, minimumParts).every(Boolean),
    );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <Typography type="body-sm" weight="bold">
        {label}
      </Typography>
      {children}
    </label>
  );
}

function GeoSelect({
  label,
  value,
  items,
  onChange,
  search,
  onSearch,
}: {
  search: string;
  onSearch: (value: string) => void;
  label: string;
  value?: string;
  items?: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        className={input}
        aria-label={`جستجوی ${label}`}
        placeholder={`جستجوی ${label}`}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <Field label={label}>
        <select
          value={value ?? ""}
          className={input}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">انتخاب {label}</option>
          {value && !items?.some((item) => item.id === value) ? (
            <option value={value}>{label} ثبت‌شده</option>
          ) : null}
          {items?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

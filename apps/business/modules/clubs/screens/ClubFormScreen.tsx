"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  useBusinessCatalog,
  useBusinessClub,
  useBusinessMedia,
  useCreateBusinessClub,
  useCreateBusinessMedia,
  useSubmitBusinessClub,
  useUpdateBusinessClub,
  type ClubCancellationRule,
  type SocialPlatform,
} from "@api/business";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none transition focus:border-accent";
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
];

type CountMap = Record<string, number>;
type GalleryDraft = { mediaId?: string; url: string; title: string };
type SocialDraft = { platform: SocialPlatform; link: string };

export function ClubFormScreen({ clubId }: { clubId?: string }) {
  const t = useTranslations("businessClubs");
  const router = useRouter();
  const club = useBusinessClub(clubId ?? "", Boolean(clubId));
  const media = useBusinessMedia();
  const create = useCreateBusinessClub();
  const update = useUpdateBusinessClub(clubId ?? "");
  const createMedia = useCreateBusinessMedia();
  const submitClub = useSubmitBusinessClub(clubId ?? "");
  const clubTypes = useBusinessCatalog("sports", "club-type");
  const equipmentCatalog = useBusinessCatalog("facilities", "equipment");
  const amenityCatalog = useBusinessCatalog("facilities", "amenity");
  const countries = useBusinessCatalog("location", "country");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClubTypes, setSelectedClubTypes] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<CountMap>({});
  const [amenities, setAmenities] = useState<CountMap>({});
  const [rules, setRules] = useState("");
  const [tags, setTags] = useState("");
  const [gallery, setGallery] = useState<GalleryDraft[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialDraft[]>([]);
  const [countryId, setCountryId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [cancellationRules, setCancellationRules] = useState<
    ClubCancellationRule[]
  >([
    {
      title: "روزهای عادی",
      tiers: [
        { hoursBefore: 72, refundPercent: 40 },
        { hoursBefore: 24, refundPercent: 20 },
        { hoursBefore: 0, refundPercent: 0 },
      ],
    },
  ]);

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

  const mediaById = useMemo(
    () => new Map((media.data?.items ?? []).map((item) => [item.id, item])),
    [media.data?.items],
  );

  useEffect(() => {
    const value = club.data;
    if (!value) return;
    setName(value.name);
    setDescription(value.description);
    setSelectedClubTypes(value.clubTypeIds);
    setEquipment(
      Object.fromEntries(
        value.equipment.map((item) => [item.equipmentId, item.quantity]),
      ),
    );
    setAmenities(
      Object.fromEntries(
        value.amenities.map((item) => [item.amenityId, item.quantity]),
      ),
    );
    setRules(value.rules.join("\n"));
    setTags(value.tags.join("، "));
    setGallery(
      value.gallery.map((item) => ({
        mediaId: item.mediaId,
        url: mediaById.get(item.mediaId)?.url ?? "",
        title: item.title ?? "",
      })),
    );
    setSocialMedia(value.socialMedia);
    setCancellationRules(
      value.cancellationRules.length
        ? value.cancellationRules
        : cancellationRules,
    );
    if (value.location) {
      setCountryId(value.location.countryId);
      setProvinceId(value.location.provinceId);
      setCityId(value.location.cityId);
      setDistrictId(value.location.districtId ?? "");
      setAddress(value.location.address);
      setLatitude(String(value.location.latitude));
      setLongitude(String(value.location.longitude));
    }
  }, [club.data, mediaById]);

  const busy = create.isPending || update.isPending || createMedia.isPending;
  const toggleCounted = (
    setter: React.Dispatch<React.SetStateAction<CountMap>>,
    id: string,
    checked: boolean,
  ) =>
    setter((current) =>
      checked
        ? { ...current, [id]: 1 }
        : Object.fromEntries(
            Object.entries(current).filter(([key]) => key !== id),
          ),
    );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const galleryPayload = await Promise.all(
        gallery
          .filter((item) => item.mediaId || item.url.trim())
          .map(async (item) => {
            if (item.mediaId)
              return {
                mediaId: item.mediaId,
                ...(item.title.trim() ? { title: item.title.trim() } : {}),
              };
            const created = await createMedia.mutateAsync({
              url: item.url.trim(),
              mimeType: "image/external",
            });
            return {
              mediaId: created.id,
              ...(item.title.trim() ? { title: item.title.trim() } : {}),
            };
          }),
      );
      const payload = {
        name: name.trim(),
        description: description.trim(),
        gallery: galleryPayload,
        clubTypeIds: selectedClubTypes,
        equipment: Object.entries(equipment).map(([resourceId, quantity]) => ({
          resourceId,
          quantity,
        })),
        amenities: Object.entries(amenities).map(([resourceId, quantity]) => ({
          resourceId,
          quantity,
        })),
        rules: rules
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        tags: tags
          .split(/[،,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        socialMedia: socialMedia.filter((item) => item.link.trim()),
        cancellationRules,
        ...(countryId &&
        provinceId &&
        cityId &&
        address &&
        latitude &&
        longitude
          ? {
              location: {
                countryId,
                provinceId,
                cityId,
                districtId: districtId || null,
                address: address.trim(),
                latitude: Number(latitude),
                longitude: Number(longitude),
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
  };

  const submitForReview = async () => {
    if (!clubId || !window.confirm(t("submitConfirm"))) return;
    try {
      await submitClub.mutateAsync();
      toast.success(t("submitSuccess"));
    } catch {
      toast.danger(t("submitError"));
    }
  };

  if (clubId && club.isPending)
    return (
      <div className="flex flex-1 justify-center py-20">
        <Spinner />
      </div>
    );

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
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
        <form onSubmit={save} className="mt-6 space-y-5">
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
            <Field label={t("clubTypes")} wide>
              <CheckboxGrid
                items={clubTypes.data?.items ?? []}
                selected={selectedClubTypes}
                onToggle={(id, checked) =>
                  setSelectedClubTypes((current) =>
                    checked
                      ? [...current, id]
                      : current.filter((value) => value !== id),
                  )
                }
              />
            </Field>
            <Field label={t("tags")} wide>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={inputClass}
                placeholder={t("tagsHint")}
              />
            </Field>
          </Section>

          <Section title={t("gallery")}>
            {gallery.map((item, index) => (
              <div
                key={`${item.mediaId ?? "new"}-${index}`}
                className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  dir="ltr"
                  value={item.url}
                  disabled={Boolean(item.mediaId)}
                  onChange={(e) =>
                    setGallery((current) =>
                      current.map((value, i) =>
                        i === index ? { ...value, url: e.target.value } : value,
                      ),
                    )
                  }
                  className={inputClass}
                  placeholder={t("mediaUrl")}
                />
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
                <Button
                  type="button"
                  variant="ghost"
                  onPress={() =>
                    setGallery((current) =>
                      current.filter((_, i) => i !== index),
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
                setGallery((current) => [...current, { url: "", title: "" }])
              }
            >
              {t("addMedia")}
            </Button>
          </Section>

          <Section title={t("facilities")}>
            <Field label={t("equipment")}>
              <CountedGrid
                items={equipmentCatalog.data?.items ?? []}
                values={equipment}
                onToggle={(id, checked) =>
                  toggleCounted(setEquipment, id, checked)
                }
                onQuantity={(id, quantity) =>
                  setEquipment((current) => ({ ...current, [id]: quantity }))
                }
              />
            </Field>
            <Field label={t("amenities")}>
              <CountedGrid
                items={amenityCatalog.data?.items ?? []}
                values={amenities}
                onToggle={(id, checked) =>
                  toggleCounted(setAmenities, id, checked)
                }
                onQuantity={(id, quantity) =>
                  setAmenities((current) => ({ ...current, [id]: quantity }))
                }
              />
            </Field>
            <Field label={t("rules")} wide>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className={textareaClass}
                placeholder={t("rulesHint")}
              />
            </Field>
          </Section>

          <Section title={t("location")}>
            <CatalogSelect
              label={t("country")}
              value={countryId}
              items={countries.data?.items ?? []}
              onChange={(value) => {
                setCountryId(value);
                setProvinceId("");
                setCityId("");
                setDistrictId("");
              }}
            />
            <CatalogSelect
              label={t("province")}
              value={provinceId}
              items={provinces.data?.items ?? []}
              onChange={(value) => {
                setProvinceId(value);
                setCityId("");
                setDistrictId("");
              }}
            />
            <CatalogSelect
              label={t("city")}
              value={cityId}
              items={cities.data?.items ?? []}
              onChange={(value) => {
                setCityId(value);
                setDistrictId("");
              }}
            />
            <CatalogSelect
              label={t("district")}
              value={districtId}
              items={districts.data?.items ?? []}
              onChange={setDistrictId}
            />
            <Field label={t("address")} wide>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field label={t("latitude")}>
              <input
                dir="ltr"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("longitude")}>
              <input
                dir="ltr"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title={t("socialMedia")}>
            {socialMedia.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[180px_1fr_auto]"
              >
                <select
                  value={item.platform}
                  onChange={(e) =>
                    setSocialMedia((current) =>
                      current.map((value, i) =>
                        i === index
                          ? {
                              ...value,
                              platform: e.target.value as SocialPlatform,
                            }
                          : value,
                      ),
                    )
                  }
                  className={inputClass}
                >
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {t(`platforms.${platform}`)}
                    </option>
                  ))}
                </select>
                <input
                  dir="ltr"
                  type="url"
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
                <Button
                  type="button"
                  variant="ghost"
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
                    className="grid grid-cols-[1fr_1fr_auto] gap-2"
                  >
                    <input
                      type="number"
                      min={0}
                      value={tier.hoursBefore}
                      onChange={(e) =>
                        updateTier(
                          setCancellationRules,
                          ruleIndex,
                          tierIndex,
                          "hoursBefore",
                          Number(e.target.value),
                        )
                      }
                      className={inputClass}
                      aria-label={t("hoursBefore")}
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={tier.refundPercent}
                      onChange={(e) =>
                        updateTier(
                          setCancellationRules,
                          ruleIndex,
                          tierIndex,
                          "refundPercent",
                          Number(e.target.value),
                        )
                      }
                      className={inputClass}
                      aria-label={t("refundPercent")}
                    />
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
                  { title: "", tiers: [{ hoursBefore: 0, refundPercent: 0 }] },
                ])
              }
            >
              {t("addPolicy")}
            </Button>
          </Section>

          <div className="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
            {clubId &&
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
            <Button type="submit" variant="primary" isPending={busy}>
              {t("save")}
            </Button>
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
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}
function Field({
  label,
  children,
  wide,
  required,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  required?: boolean;
}) {
  return (
    <label className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}>
      <span className="block text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
function CheckboxGrid({
  items,
  selected,
  onToggle,
}: {
  items: Array<{ id: string; name: string }>;
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm"
        >
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={(e) => onToggle(item.id, e.target.checked)}
          />
          {item.name}
        </label>
      ))}
    </div>
  );
}
function CountedGrid({
  items,
  values,
  onToggle,
  onQuantity,
}: {
  items: Array<{ id: string; name: string }>;
  values: CountMap;
  onToggle: (id: string, checked: boolean) => void;
  onQuantity: (id: string, quantity: number) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 rounded-xl border border-border p-3"
        >
          <input
            type="checkbox"
            checked={item.id in values}
            onChange={(e) => onToggle(item.id, e.target.checked)}
          />
          <span className="min-w-0 flex-1 text-sm">{item.name}</span>
          {item.id in values && (
            <input
              type="number"
              min={1}
              value={values[item.id]}
              onChange={(e) =>
                onQuantity(item.id, Math.max(1, Number(e.target.value)))
              }
              className="h-9 w-20 rounded-lg border border-border bg-surface-secondary px-2"
            />
          )}
        </div>
      ))}
    </div>
  );
}
function CatalogSelect({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">—</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </Field>
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

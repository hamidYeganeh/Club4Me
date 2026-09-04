"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button, Card, Spinner, toast, Typography } from "@heroui/react";
import {
  useCoachProfile,
  useCoachSports,
  useReplaceCoachSports,
  useUpdateCoachProfile,
} from "@api";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";

const input =
  "h-12 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent";

export function CoachProfileFormScreen() {
  const profile = useCoachProfile();
  const update = useUpdateCoachProfile();
  const coachSports = useCoachSports();
  const replaceSports = useReplaceCoachSports();
  const sportsCatalog = usePublicCatalogResource("sports", "sport");
  const [displayName, setDisplayName] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [languages, setLanguages] = useState("فارسی");
  const [serviceModes, setServiceModes] = useState<string[]>(["club"]);
  const [phone, setPhone] = useState("");
  const [sportIds, setSportIds] = useState<string[]>([]);

  useEffect(() => {
    if (!profile.data) return;
    // The server profile provides the initial values of this edit form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(profile.data.displayName);
    setShortBio(profile.data.shortBio);
    setBio(profile.data.bio);
    setExperienceYears(profile.data.experienceYears);
    setLanguages(profile.data.languages.join("، "));
    setServiceModes(profile.data.serviceModes);
    const currentPhone = profile.data.contact.phone;
    setPhone(typeof currentPhone === "string" ? currentPhone : "");
  }, [profile.data]);

  useEffect(() => {
    if (coachSports.data) {
      // The saved sports provide the initial selection of this edit form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSportIds(coachSports.data.items.map((item) => item.sportId));
    }
  }, [coachSports.data]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await Promise.all([
        update.mutateAsync({
          displayName,
          shortBio,
          bio,
          experienceYears,
          languages: languages
            .split(/[،,]/)
            .map((item) => item.trim())
            .filter(Boolean),
          serviceModes,
          contact: phone ? { phone } : {},
        }),
        replaceSports.mutateAsync(sportIds),
      ]);
      toast.success("پروفایل حرفه‌ای ذخیره شد");
    } catch {
      toast.danger("ذخیره پروفایل ناموفق بود");
    }
  };

  if (profile.isLoading)
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </main>
    );
  return (
    <main className="min-h-dvh px-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader
        title="پروفایل حرفه‌ای"
        description="اطلاعاتی که ورزشکاران در صفحه مربی می‌بینند."
      />
      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="نام نمایشی">
            <input
              required
              minLength={2}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={input}
            />
          </Field>
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
          <div className="grid grid-cols-2 gap-3">
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
          <Field label="رشته‌های ورزشی">
            <div className="flex flex-wrap gap-2">
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
                    serviceModes.includes(mode.value) ? "primary" : "secondary"
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isPending={update.isPending || replaceSports.isPending}
          >
            ذخیره پروفایل
          </Button>
        </form>
      </Card>
    </main>
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

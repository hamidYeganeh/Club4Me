"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { usePublicCatalogResource, type PublicResourceItem } from "@api/discovery";
import { useCreateUserLocation, useUpdateUserLocation, useUserLocations } from "@api/locations";
import { Button, Checkbox, Form, InputGroup, Label, ListBox, Spinner, TextField, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

import { NeshanMap, type GeoPoint } from "@/components/maps/neshan-map";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import {
  FormPageSkeleton,
  PickerRowsSkeleton,
} from "@/components/loading-skeletons";

const TEHRAN = { latitude: 35.6892, longitude: 51.389 };
const LIMIT = 100;
type Props = { role: "athlete" | "coach"; locationId?: string };
type Level = "countryId" | "provinceId" | "cityId" | "districtId" | "cityRegionId";
type Selection = Record<Level, string>;
const EMPTY: Selection = { countryId: "", provinceId: "", cityId: "", districtId: "", cityRegionId: "" };

export function LocationFormScreen({ role, locationId }: Props) {
  const router = useRouter();
  const locations = useUserLocations(Boolean(locationId));
  const existing = useMemo(() => locations.data?.items.find((item) => item.id === locationId), [locationId, locations.data?.items]);
  const create = useCreateUserLocation();
  const update = useUpdateUserLocation();
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [error, setError] = useState("");
  const [selectionOverride, setSelectionOverride] = useState<Selection | null>(null);
  const [openLevel, setOpenLevel] = useState<Level | null>(null);

  const selection: Selection = selectionOverride ?? (existing
    ? {
      countryId: existing.countryId,
      provinceId: existing.provinceId,
      cityId: existing.cityId,
      districtId: existing.districtId ?? "",
      cityRegionId: existing.cityRegionId ?? "",
    }
    : EMPTY);

  const countries = usePublicCatalogResource("location", "country", { limit: LIMIT });
  const provinces = usePublicCatalogResource("location", "province", { parentId: selection.countryId, limit: LIMIT }, Boolean(selection.countryId));
  const cities = usePublicCatalogResource("location", "city", { parentId: selection.provinceId, limit: LIMIT }, Boolean(selection.provinceId));
  const districts = usePublicCatalogResource("location", "district", { parentId: selection.cityId, limit: LIMIT }, Boolean(selection.cityId));
  const cityRegions = usePublicCatalogResource("location", "city-region", { parentId: selection.cityId, limit: LIMIT }, Boolean(selection.cityId));

  const selectors: Record<Level, PickerData> = {
    countryId: picker("کشور", "انتخاب کشور", countries),
    provinceId: picker("استان", "ابتدا کشور را انتخاب کنید", provinces, !selection.countryId),
    cityId: picker("شهر", "ابتدا استان را انتخاب کنید", cities, !selection.provinceId),
    districtId: picker("منطقه", "انتخاب منطقه (اختیاری)", districts, !selection.cityId),
    cityRegionId: picker("ناحیه شهری", "انتخاب ناحیه شهری (اختیاری)", cityRegions, !selection.cityId),
  };

  const initialPoint = existing ? { latitude: existing.latitude, longitude: existing.longitude } : TEHRAN;
  const selectedPoint = point ?? initialPoint;
  const pending = create.isPending || update.isPending;
  const itemName = (level: Level) => selectors[level].items.find((item) => item.id === selection[level])?.name;

  function selectLocation(level: Level, id: string) {
    setSelectionOverride((override) => {
      const current = override ?? selection;
      if (level === "countryId") return { ...EMPTY, countryId: id };
      if (level === "provinceId") return { ...EMPTY, countryId: current.countryId, provinceId: id };
      if (level === "cityId") return { ...current, cityId: id, districtId: "", cityRegionId: "" };
      return { ...current, [level]: id };
    });
    setOpenLevel(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? "").trim(),
      address: String(data.get("address") ?? "").trim(),
      countryId: selection.countryId,
      provinceId: selection.provinceId,
      cityId: selection.cityId,
      districtId: selection.districtId || null,
      cityRegionId: selection.cityRegionId || null,
      latitude: selectedPoint.latitude,
      longitude: selectedPoint.longitude,
      isDefault: data.get("isDefault") === "on",
    };
    try {
      if (locationId) await update.mutateAsync({ id: locationId, ...payload });
      else await create.mutateAsync(payload);
      router.push(`/${role}/profile/locations`);
    } catch {
      setError("ذخیره لوکیشن ناموفق بود. اطلاعات را بررسی و دوباره تلاش کنید.");
    }
  }

  if (locationId && locations.isLoading) return <FormPageSkeleton fields={7} />;
  if (locationId && !existing) return (
    <main className="p-8 text-center">
      <Typography type="body" className="mb-4 text-danger">لوکیشن پیدا نشد.</Typography>
      <Button variant="secondary" onPress={() => void locations.refetch()}>تلاش دوباره</Button>
    </main>
  );

  return (
    <main className="app-page">
      <SecondaryHeader
        title={existing ? "ویرایش لوکیشن" : "افزودن لوکیشن"}
        showFilter={false}
      />

      <Form key={existing?.id ?? "new"} onSubmit={(event) => void submit(event)} className="app-reveal flex flex-col gap-4">
        <FormField label="عنوان" name="title" defaultValue={existing?.title} minLength={2} maxLength={30} isRequired />
        <FormField label="آدرس (اختیاری)" name="address" defaultValue={existing?.address} maxLength={300} multiline />
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="sr-only">محدوده جغرافیایی</legend>
          {(Object.keys(selectors) as Level[]).map((level) => {
            const selector = selectors[level];
            return (
              <TextField key={level} isRequired={level === "countryId" || level === "provinceId" || level === "cityId"} isDisabled={selector.disabled}>
                <Label>{selector.label}</Label>
                <InputGroup variant="secondary" onClick={() => !selector.disabled && setOpenLevel(level)}>
                  <InputGroup.Input readOnly value={itemName(level) ?? ""} placeholder={selector.placeholder} aria-haspopup="dialog" aria-expanded={openLevel === level} className="cursor-pointer" />
                  <InputGroup.Suffix><Icon name="chevron-down" size={18} /></InputGroup.Suffix>
                </InputGroup>
              </TextField>
            );
          })}
        </fieldset>

        <div>
          <Typography type="body-sm" weight="bold" className="mb-2">انتخاب نقطه روی نقشه</Typography>
          <NeshanMap center={selectedPoint} marker={selectedPoint} followCenter={false} onPointChange={setPoint} className="h-72 overflow-hidden rounded-[1.6rem] border border-white/7" />
          <Typography type="body-xs" color="muted" className="mt-2" render={({ children, ...p }) => <p dir="ltr" {...p}>{children}</p>}>{selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}</Typography>
        </div>

        <Checkbox name="isDefault" defaultSelected={existing?.isDefault}>
          <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
          <Checkbox.Content>انتخاب به‌عنوان لوکیشن پیش‌فرض</Checkbox.Content>
        </Checkbox>
        {error ? <Typography type="body-sm" className="text-danger">{error}</Typography> : null}
        <Button type="submit" variant="primary" size="lg" fullWidth isDisabled={pending || !selection.countryId || !selection.provinceId || !selection.cityId}>
          {pending ? <><Spinner size="sm" /> در حال ذخیره...</> : "ذخیره لوکیشن"}
        </Button>
      </Form>

      {openLevel ? <LocationPickerSheet key={openLevel} selectedId={selection[openLevel]} {...selectors[openLevel]} onClose={() => setOpenLevel(null)} onSelect={(id) => selectLocation(openLevel, id)} /> : null}
    </main>
  );
}

type PickerData = {
  label: string;
  placeholder: string;
  items: PublicResourceItem[];
  isLoading: boolean;
  isError: boolean;
  disabled: boolean;
  refetch: () => unknown;
};

function picker(label: string, placeholder: string, query: {
  data?: { items: PublicResourceItem[] };
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}, disabled = false): PickerData {
  return { label, placeholder, items: query.data?.items ?? [], isLoading: query.isLoading, isError: query.isError, disabled, refetch: query.refetch };
}

function FormField({ label, multiline, ...props }: React.ComponentProps<typeof TextField> & { label: string; multiline?: boolean }) {
  return <TextField {...props}><Label>{label}</Label><InputGroup variant="secondary">{multiline ? <InputGroup.TextArea rows={3} /> : <InputGroup.Input />}</InputGroup></TextField>;
}

function LocationPickerSheet({ label, items, selectedId, isLoading, isError, refetch, onClose, onSelect }: PickerData & {
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const normalizedSearch = normalizeSearchText(search);
  const visibleItems = normalizedSearch
    ? items.filter((item) => normalizeSearchText(item.name).includes(normalizedSearch))
    : items;

  return (
    <BottomSheet open onOpenChange={(open) => !open && onClose()} snapPoints={[0.62, 0.9]} title={`انتخاب ${label}`} description={`یک ${label} را از فهرست انتخاب کنید.`}>
      <TextField value={search} onChange={setSearch} aria-label={`جستجوی ${label}`} className="sticky top-0 z-10 bg-surface pb-3">
        <InputGroup variant="secondary" fullWidth>
          <InputGroup.Input placeholder={`جستجوی ${label}`} autoFocus />
          <InputGroup.Suffix><Icon name="magnifying-glass" size={20} /></InputGroup.Suffix>
        </InputGroup>
      </TextField>
      {isLoading ? <PickerRowsSkeleton count={5} /> : isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
          <Typography type="body-sm" className="text-danger">دریافت فهرست ناموفق بود.</Typography>
          <Button variant="secondary" onPress={() => void refetch()}>تلاش دوباره</Button>
        </div>
      ) : visibleItems.length === 0 ? <Typography type="body-sm" color="muted" align="center" className="py-12">موردی پیدا نشد.</Typography> : (
        <ListBox aria-label={`انتخاب ${label}`} selectionMode="single" selectedKeys={selectedId ? new Set([selectedId]) : new Set()} onSelectionChange={(keys) => {
          if (keys === "all") return;
          const id = [...keys][0];
          if (id != null) onSelect(String(id));
        }} className="gap-2 py-3">
          {visibleItems.map((item) => <ListBox.Item key={item.id} id={item.id} textValue={item.name} className="min-h-14 rounded-2xl px-4">
            <span className="flex-1 font-semibold">{item.name}</span>
            <ListBox.ItemIndicator>
              {({ isSelected }) => isSelected ? <Icon name="check" size={18} /> : null}
            </ListBox.ItemIndicator>
          </ListBox.Item>)}
        </ListBox>
      )}
    </BottomSheet>
  );
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("fa-IR").replaceAll("ي", "ی").replaceAll("ك", "ک");
}

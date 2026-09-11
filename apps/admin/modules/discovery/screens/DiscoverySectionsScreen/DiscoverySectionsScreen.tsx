"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  toast,
} from "@heroui/react";
import {
  type DiscoverySectionConfiguration,
  type DiscoverySectionType,
  type SaveDiscoverySection,
  useAdminDiscoverySections,
  useDeleteDiscoverySection,
  useDiscoveryOptions,
  useImportDefaultDiscoverySections,
  useReorderDiscoverySections,
  useSaveDiscoverySection,
} from "@api/admin";
import type { DiscoverySectionSort } from "@api/admin";
import { Icon } from "@theme/icon";
import { useState } from "react";

import { MediaUploaderField } from "@/components/media-uploader-field";

const empty: SaveDiscoverySection = {
  key: "",
  placement: "discovery",
  type: "clubs",
  title: "",
  subtitle: "",
  layout: "carousel",
  viewAllLabel: "مشاهده همه",
  viewAllUrl: "",
  appearance: {
    backgroundColor: "transparent",
    textColor: "",
    accentColor: "",
    showHeader: true,
    showViewAll: true,
    headerAlignment: "start",
    viewAllVariant: "link",
  },
  enabled: true,
  selection: {
    mode: "query",
    itemIds: [],
    limit: 10,
    sort: "newest",
    filters: {},
  },
  banners: [],
};
const placementLabels = {
  discovery: "دیسکاوری",
  "athlete-home": "خانه ورزشکار",
  "coach-home": "خانه مربی",
  reservations: "رزروهای من",
};

const input =
  "h-11 rounded-xl border border-border bg-surface-secondary px-3 text-sm";

export function DiscoverySectionsScreen() {
  const list = useAdminDiscoverySections();
  const save = useSaveDiscoverySection();
  const remove = useDeleteDiscoverySection();
  const reorder = useReorderDiscoverySections();
  const importDefaults = useImportDefaultDiscoverySections();
  const [editing, setEditing] = useState<DiscoverySectionConfiguration | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState("");
  const items = list.data?.items ?? [];

  const handleImportDefaults = async () => {
    try {
      const result = await importDefaults.mutateAsync();
      if (!result.created) {
        toast.success("همه سکشن‌های پیش‌فرض از قبل موجودند");
        return;
      }
      toast.success(
        `${result.created} سکشن پیش‌فرض اضافه شد${result.existing ? `؛ ${result.existing} سکشن از قبل موجود بود` : ""}`,
      );
    } catch {
      toast.danger("درون‌ریزی سکشن‌های پیش‌فرض ناموفق بود");
    }
  };

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    try {
      await reorder.mutateAsync(ids);
    } catch {
      toast.danger("تغییر ترتیب ذخیره نشد؛ دوباره تلاش کنید");
    }
  };

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">چیدمان و بنرهای اپ</h1>
          <p className="mt-1 text-sm text-muted">
            سکشن‌ها، محتوای آن‌ها و ترتیب نمایش در اپ را مدیریت کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            isPending={importDefaults.isPending}
            onPress={() => void handleImportDefaults()}
          >
            <Icon name="database" />
            {importDefaults.isPending
              ? "در حال درون‌ریزی…"
              : "درون‌ریزی داده‌های پیش‌فرض"}
          </Button>
          <Button onPress={() => setCreating(true)}>
            <Icon name="plus-fat" />
            سکشن جدید
          </Button>
        </div>
      </div>
      {list.isPending ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : list.isError ? (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-danger p-4"
        >
          <p>دریافت چیدمان انجام نشد.</p>
          <Button variant="secondary" onPress={() => void list.refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((item, index) => (
            <Card
              key={item.id}
              className="flex-row flex-wrap items-center gap-4 p-4"
            >
              <div className="flex flex-col gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={`بالا بردن ${item.title}`}
                  isDisabled={
                    index === 0 || reorder.isPending || remove.isPending
                  }
                  onPress={() => void move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={`پایین بردن ${item.title}`}
                  isDisabled={
                    index === items.length - 1 ||
                    reorder.isPending ||
                    remove.isPending
                  }
                  onPress={() => void move(index, 1)}
                >
                  ↓
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong>{item.title}</strong>
                  <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
                    {item.type === "banners"
                      ? placementLabels[item.placement ?? "discovery"]
                      : item.type}
                  </span>
                  {!item.enabled && (
                    <span className="text-xs text-muted">غیرفعال</span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-muted">
                  {item.subtitle || item.key} ·{" "}
                  {item.type === "banners"
                    ? `${item.banners.length.toLocaleString("fa-IR")} بنر`
                    : item.selection.mode === "manual"
                      ? `${item.selection.itemIds.length} انتخاب`
                      : `کوئری، ${item.selection.limit} مورد`}
                </p>
              </div>
              <Button variant="secondary" onPress={() => setEditing(item)}>
                ویرایش
              </Button>
              <Button
                variant="ghost"
                className="text-danger"
                isDisabled={remove.isPending || reorder.isPending}
                onPress={async () => {
                  if (!confirm("این سکشن حذف شود؟")) return;
                  try {
                    await remove.mutateAsync(item.id);
                    toast.success("سکشن حذف شد");
                  } catch {
                    toast.danger("حذف انجام نشد؛ دوباره تلاش کنید");
                  }
                }}
              >
                حذف
              </Button>
            </Card>
          ))}
          {!items.length && (
            <p className="py-16 text-center text-muted">
              هنوز سکشنی ساخته نشده است.
            </p>
          )}
        </div>
      )}
      {(creating || editing) && (
        <SectionEditor
          initial={editing ?? undefined}
          isPending={save.isPending}
          saveError={saveError}
          onClose={() => {
            if (save.isPending) return;
            setSaveError("");
            setCreating(false);
            setEditing(null);
          }}
          onSave={async (payload) => {
            setSaveError("");
            try {
              await save.mutateAsync({ id: editing?.id, payload });
              toast.success("سکشن ذخیره شد");
              setCreating(false);
              setEditing(null);
            } catch {
              setSaveError(
                "ذخیره انجام نشد؛ اطلاعات فرم حفظ شده است. عنوان، کلید یکتا و نشانی تصاویر را بررسی کنید.",
              );
            }
          }}
        />
      )}
    </main>
  );
}

function SectionEditor({
  initial,
  isPending,
  saveError,
  onClose,
  onSave,
}: {
  initial?: DiscoverySectionConfiguration;
  isPending: boolean;
  saveError: string;
  onClose: () => void;
  onSave: (value: SaveDiscoverySection) => Promise<void>;
}) {
  const [value, setValue] = useState<SaveDiscoverySection>(
    initial
      ? {
          key: initial.key,
          type: initial.type,
          title: initial.title,
          subtitle: initial.subtitle,
          layout: initial.layout,
          viewAllLabel: initial.viewAllLabel,
          viewAllUrl: initial.viewAllUrl,
          appearance: initial.appearance,
          enabled: initial.enabled,
          placement: initial.placement ?? "discovery",
          selection: initial.selection,
          banners: initial.banners,
        }
      : empty,
  );
  const [filtersText, setFiltersText] = useState(() =>
    JSON.stringify(initial?.selection.filters ?? {}, null, 2),
  );
  const [formError, setFormError] = useState("");
  const handleSave = () => {
    if (isPending) return;
    if (!value.title.trim() || !/^[a-z0-9-]+$/.test(value.key)) {
      setFormError(
        "عنوان و کلید الزامی‌اند؛ کلید فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است.",
      );
      return;
    }
    let filters = value.selection.filters;
    if (value.type !== "banners" && value.selection.mode === "query") {
      try {
        const parsed: unknown = JSON.parse(filtersText);
        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed) ||
          !Object.values(parsed).every(
            (entry) =>
              Array.isArray(entry) &&
              entry.every((item) => typeof item === "string"),
          )
        )
          throw new Error("Invalid filters");
        filters = parsed as Record<string, string[]>;
      } catch {
        setFormError(
          "فیلترها باید یک شیء JSON با مقدارهای آرایه‌ای از متن باشند.",
        );
        return;
      }
    }
    setFormError("");
    void onSave({ ...value, selection: { ...value.selection, filters } });
  };
  const options = useDiscoveryOptions(
    value.type,
    value.type !== "banners" && value.selection.mode === "manual",
  );
  const set = <K extends keyof SaveDiscoverySection>(
    key: K,
    next: SaveDiscoverySection[K],
  ) => setValue((old) => ({ ...old, [key]: next }));
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="max-h-[90dvh] w-full max-w-2xl overflow-auto p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {initial ? "ویرایش سکشن" : "سکشن جدید"}
          </h2>
          <Button isIconOnly variant="ghost" onPress={onClose}>
            ×
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="عنوان">
            <Input
              className={input}
              variant="secondary"
              value={value.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field label="کلید">
            <Input
              dir="ltr"
              className={input}
              variant="secondary"
              value={value.key}
              onChange={(e) => set("key", e.target.value)}
            />
          </Field>
          <Field label="نوع">
            <Select
              value={value.type}
              onChange={(e) => {
                set("type", e as DiscoverySectionType);
                if (e !== "banners") set("placement", "discovery");
              }}
            >
              <Label className="text-sm">نوع</Label>
              <Select.Trigger className={input}>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="banners" textValue="بنرها">
                    بنرها
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="clubs" textValue="باشگاه‌ها">
                    باشگاه‌ها
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="coaches" textValue="مربی‌ها">
                    مربی‌ها
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="classes" textValue="کلاس‌ها">
                    کلاس‌ها
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="sports" textValue="رشته‌های ورزشی">
                    رشته‌های ورزشی
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="articles" textValue="مقالات">
                    مقالات
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </Field>
          {value.type === "banners" ? (
            <Field label="جایگاه نمایش بنر">
              <FormSelect
                aria-label="جایگاه نمایش بنر"
                className={input}
                value={value.placement ?? "discovery"}
                onChange={(e) =>
                  set("placement", e as SaveDiscoverySection["placement"])
                }
              >
                <FormOption value="discovery">دیسکاوری</FormOption>
                <FormOption value="athlete-home">خانه ورزشکار</FormOption>
                <FormOption value="coach-home">خانه مربی</FormOption>
                <FormOption value="reservations">رزروهای من</FormOption>
              </FormSelect>
              <p className="text-xs text-muted">
                بنر فعال در جایگاه انتخاب‌شده نمایش داده می‌شود؛ برای آماده‌سازی
                پیش‌نویس، گزینه فعال را خاموش کنید.
              </p>
            </Field>
          ) : null}
          <Field label="چیدمان">
            <Select
              value={value.layout}
              onChange={(selected) =>
                selected !== null && set("layout", String(selected))
              }
            >
              <Label className="text-sm">چیدمان</Label>
              <Select.Trigger className={input}>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="carousel" textValue="اسلایدر">
                    اسلایدر
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {value.type === "clubs" ? (
                    <ListBox.Item id="cards" textValue="کارت‌های روی هم">
                      کارت‌های روی هم
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ) : null}
                  <ListBox.Item id="grid" textValue="گرید">
                    گرید
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="compact" textValue="کارت فشرده">
                    کارت فشرده
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="editorial" textValue="کارت تحریریه‌ای">
                    کارت تحریریه‌ای
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="horizontal-outline" textValue="افقی خط‌دار">
                    افقی خط‌دار
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="16/9:1" textValue="بنر عریض ۱۶:۹">
                    بنر عریض ۱۶:۹
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="16/9:1.2" textValue="بنر عریض نیمه‌نمایان">
                    بنر عریض نیمه‌نمایان
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="4/3:auto" textValue="بنر افقی ۴:۳">
                    بنر افقی ۴:۳
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="3/4:auto" textValue="بنر عمودی ۳:۴">
                    بنر عمودی ۳:۴
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="9/16:auto" textValue="استوری ۹:۱۶">
                    استوری ۹:۱۶
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </Field>
          <Field label="زیرعنوان" wide>
            <Input
              className={input}
              variant="secondary"
              value={value.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
            />
          </Field>
          <Field label="متن دکمه مشاهده همه">
            <Input
              className={input}
              variant="secondary"
              placeholder="خالی = بدون دکمه"
              value={value.viewAllLabel}
              onChange={(e) => set("viewAllLabel", e.target.value)}
            />
          </Field>
          <Field label="لینک مشاهده همه">
            <Input
              dir="ltr"
              className={input}
              variant="secondary"
              placeholder="/discovery/clubs"
              value={value.viewAllUrl}
              onChange={(e) => set("viewAllUrl", e.target.value)}
            />
          </Field>
          <Field label="رنگ پس‌زمینه">
            <Input
              dir="ltr"
              className={input}
              variant="secondary"
              placeholder="#ffffff یا var(--surface)"
              value={value.appearance.backgroundColor}
              onChange={(e) =>
                set("appearance", {
                  ...value.appearance,
                  backgroundColor: e.target.value,
                })
              }
            />
          </Field>
          <Field label="نمایش دکمه مشاهده همه">
            <Checkbox
              isSelected={value.appearance.showViewAll}
              onChange={(showViewAll) =>
                set("appearance", { ...value.appearance, showViewAll })
              }
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                نمایش داده شود
              </Checkbox.Content>
            </Checkbox>
          </Field>
          {value.type !== "banners" ? (
            <>
              <Field label="روش انتخاب">
                <Select
                  value={value.selection.mode}
                  onChange={(selected) =>
                    set("selection", {
                      ...value.selection,
                      mode: selected as "manual" | "query",
                    })
                  }
                >
                  <Label className="text-sm">روش انتخاب</Label>
                  <Select.Trigger className={input}>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="query" textValue="خودکار با فیلتر">
                        خودکار با فیلتر
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="manual" textValue="انتخاب دستی">
                        انتخاب دستی
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Field>
              <Field label="مرتب‌سازی">
                <Select
                  value={value.selection.sort}
                  onChange={(selected) =>
                    set("selection", {
                      ...value.selection,
                      sort: selected as DiscoverySectionSort,
                    })
                  }
                >
                  <Label className="text-sm">مرتب‌سازی</Label>
                  <Select.Trigger className={input}>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="newest" textValue="جدیدترین">
                        جدیدترین
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="rating" textValue="بالاترین امتیاز">
                        بالاترین امتیاز
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="name" textValue="نام">
                        نام
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="manual" textValue="ترتیب انتخاب">
                        ترتیب انتخاب
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Field>
              <Field label="تعداد">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  className={input}
                  variant="secondary"
                  value={value.selection.limit}
                  onChange={(e) =>
                    set("selection", {
                      ...value.selection,
                      limit: Number(e.target.value),
                    })
                  }
                />
              </Field>
              {value.selection.mode === "manual" ? (
                <Field label="انتخاب محتوا" wide>
                  <div className="max-h-48 overflow-auto rounded-xl border border-border p-2">
                    {options.isPending ? (
                      <Spinner />
                    ) : (
                      options.data?.items.map((option) => (
                        <div
                          key={option.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-secondary"
                        >
                          <Checkbox
                            isSelected={value.selection.itemIds.includes(
                              option.id,
                            )}
                            onChange={(isSelected) =>
                              set("selection", {
                                ...value.selection,
                                itemIds: isSelected
                                  ? [...value.selection.itemIds, option.id]
                                  : value.selection.itemIds.filter(
                                      (id) => id !== option.id,
                                    ),
                              })
                            }
                          >
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span className="flex-1">{option.label}</span>
                              <small className="text-muted">
                                {option.status}
                              </small>
                            </Checkbox.Content>
                          </Checkbox>
                        </div>
                      ))
                    )}
                  </div>
                </Field>
              ) : (
                <Field label="فیلترها (JSON)" wide>
                  <TextArea
                    dir="ltr"
                    className="h-28 rounded-xl border border-border bg-surface-secondary px-3 py-3 font-mono text-sm"
                    aria-label="فیلترها (JSON)"
                    value={filtersText}
                    onChange={(e) => setFiltersText(e.target.value)}
                  />
                </Field>
              )}
            </>
          ) : (
            <BannerFields value={value} setValue={setValue} />
          )}
          <Checkbox
            isSelected={value.enabled}
            onChange={(isSelected) => set("enabled", isSelected)}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              نمایش در اپ
            </Checkbox.Content>
          </Checkbox>
        </div>
        {formError || saveError ? (
          <p role="alert" className="mt-4 text-sm text-danger">
            {formError || saveError}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onPress={onClose}>
            انصراف
          </Button>
          <Button
            isPending={isPending}
            isDisabled={isPending}
            onPress={handleSave}
          >
            ذخیره
          </Button>
        </div>
      </Card>
    </div>
  );
}
function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex flex-col gap-2 text-sm ${wide ? "sm:col-span-2" : ""}`}
    >
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
function BannerFields({
  value,
  setValue,
}: {
  value: SaveDiscoverySection;
  setValue: React.Dispatch<React.SetStateAction<SaveDiscoverySection>>;
}) {
  const emptyBanner = {
    title: "",
    subtitle: "",
    imageUrl: "",
    actionLabel: "",
    actionUrl: "",
  };
  const change = (index: number, key: keyof typeof emptyBanner, next: string) =>
    setValue((old) => ({
      ...old,
      banners: old.banners.map((banner, bannerIndex) =>
        bannerIndex === index ? { ...banner, [key]: next } : banner,
      ),
    }));
  return (
    <div className="flex flex-col gap-4 sm:col-span-2">
      {value.banners.map((banner, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2"
        >
          <div className="flex items-center justify-between sm:col-span-2">
            <strong>بنر {index + 1}</strong>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onPress={() =>
                setValue((old) => ({
                  ...old,
                  banners: old.banners.filter(
                    (_, bannerIndex) => bannerIndex !== index,
                  ),
                }))
              }
            >
              حذف بنر
            </Button>
          </div>
          <Field label="عنوان بنر">
            <Input
              className={input}
              variant="secondary"
              value={banner.title}
              onChange={(e) => change(index, "title", e.target.value)}
            />
          </Field>
          <MediaUploaderField
            label="تصویر بنر"
            value={banner.imageUrl}
            onChange={(next) => change(index, "imageUrl", next)}
          />
          <Field label="توضیح بنر" wide>
            <Input
              className={input}
              variant="secondary"
              value={banner.subtitle}
              onChange={(e) => change(index, "subtitle", e.target.value)}
            />
          </Field>
          <Field label="متن دکمه بنر">
            <Input
              className={input}
              variant="secondary"
              value={banner.actionLabel}
              onChange={(e) => change(index, "actionLabel", e.target.value)}
            />
          </Field>
          <Field label="لینک دکمه بنر">
            <Input
              dir="ltr"
              className={input}
              variant="secondary"
              value={banner.actionUrl}
              onChange={(e) => change(index, "actionUrl", e.target.value)}
            />
          </Field>
        </div>
      ))}
      <Button
        variant="secondary"
        isDisabled={value.banners.length >= 20}
        onPress={() =>
          setValue((old) => ({
            ...old,
            banners: [...old.banners, { ...emptyBanner }],
          }))
        }
      >
        <Icon name="plus-fat" />
        افزودن بنر
      </Button>
    </div>
  );
}

"use client";

import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  type DiscoverySectionConfiguration,
  type DiscoverySectionType,
  type SaveDiscoverySection,
  useAdminDiscoverySections,
  useDeleteDiscoverySection,
  useDiscoveryOptions,
  useReorderDiscoverySections,
  useSaveDiscoverySection,
} from "@api/admin";
import type { DiscoverySectionSort } from "@api/admin";
import { Icon } from "@theme/icon";
import { useState } from "react";

const empty: SaveDiscoverySection = {
  key: "",
  type: "clubs",
  title: "",
  subtitle: "",
  layout: "carousel",
  viewAllLabel: "مشاهده همه",
  viewAllUrl: "",
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
const input =
  "h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent";

export function DiscoverySectionsScreen() {
  const list = useAdminDiscoverySections();
  const save = useSaveDiscoverySection();
  const remove = useDeleteDiscoverySection();
  const reorder = useReorderDiscoverySections();
  const [editing, setEditing] = useState<DiscoverySectionConfiguration | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const items = list.data?.items ?? [];

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorder.mutateAsync(ids);
  };

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">چیدمان دیسکاوری</h1>
          <p className="mt-1 text-sm text-muted">
            سکشن‌ها، محتوای آن‌ها و ترتیب نمایش در اپ را مدیریت کنید.
          </p>
        </div>
        <Button onPress={() => setCreating(true)}>
          <Icon name="plus-fat" />
          سکشن جدید
        </Button>
      </div>
      {list.isPending ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((item, index) => (
            <Card key={item.id} className="flex-row items-center gap-4 p-4">
              <div className="flex flex-col gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={index === 0}
                  onPress={() => void move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={index === items.length - 1}
                  onPress={() => void move(index, 1)}
                >
                  ↓
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong>{item.title}</strong>
                  <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
                    {item.type}
                  </span>
                  {!item.enabled && (
                    <span className="text-xs text-muted">غیرفعال</span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-muted">
                  {item.subtitle || item.key} ·{" "}
                  {item.selection.mode === "manual"
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
                onPress={async () => {
                  if (confirm("این سکشن حذف شود؟")) {
                    await remove.mutateAsync(item.id);
                    toast.success("سکشن حذف شد");
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
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={async (payload) => {
            await save.mutateAsync({ id: editing?.id, payload });
            toast.success("سکشن ذخیره شد");
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}

function SectionEditor({
  initial,
  onClose,
  onSave,
}: {
  initial?: DiscoverySectionConfiguration;
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
          enabled: initial.enabled,
          selection: initial.selection,
          banners: initial.banners,
        }
      : empty,
  );
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
            <input
              className={input}
              value={value.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field label="کلید">
            <input
              dir="ltr"
              className={input}
              value={value.key}
              onChange={(e) => set("key", e.target.value)}
            />
          </Field>
          <Field label="نوع">
            <select
              className={input}
              value={value.type}
              onChange={(e) =>
                set("type", e.target.value as DiscoverySectionType)
              }
            >
              <option value="banners">بنرها</option>
              <option value="clubs">باشگاه‌ها</option>
              <option value="coaches">مربی‌ها</option>
              <option value="articles">مقالات</option>
            </select>
          </Field>
          <Field label="چیدمان">
            <select
              className={input}
              value={value.layout}
              onChange={(e) => set("layout", e.target.value)}
            >
              <option value="carousel">اسلایدر</option>
              <option value="grid">گرید</option>
            </select>
          </Field>
          <Field label="زیرعنوان" wide>
            <input
              className={input}
              value={value.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
            />
          </Field>
          <Field label="متن دکمه مشاهده همه">
            <input
              className={input}
              placeholder="خالی = بدون دکمه"
              value={value.viewAllLabel}
              onChange={(e) => set("viewAllLabel", e.target.value)}
            />
          </Field>
          <Field label="لینک مشاهده همه">
            <input
              dir="ltr"
              className={input}
              placeholder="/discovery/clubs"
              value={value.viewAllUrl}
              onChange={(e) => set("viewAllUrl", e.target.value)}
            />
          </Field>
          {value.type !== "banners" ? (
            <>
              <Field label="روش انتخاب">
                <select
                  className={input}
                  value={value.selection.mode}
                  onChange={(e) =>
                    set("selection", {
                      ...value.selection,
                      mode: e.target.value as "manual" | "query",
                    })
                  }
                >
                  <option value="query">خودکار با فیلتر</option>
                  <option value="manual">انتخاب دستی</option>
                </select>
              </Field>
              <Field label="مرتب‌سازی">
                <select
                  className={input}
                  value={value.selection.sort}
                  onChange={(e) =>
                    set("selection", {
                      ...value.selection,
                      sort: e.target.value as DiscoverySectionSort,
                    })
                  }
                >
                  <option value="newest">جدیدترین</option>
                  <option value="rating">بالاترین امتیاز</option>
                  <option value="name">نام</option>
                  <option value="manual">ترتیب انتخاب</option>
                </select>
              </Field>
              <Field label="تعداد">
                <input
                  type="number"
                  min={1}
                  max={50}
                  className={input}
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
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-secondary"
                        >
                          <input
                            type="checkbox"
                            checked={value.selection.itemIds.includes(
                              option.id,
                            )}
                            onChange={(e) =>
                              set("selection", {
                                ...value.selection,
                                itemIds: e.target.checked
                                  ? [...value.selection.itemIds, option.id]
                                  : value.selection.itemIds.filter(
                                      (id) => id !== option.id,
                                    ),
                              })
                            }
                          />
                          <span className="flex-1">{option.label}</span>
                          <small className="text-muted">{option.status}</small>
                        </label>
                      ))
                    )}
                  </div>
                </Field>
              ) : (
                <Field label="فیلترها (JSON)" wide>
                  <textarea
                    dir="ltr"
                    className={`${input} h-28 py-3 font-mono`}
                    value={JSON.stringify(value.selection.filters, null, 2)}
                    onChange={(e) => {
                      try {
                        set("selection", {
                          ...value.selection,
                          filters: JSON.parse(e.target.value),
                        });
                      } catch {}
                    }}
                  />
                </Field>
              )}
            </>
          ) : (
            <BannerFields value={value} setValue={setValue} />
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
            />
            نمایش در اپ
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onPress={onClose}>
            انصراف
          </Button>
          <Button onPress={() => void onSave(value)}>ذخیره</Button>
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
  const banner = value.banners[0] ?? {
    title: "",
    subtitle: "",
    imageUrl: "",
    actionLabel: "",
    actionUrl: "",
  };
  const change = (key: keyof typeof banner, next: string) =>
    setValue((old) => ({ ...old, banners: [{ ...banner, [key]: next }] }));
  return (
    <>
      <Field label="عنوان بنر">
        <input
          className={input}
          value={banner.title}
          onChange={(e) => change("title", e.target.value)}
        />
      </Field>
      <Field label="تصویر بنر">
        <input
          dir="ltr"
          className={input}
          value={banner.imageUrl}
          onChange={(e) => change("imageUrl", e.target.value)}
        />
      </Field>
      <Field label="توضیح بنر" wide>
        <input
          className={input}
          value={banner.subtitle}
          onChange={(e) => change("subtitle", e.target.value)}
        />
      </Field>
      <Field label="متن دکمه بنر">
        <input
          className={input}
          value={banner.actionLabel}
          onChange={(e) => change("actionLabel", e.target.value)}
        />
      </Field>
      <Field label="لینک دکمه بنر">
        <input
          dir="ltr"
          className={input}
          value={banner.actionUrl}
          onChange={(e) => change("actionUrl", e.target.value)}
        />
      </Field>
    </>
  );
}

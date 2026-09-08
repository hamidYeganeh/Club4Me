"use client";
import { SecondaryHeader } from "../../components/SecondaryHeader";

import { useEffect, useRef, useState } from "react";
import { Button, SearchField, Skeleton, Typography } from "@heroui/react";
import {
  useCatalogSearch,
  usePublicCatalogResource,
  type PublicCatalogSearchKind,
} from "@api/discovery";
import { Icon } from "@theme/icon";
import { IranDateInput } from "@repo/ui/iran-date-input";

import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";
import { DiscoveryPagination } from "@modules/discovery/components/DiscoveryPagination";
import { ActiveLocationSelector } from "@modules/locations/components/ActiveLocationSelector";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { RequestFailureState } from "@/components/request-failure-state";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";
import {
  SortBottomSheet,
  type SortOption,
} from "@/components/sort-bottom-sheet";

const RECENT_SEARCHES_KEY = "gym4me.discovery.recent-searches";
const kinds = [
  { label: "همه", value: undefined },
  { label: "باشگاه‌ها", value: "club" },
  { label: "مربی‌ها", value: "coach" },
  { label: "کلاس‌ها", value: "class" },
] as const;

type RecentSearch = { query: string; kind?: PublicCatalogSearchKind };
type SearchSort = "suggested" | "rating" | "newest";

const searchSortOptions: ReadonlyArray<SortOption<SearchSort>> = [
  { value: "suggested", label: "پیشنهادی", icon: "arrow-trend-up" },
  { value: "rating", label: "محبوب‌ترین", icon: "medal" },
  { value: "newest", label: "جدیدترین", icon: "sort-descending" },
];

export function DiscoverySearchScreen({
  initialKind,
}: {
  initialKind?: PublicCatalogSearchKind;
}) {
  const { active } = useActiveLocation();
  const activeCoordinates = getActiveCoordinates(active);
  const [sharedCoordinates, setSharedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const coordinates = sharedCoordinates ?? activeCoordinates;
  const coordinateLatitude = coordinates?.latitude;
  const coordinateLongitude = coordinates?.longitude;
  const [urlReady, setUrlReady] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [nearby, setNearby] = useState(true);
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<PublicCatalogSearchKind | undefined>(
    initialKind,
  );
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [serviceMode, setServiceMode] = useState("");
  const [admission, setAdmission] = useState("");
  const [startsFrom, setStartsFrom] = useState("");
  const [startsTo, setStartsTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [skillLevelId, setSkillLevelId] = useState("");
  const [comparison, setComparison] = useState<string[]>([]);
  const budgetError =
    kind === "class" &&
    ([minPrice, maxPrice].some(
      (value) =>
        value !== "" &&
        (!Number.isSafeInteger(Number(value)) || Number(value) < 0),
    ) ||
      (minPrice !== "" &&
        maxPrice !== "" &&
        Number(minPrice) > Number(maxPrice)))
      ? "بودجه باید عدد صحیح نامنفی باشد و حداقل از حداکثر بیشتر نباشد."
      : "";
  const [sort, setSort] = useState<SearchSort>("suggested");
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [deferredQuery, setDeferredQuery] = useState("");
  const keywords = usePublicCatalogResource("discovery", "search-keyword", {
    limit: 8,
  });
  const levels = usePublicCatalogResource("sports", "skill-level", {
    limit: 100,
  });
  const scope = JSON.stringify([
    deferredQuery,
    kind,
    sort,
    nearby ? coordinates : null,
    kind === "class"
      ? [
          minPrice,
          maxPrice,
          serviceMode,
          admission,
          startsFrom,
          startsTo,
          timeFrom,
          timeTo,
          skillLevelId,
        ]
      : null,
  ]);
  const page = pagination.scope === scope ? pagination.page : 1;
  const canSearch = deferredQuery.length >= 2;
  const result = useCatalogSearch(
    {
      q: deferredQuery,
      ...(kind === "class" && !budgetError
        ? {
            minPrice: minPrice === "" ? undefined : Number(minPrice),
            maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
            serviceMode: serviceMode || undefined,
            admission:
              admission === "automatic" || admission === "requires_approval"
                ? admission
                : undefined,
            startsFrom: startsFrom || undefined,
            startsTo: startsTo || undefined,
            timeFrom: timeFrom || undefined,
            timeTo: timeTo || undefined,
            skillLevelId: skillLevelId || undefined,
          }
        : {}),
      kind,
      limit: 20,
      page,
      ...(nearby ? coordinates : {}),
      radiusKm: nearby && coordinates ? 25 : undefined,
      sort: sort === "suggested" ? undefined : sort,
    },
    canSearch && !budgetError,
  );
  const failure = getQueryFailure(result.error, result.fetchStatus);

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery((params.get("q") ?? "").slice(0, 200));
      const savedKind = params.get("kind");
      setKind(
        ["club", "coach", "class"].includes(savedKind ?? "")
          ? (savedKind as PublicCatalogSearchKind)
          : initialKind,
      );
      const savedSort = params.get("sort");
      setSort(
        savedSort === "rating" || savedSort === "newest"
          ? savedSort
          : "suggested",
      );
      setNearby(params.get("nearby") !== "0");
      const latitude = Number(params.get("latitude"));
      const longitude = Number(params.get("longitude"));
      setSharedCoordinates(
        params.has("latitude") &&
          params.has("longitude") &&
          Number.isFinite(latitude) &&
          Math.abs(latitude) <= 90 &&
          Number.isFinite(longitude) &&
          Math.abs(longitude) <= 180
          ? { latitude, longitude }
          : undefined,
      );
      setMinPrice(params.get("minPrice") ?? "");
      setMaxPrice(params.get("maxPrice") ?? "");
      const mode = params.get("serviceMode") ?? "";
      setServiceMode(
        ["club", "online", "home", "outdoor"].includes(mode) ? mode : "",
      );
      const savedAdmission = params.get("admission") ?? "";
      setAdmission(
        ["automatic", "requires_approval"].includes(savedAdmission)
          ? savedAdmission
          : "",
      );
      setStartsFrom(params.get("startsFrom") ?? "");
      setStartsTo(params.get("startsTo") ?? "");
      setTimeFrom(params.get("timeFrom") ?? "");
      setTimeTo(params.get("timeTo") ?? "");
      const savedLevel = params.get("skillLevelId") ?? "";
      setSkillLevelId(/^[a-f\d]{24}$/i.test(savedLevel) ? savedLevel : "");
      setUrlReady(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [initialKind]);

  useEffect(() => {
    if (!urlReady || deferredQuery !== query.trim()) return;
    const url = new URL(window.location.href);
    for (const key of [
      "q",
      "kind",
      "sort",
      "nearby",
      "latitude",
      "longitude",
      "minPrice",
      "maxPrice",
      "serviceMode",
      "admission",
      "startsFrom",
      "startsTo",
      "timeFrom",
      "timeTo",
      "skillLevelId",
    ])
      url.searchParams.delete(key);
    if (deferredQuery) url.searchParams.set("q", deferredQuery);
    if (kind) url.searchParams.set("kind", kind);
    if (kind === "class") {
      if (minPrice !== "") url.searchParams.set("minPrice", minPrice);
      if (maxPrice !== "") url.searchParams.set("maxPrice", maxPrice);
      if (serviceMode) url.searchParams.set("serviceMode", serviceMode);
      if (admission) url.searchParams.set("admission", admission);
      if (startsFrom) url.searchParams.set("startsFrom", startsFrom);
      if (startsTo) url.searchParams.set("startsTo", startsTo);
      if (timeFrom) url.searchParams.set("timeFrom", timeFrom);
      if (timeTo) url.searchParams.set("timeTo", timeTo);
      if (skillLevelId) url.searchParams.set("skillLevelId", skillLevelId);
    }
    if (sort !== "suggested") url.searchParams.set("sort", sort);
    url.searchParams.set(
      "nearby",
      nearby && coordinateLatitude != null && coordinateLongitude != null
        ? "1"
        : "0",
    );
    if (
      nearby &&
      coordinateLatitude != null &&
      coordinateLongitude != null
    ) {
      url.searchParams.set("latitude", String(coordinateLatitude));
      url.searchParams.set("longitude", String(coordinateLongitude));
    }
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [
    urlReady,
    deferredQuery,
    query,
    kind,
    sort,
    nearby,
    coordinateLatitude,
    coordinateLongitude,
    minPrice,
    maxPrice,
    serviceMode,
    admission,
    startsFrom,
    startsTo,
    timeFrom,
    timeTo,
    skillLevelId,
  ]);

  async function shareSearch() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("لینک جست‌وجو کپی شد");
    } catch {
      setShareMessage("کپی انجام نشد؛ لینک نوار آدرس را کپی کنید.");
    }
  }

  useEffect(() => {
    const normalizedQuery = query.trim();
    const timer = window.setTimeout(
      () => {
        setDeferredQuery(normalizedQuery);
      },
      normalizedQuery.length < 2 ? 0 : 250,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const saved: unknown = JSON.parse(
        window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]",
      );
      if (Array.isArray(saved)) {
        const frame = window.requestAnimationFrame(() => {
          setRecent(saved.slice(0, 6) as RecentSearch[]);
        });
        return () => window.cancelAnimationFrame(frame);
      }
    } catch {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, []);

  function remember(value = query.trim(), nextKind = kind) {
    if (value.length < 2) return;
    const next = [
      { query: value, kind: nextKind },
      ...recent.filter(
        (item) => item.query !== value || item.kind !== nextKind,
      ),
    ].slice(0, 6);
    setRecent(next);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  }

  const results = [
    ...(result.data?.businessClasses ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      imageUrl: null,
      badge: "کلاس باشگاه",
      meta: classResultMeta(
        item.price.amount,
        item.startDate,
        item.capacity,
        item.enrollmentCount,
      ),
      href: `/discovery/business-class?classId=${item.id}`,
      comparisonKey: `business-class-${item.id}`,
    })),
    ...(result.data?.clubs ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.address || item.shortDescription,
      imageUrl: item.imageUrl,
      badge: "باشگاه",
      meta: clubResultMeta(
        item.averageRating,
        item.reviewsCount,
        item.location,
        coordinates,
      ),
      href: `/discovery/clubs/${item.slug}`,
      comparisonKey: `club-${item.id}`,
    })),
    ...(result.data?.coaches ?? []).map((item) => ({
      id: item.id,
      title: item.displayName,
      subtitle: item.shortBio,
      imageUrl: item.imageUrl,
      badge: "مربی",
      meta: item.reviewsCount
        ? `${item.averageRating.toLocaleString("fa-IR")} از ۵ · ${item.reviewsCount.toLocaleString("fa-IR")} نظر`
        : "هنوز نظری ثبت نشده",
      href: `/discovery/coaches/${item.slug}`,
      comparisonKey: `coach-${item.id}`,
    })),
    ...(result.data?.classes ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      imageUrl: item.imageUrl,
      badge: "کلاس",
      meta: classResultMeta(
        item.price.amount,
        item.courseStartAt,
        item.capacity,
        item.enrollmentCount,
      ),
      href: `/discovery/classes/${item.slug}`,
      comparisonKey: `class-${item.id}`,
    })),
  ];
  const alternatives = [
    ...(result.data?.alternatives?.clubs ?? []).map((item) => ({
      id: item.id, title: item.name, subtitle: item.address || item.shortDescription,
      imageUrl: item.imageUrl, badge: "باشگاه خارج از محدوده",
      meta: clubResultMeta(item.averageRating, item.reviewsCount, item.location, coordinates),
      href: `/discovery/clubs/${item.slug}`, comparisonKey: `club-${item.id}`,
    })),
    ...(result.data?.alternatives?.classes ?? []).map((item) => ({
      id: item.id, title: item.title, subtitle: item.description, imageUrl: item.imageUrl,
      badge: "کلاس خارج از محدوده", meta: classResultMeta(item.price.amount, item.courseStartAt, item.capacity, item.enrollmentCount),
      href: `/discovery/classes/${item.slug}`, comparisonKey: `class-${item.id}`,
    })),
    ...(result.data?.alternatives?.businessClasses ?? []).map((item) => ({
      id: item.id, title: item.title, subtitle: item.description, imageUrl: null,
      badge: "کلاس باشگاه خارج از محدوده", meta: classResultMeta(item.price.amount, item.startDate, item.capacity, item.enrollmentCount),
      href: `/discovery/business-class?classId=${item.id}`, comparisonKey: `business-class-${item.id}`,
    })),
  ];
  const comparisonItems = [...results, ...alternatives].filter((item) =>
    comparison.includes(item.comparisonKey),
  );
  const topics = keywords.data?.items ?? [];

  return (
    <main className="app-page gap-6 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <SecondaryHeader title="جست‌وجو" showFilter={false} />

      <div className="flex flex-col gap-3" dir="rtl">
        <SearchField
          fullWidth
          value={query}
          onChange={setQuery}
          onSubmit={() => remember()}
          aria-label="جست‌وجو در دیسکاوری"
          className="w-full"
        >
          <SearchField.Group className="flex h-16 w-full items-center gap-3 rounded-[1.35rem] border border-white/10 bg-surface/85 px-4 backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-focus focus-within:ring-3 focus-within:ring-focus/15">
            <SearchField.SearchIcon className="size-6 shrink-0 text-muted" />
            <SearchField.Input
              ref={inputRef}
              aria-label="جست‌وجو در دیسکاوری"
              placeholder={placeholderFor(kind)}
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
            />
            {query ? (
              <SearchField.ClearButton aria-label="پاک کردن جست‌وجو" />
            ) : null}
            <span className="h-7 w-px bg-separator" aria-hidden />
            <Button
              isIconOnly
              variant={showFilters || kind ? "primary" : "ghost"}
              slot={null}
              aria-label="فیلتر نوع نتیجه"
              aria-expanded={showFilters}
              onPress={() => setShowFilters((value) => !value)}
              className="size-10 min-w-10 rounded-xl"
            >
              <Icon name="funnel-1" size={21} />
            </Button>
          </SearchField.Group>
        </SearchField>

        {showFilters ? (
          <div className="app-chip-row app-reveal">
            {kinds.map((item) => (
              <Button
                key={item.label}
                size="sm"
                variant="ghost"
                className={`h-10 shrink-0 rounded-full border px-4 font-bold ${
                  kind === item.value
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface-secondary/70 text-foreground"
                }`}
                onPress={() => setKind(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {!canSearch ? (
        <section className="flex flex-col gap-4" aria-labelledby="topics-title">
          <Typography id="topics-title" type="h5" weight="bold">
            موضوعات
          </Typography>
          {keywords.isLoading ? (
            <div
              className="flex flex-wrap gap-2.5"
              aria-label="در حال دریافت موضوعات"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-32 rounded-full" />
              ))}
            </div>
          ) : topics.length ? (
            <div className="flex flex-wrap gap-2.5">
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  variant="ghost"
                  className="h-12 rounded-full border border-white/10 bg-surface/80 px-4 font-bold text-foreground backdrop-blur-md hover:border-accent/35 hover:bg-accent/8"
                  onPress={() => {
                    setQuery(topic.name);
                    remember(topic.name);
                  }}
                >
                  <span aria-hidden className="text-xl font-medium text-accent">
                    #
                  </span>
                  {topic.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">موضوعی برای نمایش وجود ندارد.</p>
          )}
        </section>
      ) : null}

      {showFilters ? (
        <div className="space-y-3">
          <ActiveLocationSelector
            variant="search"
            onSelect={() => setSharedCoordinates(undefined)}
          />
          {sharedCoordinates ? (
            <Button
              variant="ghost"
              onPress={() => setSharedCoordinates(undefined)}
            >
              استفاده از موقعیت انتخابی من
            </Button>
          ) : null}
          {kind === "class" ? (
            <fieldset className="grid gap-3 rounded-2xl border border-border p-4">
              <legend className="px-2 text-sm font-semibold">
                بودجه و شیوه کلاس
              </legend>
              <p className="text-xs text-muted">
                مبلغ اعلام‌شده کلاس به ریال؛ واحد دوره، بسته یا ماهانه را در
                جزئیات کلاس بررسی کنید.
              </p>
              <label className="grid gap-1 text-sm">
                حداقل بودجه (ریال)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-surface px-3"
                />
              </label>
              <label className="grid gap-1 text-sm">
                حداکثر بودجه (ریال)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-surface px-3"
                />
              </label>
              <label className="grid gap-1 text-sm">
                شیوه برگزاری
                <select
                  value={serviceMode}
                  onChange={(event) => setServiceMode(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-surface px-3"
                >
                  <option value="">همه شیوه‌ها</option>
                  <option value="club">باشگاه</option>
                  <option value="online">آنلاین</option>
                  <option value="home">منزل</option>
                  <option value="outdoor">فضای باز</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                نوع پذیرش
                <select
                  value={admission}
                  onChange={(event) => setAdmission(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-surface px-3"
                >
                  <option value="">همه</option>
                  <option value="automatic">ثبت‌نام فوری</option>
                  <option value="requires_approval">نیازمند تأیید</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                سطح کلاس
                <select
                  value={skillLevelId}
                  onChange={(event) => setSkillLevelId(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-surface px-3"
                >
                  <option value="">همه سطح‌ها</option>
                  {skillLevelId &&
                  !levels.data?.items.some(
                    (item) => item.id === skillLevelId,
                  ) ? (
                    <option value={skillLevelId}>سطح لینک‌شده</option>
                  ) : null}
                  {levels.data?.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                شروع از تاریخ
                <IranDateInput
                  value={startsFrom}
                  onValueChange={setStartsFrom}
                  className="min-h-11 rounded-xl border border-border bg-surface px-3"
                />
              </label>
              <label className="grid gap-1 text-sm">
                شروع تا تاریخ
                <IranDateInput
                  value={startsTo}
                  onValueChange={setStartsTo}
                  min={startsFrom || undefined}
                  className="min-h-11 rounded-xl border border-border bg-surface px-3"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  ساعت شروع از
                  <input type="time" value={timeFrom} onChange={(event) => setTimeFrom(event.target.value)} className="min-h-11 rounded-xl border border-border bg-surface px-3" />
                </label>
                <label className="grid gap-1 text-sm">
                  ساعت شروع تا
                  <input type="time" value={timeTo} min={timeFrom || undefined} onChange={(event) => setTimeTo(event.target.value)} className="min-h-11 rounded-xl border border-border bg-surface px-3" />
                </label>
              </div>
            </fieldset>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              isDisabled={deferredQuery !== query.trim()}
              onPress={() => void shareSearch()}
            >
              کپی لینک جست‌وجو
            </Button>
            <Button
              variant="ghost"
              onPress={() => {
                setKind(undefined);
                setMinPrice("");
                setMaxPrice("");
                setServiceMode("");
                setAdmission("");
                setStartsFrom("");
                setStartsTo("");
                setTimeFrom("");
                setTimeTo("");
                setSkillLevelId("");
                setSort("suggested");
                setNearby(false);
                setSharedCoordinates(undefined);
                setShareMessage("");
              }}
            >
              پاک‌کردن فیلترها
            </Button>
          </div>
          <p className="text-xs text-muted">
            لینک، عبارت و فیلترها را حفظ می‌کند؛ در جست‌وجوی نزدیک، مختصات
            محدوده هم در لینک قرار می‌گیرد.
          </p>
          {shareMessage ? (
            <p role="status" className="text-sm">
              {shareMessage}
            </p>
          ) : null}
          {coordinates ? (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={nearby}
                onChange={(event) => setNearby(event.target.checked)}
              />
              باشگاه‌ها و کلاس باشگاه در شعاع ۲۵ کیلومتر
            </label>
          ) : null}
        </div>
      ) : null}

      {!canSearch ? (
        <section className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <Typography type="h5" weight="bold">
              جست‌وجوهای اخیر
            </Typography>
            {recent.length ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-3 font-semibold text-accent"
                onPress={() => {
                  setRecent([]);
                  window.localStorage.removeItem(RECENT_SEARCHES_KEY);
                }}
              >
                پاک کردن
              </Button>
            ) : null}
          </div>
          {recent.length ? (
            <div>
              {recent.map((item) => (
                <button
                  type="button"
                  key={`${item.kind ?? "all"}-${item.query}`}
                  onClick={() => {
                    setKind(item.kind);
                    setQuery(item.query);
                  }}
                  className="flex min-h-16 w-full items-center gap-4 border-b border-separator text-start last:border-b-0"
                >
                  <Icon
                    name="clock"
                    size={24}
                    className="shrink-0 text-muted"
                  />
                  <span className="min-w-0 flex-1 truncate text-base text-foreground">
                    {item.query}
                  </span>
                  <Icon
                    name="arrow-up-left-circle"
                    size={24}
                    className="shrink-0 text-muted"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              هنوز جست‌وجویی انجام نداده‌اید.
            </p>
          )}
        </section>
      ) : budgetError ? (
        <p role="alert" className="text-sm text-danger">
          {budgetError}
        </p>
      ) : (
        <section className="flex flex-col gap-3 pt-1">
          <div className="flex min-h-10 items-center justify-between gap-3">
            {result.isLoading && !failure ? (
              <Skeleton
                className="h-4 w-24 rounded-lg"
                aria-label="در حال جست‌وجو"
              />
            ) : (
              <p className="text-sm text-muted">
                {failure
                  ? "جست‌وجو انجام نشد"
                  : `${(result.data?.total ?? 0).toLocaleString("fa-IR")} نتیجه`}
              </p>
            )}
            {!failure ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 min-h-10 gap-2 px-2 font-bold text-muted"
                onPress={() => setSortOpen(true)}
              >
                {searchSortOptions.find((option) => option.value === sort)
                  ?.label ?? "پیشنهادی"}
                <Icon
                  name="sort-descending"
                  size={18}
                  className="text-accent"
                />
              </Button>
            ) : null}
          </div>
          {!failure
            ? results.map((item) => (
                <div
                  key={`${item.badge}-${item.id}`}
                  onClick={() => remember()}
                >
                  <DiscoveryResultCard {...item} />
                  <Button
                    size="sm"
                    variant={comparison.includes(item.comparisonKey) ? "primary" : "secondary"}
                    className="mt-2"
                    onPress={() => setComparison((current) => current.includes(item.comparisonKey)
                      ? current.filter((key) => key !== item.comparisonKey)
                      : current.length < 3 ? [...current, item.comparisonKey] : current)}
                  >
                    {comparison.includes(item.comparisonKey) ? "حذف از مقایسه" : comparison.length >= 3 ? "حداکثر ۳ گزینه" : "افزودن به مقایسه"}
                  </Button>
                </div>
              ))
            : null}
          {result.isLoading && !failure ? (
            <DiscoveryResultCardSkeleton count={4} />
          ) : null}
          {failure ? (
            <RequestFailureState
              error={failure}
              onRetry={() => void result.refetch()}
            />
          ) : null}
          {!result.isLoading && !failure && results.length === 0 ? (
            <div className="py-14 text-center">
              <Icon
                name="file-magnifying-glass"
                size={36}
                className="text-muted"
              />
              <p className="mt-3 text-sm text-muted">نتیجه‌ای پیدا نشد.</p>
              {alternatives.length ? (
                <div className="mt-6 space-y-3 text-start">
                  <p className="text-sm font-semibold">گزینه‌های مرتبط بیرون از محدوده انتخابی</p>
                  {alternatives.map((item) => <DiscoveryResultCard key={item.comparisonKey} {...item} />)}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      )}

      {canSearch && !failure ? (
        <DiscoveryPagination
          page={page}
          total={result.data?.totalPages ?? 0}
          limit={1}
          pending={result.isFetching}
          onChange={(value) => setPagination({ scope, page: value })}
        />
      ) : null}
      <SortBottomSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        value={sort}
        onApply={setSort}
        title="مرتب‌سازی نتایج جست‌وجو"
        description="نتیجه‌ها را با ترتیبی که برایتان مهم‌تر است نمایش دهید."
        options={searchSortOptions}
      />
      {comparisonItems.length ? (
        <aside className="sticky bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30 rounded-2xl border border-accent/30 bg-surface/95 p-4 shadow-xl backdrop-blur" aria-label="مقایسه گزینه‌ها">
          <div className="flex items-center justify-between gap-3">
            <strong>مقایسه {comparisonItems.length.toLocaleString("fa-IR")} گزینه</strong>
            <Button size="sm" variant="ghost" onPress={() => setComparison([])}>پاک‌کردن</Button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {comparisonItems.map((item) => (
              <div key={item.comparisonKey} className="rounded-xl bg-surface-secondary p-3">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{item.badge}</p>
                <p className="mt-2 text-sm">{item.meta}</p>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </main>
  );
}

function classResultMeta(
  amount: number,
  startsAt: string,
  capacity: number,
  enrollmentCount: number,
) {
  const remaining = Math.max(0, capacity - enrollmentCount);
  return `${amount.toLocaleString("fa-IR")} ریال · ${new Date(startsAt).toLocaleDateString("fa-IR")} · ${remaining ? `${remaining.toLocaleString("fa-IR")} ظرفیت` : "تکمیل ظرفیت"}`;
}

function clubResultMeta(
  rating: number,
  reviews: number,
  location: { type: "Point"; coordinates: [number, number] } | null | undefined,
  origin: { latitude: number; longitude: number } | null | undefined,
) {
  const parts = [
    reviews
      ? `${rating.toLocaleString("fa-IR")} از ۵ · ${reviews.toLocaleString("fa-IR")} نظر`
      : "هنوز نظری ثبت نشده",
  ];
  if (origin && location?.coordinates?.length === 2) {
    const [longitude, latitude] = location.coordinates;
    const distance = distanceKm(
      origin.latitude,
      origin.longitude,
      latitude,
      longitude,
    );
    parts.push(
      `${distance < 10 ? distance.toLocaleString("fa-IR", { maximumFractionDigits: 1 }) : Math.round(distance).toLocaleString("fa-IR")} کیلومتر`,
    );
  }
  return parts.join(" · ");
}

function distanceKm(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
) {
  const radians = (degree: number) => (degree * Math.PI) / 180;
  const latitude = radians(toLat - fromLat);
  const longitude = radians(toLon - fromLon);
  const value =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(radians(fromLat)) *
      Math.cos(radians(toLat)) *
      Math.sin(longitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function placeholderFor(kind?: PublicCatalogSearchKind) {
  if (kind === "club") return "جست‌وجوی باشگاه...";
  if (kind === "coach") return "جست‌وجوی مربی...";
  if (kind === "class") return "جست‌وجوی کلاس...";
  return "جست‌وجوی باشگاه، مربی یا کلاس...";
}

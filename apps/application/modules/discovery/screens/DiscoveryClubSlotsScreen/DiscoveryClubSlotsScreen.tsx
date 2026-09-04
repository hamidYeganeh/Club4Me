"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Button,
  Label,
  Radio,
  RadioGroup,
  ScrollShadow,
  Spinner,
  Tabs,
  Typography,
  toast,
} from "@heroui/react";
import {
  tokenStore,
  usePublicClub,
  useReservableSessions,
  useReserveSession,
  useResolveMockClubPayment,
  type ReservableSession,
} from "@api";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import NumberFlow from "@number-flow/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";

import { discoveryClubSlotsScreenStyles } from "./DiscoveryClubSlotsScreen.styles";
import type { DiscoveryClubSlotsScreenProps } from "./DiscoveryClubSlotsScreen.types";

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

export function DiscoveryClubSlotsScreen({
  clubId,
}: DiscoveryClubSlotsScreenProps) {
  const router = useRouter();
  const t = useTranslations("discovery.clubSlots");
  const tDetail = useTranslations("discovery.clubDetail");
  const styles = discoveryClubSlotsScreenStyles();
  const isPersistedClub = /^[a-f\d]{24}$/i.test(clubId);
  const rootRef = useRef<HTMLElement>(null);

  const publicClub = usePublicClub(clubId);
  const sessionsQuery = useReservableSessions(clubId);
  const reserve = useReserveSession();
  const resolvePayment = useResolveMockClubPayment();

  const [courtKey, setCourtKey] = useState<string>("");
  const [dateKey, setDateKey] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [pendingPayment, setPendingPayment] = useState<{
    id: string;
    title: string;
    amount: number;
  } | null>(null);

  const dateWindow = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    end.setHours(23, 59, 59, 999);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }, []);

  const sessions = useMemo(
    () =>
      (sessionsQuery.data?.items ?? []).filter(
        (item) => {
          if (item.status !== "active") return false;
          const startsAtMs = new Date(item.startsAt).getTime();
          return (
            startsAtMs >= dateWindow.startMs && startsAtMs <= dateWindow.endMs
          );
        },
      ),
    [dateWindow.endMs, dateWindow.startMs, sessionsQuery.data?.items],
  );

  const courts = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of sessions) {
      const key = session.courtId ?? `session:${session.id}`;
      if (!map.has(key)) {
        map.set(key, session.title);
      }
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [sessions]);

  const selectedCourtKey = courts.some((court) => court.id === courtKey)
    ? courtKey
    : (courts[0]?.id ?? "");

  const courtSessions = useMemo(() => {
    if (!selectedCourtKey) return sessions;
    return sessions.filter((session) => {
      const key = session.courtId ?? `session:${session.id}`;
      return key === selectedCourtKey;
    });
  }, [selectedCourtKey, sessions]);

  const dates = useMemo(() => {
    const start = new Date(dateWindow.startMs);
    return Array.from({ length: 15 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const id = toDateKey(date);
      const hasSlots = courtSessions.some(
        (session) => toDateKey(session.startsAt) === id,
      );
      return {
        id,
        hasSlots,
        day: new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(date),
        weekday: new Intl.DateTimeFormat("fa-IR", { weekday: "short" }).format(
          date,
        ),
      };
    });
  }, [courtSessions, dateWindow.startMs]);

  const selectedDateKey = dates.some((date) => date.id === dateKey)
    ? dateKey
    : (dates[0]?.id ?? "");

  const timeSlots = useMemo(
    () =>
      courtSessions
        .filter((session) => toDateKey(session.startsAt) === selectedDateKey)
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [courtSessions, selectedDateKey],
  );

  const selectedSessionId = timeSlots.some((slot) => slot.id === sessionId)
    ? sessionId
    : (timeSlots[0]?.id ?? "");

  const selectedSession: ReservableSession | undefined = timeSlots.find(
    (session) => session.id === selectedSessionId,
  );
  const reserveButtonSize = "lg" as const;
  const isReserveButtonLarge = reserveButtonSize === "lg";

  const coverUrl = useMemo(() => {
    const gallery = publicClub.data?.gallery ?? [];
    const coverMediaId = publicClub.data?.coverMediaId;
    const coverMatch = coverMediaId
      ? gallery.find((item) => item.mediaId === coverMediaId)
      : undefined;
    const firstImage = gallery.find((item) =>
      item.mimeType.startsWith("image/"),
    );
    return coverMatch?.url ?? firstImage?.url;
  }, [publicClub.data?.coverMediaId, publicClub.data?.gallery]);

  const ready =
    isPersistedClub &&
    !publicClub.isPending &&
    !sessionsQuery.isPending &&
    !publicClub.isError &&
    Boolean(publicClub.data);

  useGSAP(
    () => {
      if (!ready || !rootRef.current) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) return;

      const ctx = gsap.context(() => {
        const cover = rootRef.current?.querySelector("[data-slots-cover]");
        const titleBits = rootRef.current?.querySelectorAll(
          "[data-slots-title] > *",
        );
        const chips = rootRef.current?.querySelectorAll("[data-slots-chip]");
        const panel = rootRef.current?.querySelector("[data-slots-panel]");
        const sections = rootRef.current?.querySelectorAll(
          "[data-slots-section]",
        );

        if (cover) {
          gsap.fromTo(
            cover,
            { scale: 1.18, opacity: 0.55 },
            { scale: 1, opacity: 1, duration: 1.45, ease: "power3.out" },
          );
        }

        if (titleBits?.length) {
          gsap.fromTo(
            titleBits,
            { autoAlpha: 0, y: 28, filter: "blur(8px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.7,
              stagger: 0.1,
              ease: "power3.out",
              delay: 0.15,
            },
          );
        }

        if (chips?.length) {
          gsap.fromTo(
            chips,
            { autoAlpha: 0, y: 18, scale: 0.92 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.45,
              stagger: 0.06,
              ease: "power2.out",
              delay: 0.35,
            },
          );
        }

        if (panel) {
          gsap.fromTo(
            panel,
            { y: 64, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.75,
              ease: "power3.out",
              delay: 0.28,
            },
          );
        }

        if (sections?.length) {
          gsap.fromTo(
            sections,
            { autoAlpha: 0, y: 16 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: "power2.out",
              delay: 0.48,
            },
          );
        }
      }, rootRef);

      return () => ctx.revert();
    },
    { dependencies: [ready, clubId], revertOnUpdate: true },
  );

  const book = async () => {
    if (!selectedSession) return;
    if (!tokenStore.get()) {
      router.push("/auth");
      return;
    }
    try {
      const result = await reserve.mutateAsync({
        sessionId: selectedSession.id,
        participantCount: 1,
      });
      if (result.paymentStatus === "pending") {
        setPendingPayment({
          id: result.id,
          title: result.sessionTitle,
          amount: result.totalPrice,
        });
      } else {
        toast.success(t("reserved"));
      }
    } catch {
      toast.danger(t("reserveError"));
    }
  };

  const finishPayment = async (result: "approve" | "reject") => {
    if (!pendingPayment) return;
    try {
      await resolvePayment.mutateAsync({
        reservationId: pendingPayment.id,
        result,
      });
      if (result === "approve") {
        toast.success(t("paymentApproved"));
      } else {
        toast.danger(t("paymentRejected"));
      }
      setPendingPayment(null);
    } catch {
      toast.danger(t("paymentError"));
    }
  };

  if (!isPersistedClub || publicClub.isError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-center text-muted">
        {tDetail("notFound")}
      </main>
    );
  }

  if (publicClub.isPending || sessionsQuery.isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner />
      </main>
    );
  }

  const clubName = publicClub.data?.name ?? "";

  return (
    <main ref={rootRef} className={styles.root()}>
      {pendingPayment ? (
        <MockPaymentGateway
          title={pendingPayment.title}
          amount={pendingPayment.amount}
          isPending={resolvePayment.isPending}
          onResult={(result) => void finishPayment(result)}
        />
      ) : null}

      <div className={styles.coverWrap()}>
        {coverUrl ? (
          <div
            data-slots-cover
            className={styles.cover()}
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        ) : (
          <div data-slots-cover className={styles.coverFallback()}>
            <Icon name="tennis" size={56} />
          </div>
        )}
      </div>
      <div aria-hidden className={styles.overlay()} />
      <div aria-hidden className={styles.grain()} />
      <div aria-hidden className={styles.accentOrb()} />

      <section className={styles.hero()} aria-labelledby="club-slots-title">
        <div className={styles.topBar()}>
          <Button
            isIconOnly
            aria-label={tDetail("back")}
            variant="secondary"
            size="lg"
            className={styles.backButton()}
            onPress={() => router.back()}
          >
            <Icon name="chevron-right" size="lg" />
          </Button>

          <ThemeToggle className={styles.themeButton()} />
        </div>

        <div data-slots-title className={styles.heroCopy()}>
          <p className={styles.heroEyebrow()}>{t("eyebrow")}</p>
          <h1 id="club-slots-title" className={styles.heroTitle()}>
            {t("title")}
          </h1>
          <p className={styles.heroSubtitle()}>{clubName}</p>
        </div>

        {courts.length > 0 ? (
          <div className={styles.chipRow()}>
            <ScrollShadow
              orientation="horizontal"
              hideScrollBar
              className={styles.chipScroller()}
            >
              <div className={styles.chipContent()}>
                {courts.map((court) => {
                  const selected = court.id === selectedCourtKey;
                  return (
                    <Button
                      key={court.id}
                      data-slots-chip
                      variant={selected ? "primary" : "secondary"}
                      size="md"
                      className={cn(
                        styles.chipButton(),
                        selected ? styles.chipActive() : styles.chipIdle(),
                      )}
                      aria-pressed={selected}
                      onPress={() => setCourtKey(court.id)}
                    >
                      {court.label}
                    </Button>
                  );
                })}
              </div>
            </ScrollShadow>
          </div>
        ) : null}

      </section>

      <section data-slots-panel className={styles.panel()}>
        {sessions.length === 0 ? (
          <div className={styles.empty()}>
            <Image
              src="/discovery/no-slots.png"
              alt={t("emptyIllustrationAlt")}
              width={320}
              height={320}
              className={styles.emptyImage()}
              priority
            />
            <Typography type="body-sm" className={styles.emptyText()}>
              {t("noSessions")}
            </Typography>
          </div>
        ) : (
          <div className={styles.panelBody()}>
            <div className={styles.panelContent()}>
              <div data-slots-section className={styles.section()}>
                <Label className={styles.sectionLabel()}>
                  <span className={styles.sectionIcon()}>
                    <Icon name="calendar-1" size={14} />
                  </span>
                  {t("selectDate")}
                </Label>
                <ScrollShadow
                  orientation="horizontal"
                  hideScrollBar
                  className={styles.radioRow()}
                >
                  <Tabs
                    selectedKey={selectedDateKey}
                    onSelectionChange={(key) => setDateKey(String(key))}
                    className={styles.dateTabs()}
                  >
                    <Tabs.ListContainer className={styles.dateTabsListContainer()}>
                      <Tabs.List
                        aria-label={t("selectDate")}
                        className={styles.dateTabsList()}
                      >
                        {dates.map((date) => (
                          <Tabs.Tab
                            key={date.id}
                            id={date.id}
                            className={styles.dateTab()}
                          >
                            <span className={styles.dateDay()}>{date.day}</span>
                            <span className={styles.dateWeekday()}>
                              {date.weekday}
                            </span>
                            <Tabs.Indicator className={styles.dateTabIndicator()} />
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>
                    </Tabs.ListContainer>
                  </Tabs>
                </ScrollShadow>
              </div>

              <div data-slots-section className={styles.section()}>
                <Label className={styles.sectionLabel()}>
                  <span className={styles.sectionIcon()}>
                    <Icon name="clock" size={14} />
                  </span>
                  {t("selectTime")}
                </Label>
                <div className={styles.timeArea()}>
                  {timeSlots.length === 0 ? (
                    <div className={styles.timeEmpty()}>
                      <Image
                        src="/discovery/no-slots.png"
                        alt={t("emptyIllustrationAlt")}
                        width={128}
                        height={128}
                        className={styles.timeEmptyImage()}
                      />
                      <span>{t("noTimes")}</span>
                    </div>
                  ) : (
                    <ScrollShadow
                      orientation="horizontal"
                      hideScrollBar
                      className={styles.timeScroller()}
                    >
                      <RadioGroup
                        aria-label={t("selectTime")}
                        name="reservation-time"
                        orientation="horizontal"
                        value={selectedSessionId}
                        onChange={setSessionId}
                        className={styles.radioGroup()}
                      >
                        {timeSlots.map((slot) => (
                          <Radio
                            key={slot.id}
                            value={slot.id}
                            className={styles.timeRadio()}
                            isDisabled={slot.reservedCount >= slot.capacity}
                          >
                            {({ isSelected }) => (
                              <Radio.Content
                                dir="ltr"
                                className={cn(
                                  styles.timeContent(),
                                  isSelected && styles.timeContentSelected(),
                                )}
                              >
                                <Radio.Control className={styles.controlHidden()}>
                                  <Radio.Indicator />
                                </Radio.Control>
                                {formatTimeRange(slot.startsAt, slot.endsAt)}
                              </Radio.Content>
                            )}
                          </Radio>
                        ))}
                      </RadioGroup>
                    </ScrollShadow>
                  )}
                </div>
              </div>
            </div>

            <div
              data-slots-section
              className={cn(
                styles.footer(),
                isReserveButtonLarge && styles.footerSticky(),
              )}
            >
              <div>
                <p className={styles.priceLabel()}>{t("price")}</p>
                <p className={styles.priceValue()}>
                  {selectedSession ? (
                    <>
                      <NumberFlow
                        value={selectedSession.basePrice}
                        locales="fa-IR"
                        format={{ useGrouping: true }}
                        className="inline-block min-w-[3ch]"
                      />
                      <span className="ms-1 text-base font-bold text-muted">
                        ریال
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <Button
                variant="primary"
                size={reserveButtonSize}
                className={styles.bookButton()}
                isPending={reserve.isPending}
                isDisabled={!selectedSession}
                onPress={() => void book()}
              >
                {t("bookNow")}
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

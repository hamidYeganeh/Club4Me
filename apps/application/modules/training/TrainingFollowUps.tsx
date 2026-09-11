"use client";

import { Button, Card, TextArea } from "@heroui/react";
import { useState } from "react";
import Link from "@/components/app-link";
import {
  trainingApi,
  type SessionRecord,
  type TrainingFollowUp,
} from "@api/domains/training";
import {
  date,
  errorText,
  fieldClass,
  LoadState,
  Notice,
  useTrainingData,
} from "./shared";

export function TrainingFollowUps({
  onSelect,
}: {
  onSelect?: (item: TrainingFollowUp) => void;
}) {
  const query = useTrainingData("coach-follow-ups", trainingApi.followUps);
  const items = query.data?.items ?? [];
  return (
    <section
      id="follow-ups"
      className="scroll-mt-24 space-y-3 rounded-3xl border border-border bg-surface p-5"
      aria-label="پیگیری شاگردان"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">پیگیری شاگردان</h2>
        <Button size="sm" variant="ghost" onPress={query.reload}>
          به‌روزرسانی
        </Button>
      </div>
      <p className="text-sm leading-7 text-muted">
        درخواست‌های شاگرد و تمرین‌های منتظر بازخورد؛ نبود ثبت تمرین به معنی غیبت
        نیست.
      </p>
      <LoadState {...query} />
      {!query.loading && !query.error && !items.length && (
        <p className="text-sm text-muted">
          در حال حاضر موردی برای پیگیری نیست.
        </p>
      )}
      {(onSelect ? items : items.slice(0, 3)).map((item) => (
        <div
          key={`${item.athleteId}:${item.assignmentId}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-secondary p-4"
        >
          <div className="min-w-0">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="mt-1 text-xs leading-6 text-muted">{item.label}</p>
          </div>
          {onSelect ? (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onSelect(item)}
            >
              {item.assignmentId ? "بررسی برنامه و نتایج" : "انتخاب برنامه"}
            </Button>
          ) : (
            <Link
              className="inline-flex min-h-11 items-center text-sm font-bold text-accent"
              href={`/coach/training?${item.assignmentId ? `assignment=${item.assignmentId}` : `athlete=${item.athleteId}`}`}
            >
              پیگیری ←
            </Link>
          )}
        </div>
      ))}
      {!onSelect && items.length > 3 && (
        <Link
          className="inline-flex min-h-11 items-center text-sm text-accent"
          href="/coach/training#follow-ups"
        >
          همه موارد پیگیری ({items.length.toLocaleString("fa-IR")}) ←
        </Link>
      )}
    </section>
  );
}

export function SessionReview({
  session,
  assignmentId,
  onSaved,
}: {
  session: SessionRecord;
  assignmentId?: string;
  onSaved?: () => void;
}) {
  const [text, setText] = useState(session.coachReview?.text ?? "");
  const [review, setReview] = useState(session.coachReview);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const displayReview = assignmentId ? review : session.coachReview;
  const effort = { easy: "آسان", balanced: "متعادل", hard: "سخت" };
  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {session.effort && (
        <p className="text-sm">تجربه ورزشکار: {effort[session.effort]}</p>
      )}
      {session.followUpRequested && (
        <p className="text-sm text-accent">درخواست پیگیری مربی</p>
      )}
      {displayReview && (
        <Card className="bg-surface-secondary p-4">
          <p className="text-xs text-muted">
            بازخورد مربی · {date(displayReview.reviewedAt)}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
            {displayReview.text}
          </p>
        </Card>
      )}
      {assignmentId && session.status === "completed" && (
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage("");
            try {
              const saved = await trainingApi.review(
                assignmentId,
                session.clientId,
                text,
                review?.revision ?? 0,
              );
              setReview(saved.coachReview);
              setMessage("بازخورد برای ورزشکار ذخیره شد.");
              onSaved?.();
            } catch (error) {
              setMessage(errorText(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm">
            بازخورد همین جلسه
            <TextArea
              aria-label="بازخورد همین جلسه"
              required
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={fieldClass}
              disabled={busy}
            />
          </label>
          <Button
            type="submit"
            variant="secondary"
            isPending={busy}
            isDisabled={!text.trim()}
          >
            ذخیره بازخورد
          </Button>
        </form>
      )}
      {message && <Notice>{message}</Notice>}
    </div>
  );
}

export function AthleteCoachFeedback() {
  const query = useTrainingData("sessions", trainingApi.sessions, true);
  const latest = query.data?.items
    .filter((session) => session.coachReview)
    .sort((a, b) =>
      b.coachReview!.reviewedAt.localeCompare(a.coachReview!.reviewedAt),
    )[0];
  if (!latest && !query.error) return null;
  return (
    <section
      className="space-y-3 rounded-3xl border border-accent/20 bg-surface p-5"
      aria-label="آخرین بازخورد مربی"
    >
      <h2 className="text-lg font-bold">آخرین بازخورد مربی</h2>
      {query.error ? (
        <div role="alert">
          <p className="text-sm text-muted">دریافت بازخورد انجام نشد.</p>
          <Button variant="ghost" onPress={query.reload}>
            تلاش دوباره
          </Button>
        </div>
      ) : (
        latest && (
          <>
            <p className="text-xs text-muted">
              {latest.snapshot.title} · {date(latest.coachReview!.reviewedAt)}
              {query.stale ? " · نسخه ذخیره‌شده روی دستگاه" : ""}
            </p>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-7">
              {latest.coachReview!.text}
            </p>
          </>
        )
      )}
      <Link
        href="/athlete/training/progress"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
      >
        مشاهده تمرین‌ها و بازخوردها ←
      </Link>
    </section>
  );
}

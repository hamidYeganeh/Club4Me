"use client";
import { useRef, useState } from "react";
import { Button, Card } from "@heroui/react";
import { IranDateInput } from "@repo/ui/iran-date-input";
import { tehranLocalDate } from "@repo/ui/iran-date";
import {
  trainingApi,
  type PlanRecord,
  type TrainingPlan,
  type SessionRecord,
} from "@api/domains/training";
import {
  date,
  errorText,
  fieldClass,
  LoadState,
  Notice,
  number,
  TrainingFrame,
  TrainingSummary,
  useIdentity,
  useTrainingData,
  weekdays,
} from "./shared";

const emptyPlan = (): TrainingPlan => ({
  title: "",
  description: "",
  days: [
    {
      id: crypto.randomUUID(),
      title: "جلسه اول",
      weekday: 0,
      exercises: [
        {
          exerciseId: "squat",
          sets: 3,
          reps: 10,
          weight: 0,
          restSeconds: 60,
          note: "",
        },
      ],
    },
  ],
});
const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export function CoachTraining() {
  const identity = useIdentity();
  return <CoachTrainingSession key={identity} />;
}
function CoachTrainingSession() {
  const plans = useTrainingData("coach-plans", trainingApi.plans);
  const clients = useTrainingData("coach-clients", trainingApi.clients);
  const assignments = useTrainingData(
    "coach-assignments",
    trainingApi.coachAssignments,
  );
  const exercises = useTrainingData("exercises", trainingApi.exercises, true);
  const [draft, setDraft] = useState<TrainingPlan | null>(null);
  const [selected, setSelected] = useState<{
    id: string;
    version: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [assignmentPlan, setAssignmentPlan] = useState("");
  const [version, setVersion] = useState(1);
  const [recipient, setRecipient] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [results, setResults] = useState<{
    title: string;
    sessions: SessionRecord[];
  } | null>(null);
  const planMutation = useRef<string | null>(null);
  const assignMutation = useRef<string | null>(null);
  const edit = (value: TrainingPlan) => {
    setDraft(value);
    planMutation.current = null;
  };
  const open = (record?: PlanRecord) => {
    if (draft && !window.confirm("ویرایش ذخیره‌نشده کنار گذاشته شود؟")) return;
    setSelected(
      record
        ? { id: record.id, version: record.version }
        : { id: newId(), version: 0 },
    );
    setDraft(
      record
        ? structuredClone(record.versions[record.versions.length - 1]!.plan)
        : emptyPlan(),
    );
    planMutation.current = null;
    setMessage("");
  };
  const save = async () => {
    if (!draft || !selected) return;
    setBusy(true);
    setMessage("");
    planMutation.current ??= crypto.randomUUID();
    try {
      const saved = await trainingApi.savePlan(
        selected.id,
        selected.version,
        draft,
        planMutation.current,
      );
      setSelected({ id: saved.id, version: saved.version });
      setDraft(null);
      planMutation.current = null;
      plans.reload();
      setAssignmentPlan(saved.id);
      setVersion(saved.version);
      setMessage(
        "نسخه برنامه ذخیره شد. برنامه‌های ارسال‌شده قبلی تغییری نمی‌کنند.",
      );
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const send = async () => {
    const [kind, recipientId] = recipient.split(":");
    if (!assignmentPlan || !recipientId || !starts || !ends) {
      setMessage("برنامه، دریافت‌کننده و بازه تاریخ را کامل کن.");
      return;
    }
    setBusy(true);
    setMessage("");
    assignMutation.current ??= crypto.randomUUID();
    try {
      await trainingApi.assign({
        planId: assignmentPlan,
        version,
        recipient: kind === "class" ? "class" : "athlete",
        recipientId,
        startsAt: tehranLocalDate(`${starts}T00:00:00`).toISOString(),
        endsAt: tehranLocalDate(`${ends}T23:59:59`).toISOString(),
        mutationId: assignMutation.current,
      });
      assignMutation.current = null;
      assignments.reload();
      setMessage(
        "برنامه ارسال شد؛ مشاهده نتایج پس از پذیرش ورزشکار فعال می‌شود.",
      );
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const currentPlan = plans.data?.items.find((p) => p.id === assignmentPlan);
  return (
    <TrainingFrame title="برنامه‌های شاگردان" coach>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">
          برنامه بساز، یک نسخه مشخص بفرست و نتیجه تمرین را ببین.
        </p>
        <Button isDisabled={busy} onPress={() => open()}>
          برنامه جدید
        </Button>
      </div>
      {message && <Notice>{message}</Notice>}
      <LoadState {...plans} />
      {draft && selected && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        >
          <div>
            <p className="text-xs text-muted">
              {selected.version
                ? `ویرایش نسخه ${number(selected.version)} ← ذخیره به‌عنوان نسخه جدید`
                : "برنامه تازه"}
            </p>
            <h2 className="text-xl font-semibold">برنامه‌ساز</h2>
          </div>
          <fieldset disabled={busy} className="space-y-4">
            <label className="block">
              نام برنامه
              <input
                required
                maxLength={140}
                className={fieldClass}
                value={draft.title}
                onChange={(e) => edit({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="block">
              توضیحات
              <textarea
                maxLength={2000}
                className={fieldClass}
                value={draft.description}
                onChange={(e) =>
                  edit({ ...draft, description: e.target.value })
                }
              />
            </label>
            {draft.days.map((day, dayIndex) => (
              <section
                key={day.id}
                className="space-y-4 rounded-xl border border-border p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <label>
                    نام جلسه
                    <input
                      required
                      maxLength={100}
                      className={fieldClass}
                      value={day.title}
                      onChange={(e) =>
                        edit({
                          ...draft,
                          days: draft.days.map((d, i) =>
                            i === dayIndex
                              ? { ...d, title: e.target.value }
                              : d,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    روز هفته
                    <select
                      className={fieldClass}
                      value={day.weekday}
                      onChange={(e) =>
                        edit({
                          ...draft,
                          days: draft.days.map((d, i) =>
                            i === dayIndex
                              ? { ...d, weekday: Number(e.target.value) }
                              : d,
                          ),
                        })
                      }
                    >
                      {weekdays.map((w, i) => (
                        <option
                          key={w}
                          value={i}
                          disabled={draft.days.some(
                            (d) => d.id !== day.id && d.weekday === i,
                          )}
                        >
                          {w}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    className="self-end"
                    variant="tertiary"
                    isDisabled={draft.days.length === 1}
                    onPress={() =>
                      edit({
                        ...draft,
                        days: draft.days.filter((d) => d.id !== day.id),
                      })
                    }
                  >
                    حذف روز
                  </Button>
                </div>
                {day.exercises.map((exercise, exerciseIndex) => {
                  const change = (patch: Partial<typeof exercise>) =>
                    edit({
                      ...draft,
                      days: draft.days.map((d, i) =>
                        i === dayIndex
                          ? {
                              ...d,
                              exercises: d.exercises.map((x, j) =>
                                j === exerciseIndex ? { ...x, ...patch } : x,
                              ),
                            }
                          : d,
                      ),
                    });
                  return (
                    <div
                      key={exerciseIndex}
                      className="space-y-3 border-t border-border pt-4"
                    >
                      <div className="flex items-center gap-2">
                        <label className="flex-1">
                          حرکت {number(exerciseIndex + 1)}
                          <select
                            className={fieldClass}
                            value={exercise.exerciseId}
                            onChange={(e) =>
                              change({ exerciseId: e.target.value })
                            }
                          >
                            {exercises.data?.items.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.name} · {e.equipment}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button
                          variant="tertiary"
                          className="self-end"
                          isDisabled={day.exercises.length === 1}
                          onPress={() =>
                            edit({
                              ...draft,
                              days: draft.days.map((d, i) =>
                                i === dayIndex
                                  ? {
                                      ...d,
                                      exercises: d.exercises.filter(
                                        (_, j) => j !== exerciseIndex,
                                      ),
                                    }
                                  : d,
                              ),
                            })
                          }
                        >
                          حذف حرکت
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(
                          [
                            ["sets", "ست", 1, 20],
                            ["reps", "تکرار", 1, 100],
                            ["weight", "وزنه · کیلوگرم", 0, 1000],
                            ["restSeconds", "استراحت · ثانیه", 0, 600],
                          ] as const
                        ).map(([key, label, min, max]) => (
                          <label key={key} className="text-sm">
                            {label}
                            <input
                              className={fieldClass}
                              type="number"
                              required
                              min={min}
                              max={max}
                              step={key === "weight" ? 0.5 : 1}
                              value={exercise[key]}
                              onChange={(e) =>
                                change({ [key]: Number(e.target.value) })
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="block text-sm">
                        نکته مربی
                        <input
                          maxLength={1000}
                          className={fieldClass}
                          value={exercise.note}
                          onChange={(e) => change({ note: e.target.value })}
                        />
                      </label>
                    </div>
                  );
                })}
                <Button
                  variant="secondary"
                  isDisabled={day.exercises.length >= 30 || !exercises.data}
                  onPress={() =>
                    edit({
                      ...draft,
                      days: draft.days.map((d, i) =>
                        i === dayIndex
                          ? {
                              ...d,
                              exercises: [
                                ...d.exercises,
                                {
                                  exerciseId: "squat",
                                  sets: 3,
                                  reps: 10,
                                  weight: 0,
                                  restSeconds: 60,
                                  note: "",
                                },
                              ],
                            }
                          : d,
                      ),
                    })
                  }
                >
                  افزودن حرکت
                </Button>
              </section>
            ))}
            <Button
              variant="secondary"
              isDisabled={draft.days.length >= 7}
              onPress={() =>
                edit({
                  ...draft,
                  days: [
                    ...draft.days,
                    {
                      id: crypto.randomUUID(),
                      title: `جلسه ${number(draft.days.length + 1)}`,
                      weekday: weekdays.findIndex(
                        (_, i) => !draft.days.some((d) => d.weekday === i),
                      ),
                      exercises: [
                        {
                          exerciseId: "squat",
                          sets: 3,
                          reps: 10,
                          weight: 0,
                          restSeconds: 60,
                          note: "",
                        },
                      ],
                    },
                  ],
                })
              }
            >
              افزودن روز
            </Button>
          </fieldset>
          <div className="flex gap-3">
            <Button type="submit" isPending={busy} isDisabled={!exercises.data}>
              ذخیره نسخه برنامه
            </Button>
            <Button
              variant="tertiary"
              isDisabled={busy}
              onPress={() => {
                if (window.confirm("ویرایش ذخیره‌نشده کنار گذاشته شود؟"))
                  setDraft(null);
              }}
            >
              بستن ویرایش
            </Button>
          </div>
        </form>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.data?.items.map((p) => (
          <Card key={p.id} className="p-5">
            <Card.Header>
              <p className="text-xs text-muted">
                نسخه {number(p.version)} ·{" "}
                {number(p.versions.at(-1)!.plan.days.length)} روز تمرین
              </p>
              <Card.Title>{p.versions.at(-1)!.plan.title}</Card.Title>
            </Card.Header>
            <Card.Content>
              <details>
                <summary className="cursor-pointer text-sm text-muted">
                  تاریخچه نسخه‌ها
                </summary>
                <ul className="mt-3 space-y-2 text-sm">
                  {p.versions
                    .slice()
                    .reverse()
                    .map((v) => (
                      <li key={v.version}>
                        نسخه {number(v.version)} · {date(v.createdAt)} ·{" "}
                        {v.plan.title}
                      </li>
                    ))}
                </ul>
              </details>
            </Card.Content>
            <Card.Footer>
              <Button
                variant="secondary"
                isDisabled={busy}
                onPress={() => open(p)}
              >
                ویرایش برنامه
              </Button>
              <Button
                variant="tertiary"
                onPress={() => {
                  setAssignmentPlan(p.id);
                  setVersion(p.version);
                  assignMutation.current = null;
                }}
              >
                انتخاب برای ارسال
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </div>
      {plans.data?.items.length === 0 && (
        <Notice>
          اولین برنامه را بساز؛ هر ویرایش به شکل یک نسخه مستقل نگهداری می‌شود.
        </Notice>
      )}
      <Card className="p-5">
        <Card.Header>
          <Card.Title>ارسال برنامه</Card.Title>
          <Card.Description>
            فقط شاگردان و کلاس‌های دارای خدمت فعال نمایش داده می‌شوند.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <LoadState {...clients} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="space-y-4"
            onChange={() => {
              assignMutation.current = null;
            }}
          >
            <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
              <label>
                برنامه
                <select
                  required
                  className={fieldClass}
                  value={assignmentPlan}
                  onChange={(e) => {
                    setAssignmentPlan(e.target.value);
                    setVersion(
                      plans.data?.items.find((p) => p.id === e.target.value)
                        ?.version ?? 1,
                    );
                  }}
                >
                  <option value="">انتخاب برنامه</option>
                  {plans.data?.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.versions.at(-1)!.plan.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                نسخه
                <select
                  className={fieldClass}
                  value={version}
                  onChange={(e) => setVersion(Number(e.target.value))}
                >
                  {currentPlan?.versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      نسخه {number(v.version)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                دریافت‌کننده
                <select
                  required
                  className={fieldClass}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                >
                  <option value="">انتخاب شاگرد یا کلاس</option>
                  <optgroup label="شاگردان">
                    {clients.data?.items.map((c) => (
                      <option key={c.id} value={`athlete:${c.id}`}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="کلاس‌ها">
                    {clients.data?.classes.map((c) => (
                      <option key={c.id} value={`class:${c.id}`}>
                        {c.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <label>
                شروع اعتبار
                <IranDateInput
                  required
                  className={fieldClass}
                  value={starts}
                  onValueChange={setStarts}
                />
              </label>
              <label>
                پایان اعتبار
                <IranDateInput
                  required
                  min={starts}
                  className={fieldClass}
                  value={ends}
                  onValueChange={setEnds}
                />
              </label>
            </fieldset>
            <Button
              type="submit"
              isPending={busy}
              isDisabled={!clients.data || !currentPlan}
            >
              ارسال نسخه انتخابی
            </Button>
          </form>
        </Card.Content>
      </Card>
      <h2 className="text-lg font-semibold">برنامه‌های ارسال‌شده</h2>
      <LoadState {...assignments} />
      {assignments.data?.items.map((a) => (
        <Card key={a.id} className="p-5">
          <Card.Header>
            <Card.Title>{a.snapshot.title}</Card.Title>
            <Card.Description>
              {clients.data?.items.find((c) => c.id === a.athleteId)?.name ??
                "ورزشکار"}{" "}
              · نسخه {number(a.version)} ·{" "}
              {a.status === "revoked"
                ? "لغوشده"
                : a.consentAt
                  ? "اشتراک نتایج فعال"
                  : "در انتظار پذیرش"}
            </Card.Description>
          </Card.Header>
          <Card.Footer className="flex-wrap">
            <Button
              variant="secondary"
              isDisabled={busy || !a.consentAt || !a.available}
              onPress={() => {
                setBusy(true);
                setResults(null);
                void trainingApi
                  .coachSessions(a.id)
                  .then((r) =>
                    setResults({ title: a.snapshot.title, sessions: r.items }),
                  )
                  .catch((e) => setMessage(errorText(e)))
                  .finally(() => setBusy(false));
              }}
            >
              مشاهده نتایج
            </Button>
            <Button
              variant="tertiary"
              isDisabled={busy || a.status === "revoked"}
              onPress={() => {
                if (
                  !window.confirm("این برنامه لغو و دسترسی به نتایج قطع شود؟")
                )
                  return;
                setBusy(true);
                void trainingApi
                  .revoke(a.id)
                  .then(() => {
                    assignments.reload();
                    setResults(null);
                  })
                  .catch((e) => setMessage(errorText(e)))
                  .finally(() => setBusy(false));
              }}
            >
              لغو برنامه
            </Button>
          </Card.Footer>
        </Card>
      ))}
      {results && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">نتایج {results.title}</h2>
          <TrainingSummary sessions={results.sessions} />
          {results.sessions.map((s) => (
            <Card key={s.clientId} className="p-4">
              <p>
                {date(s.startedAt)} ·{" "}
                {s.status === "completed"
                  ? "کامل‌شده"
                  : s.status === "active"
                    ? "در حال تمرین"
                    : "لغوشده"}{" "}
                · {number(s.sets.filter((x) => x.done).length)} ست
              </p>
              {s.note && <p className="mt-2 text-muted">{s.note}</p>}
            </Card>
          ))}
        </section>
      )}
    </TrainingFrame>
  );
}

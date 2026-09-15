"use client";
import { ActivityHealthCard } from "./ActivityHealthCard";
import { useState } from "react";
import { Button, Card, InputGroup } from "@heroui/react";
import { Check, Plus, Sprout, Archive } from "lucide-react";
import {
  useHabits,
  useHabitActions,
  type Habit,
} from "@api/domains/training/habits";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { TrainingFrame, number, useIdentity } from "./shared";
import { VisualEmptyState, ProgressMeter } from "@/components/ui/clarity";
type Draft = Pick<Habit, "id" | "title" | "unit" | "target">;
export function HabitsScreen() {
  const identity = useIdentity();
  const habits = useHabits();
  const actions = useHabitActions();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  return (
    <TrainingFrame title="عادت‌های کوچک، قدم‌های ماندگار">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm leading-7 text-muted">
          هدف روزانه‌ات را خودت تعیین کن و پیشرفتت را ثبت کن.
        </p>
        <Button
          isIconOnly
          aria-label="افزودن عادت"
          onPress={() => {
            setError("");
            setDraft({
              id: crypto.randomUUID(),
              title: "",
              unit: "بار",
              target: 1,
            });
          }}
        >
          <Plus size={20} />
        </Button>
      </div>
      <ActivityHealthCard key={identity} />
      {habits.isPending && (
        <p role="status" className="text-sm text-muted">
          در حال دریافت عادت‌ها…
        </p>
      )}
      {habits.isError && (
        <div role="alert">
          <p>دریافت عادت‌ها ناموفق بود.</p>
          <Button variant="secondary" onPress={() => void habits.refetch()}>
            تلاش دوباره
          </Button>
        </div>
      )}
      {habits.data?.items.length === 0 && (
        <VisualEmptyState
          icon="calendar-check"
          title="با یک عادت شروع کن"
          description="پیاده‌روی، مطالعه یا یک عادت دلخواه؛ هدف را متناسب با برنامه خودت انتخاب کن."
        />
      )}
      {habits.data?.items.map((habit) => (
        <HabitCard
          key={`${habit.id}:${habits.data!.today}`}
          habit={habit}
          today={habits.data!.today}
          onEdit={() => setDraft(habit)}
        />
      ))}
      <BottomSheet
        open={Boolean(draft)}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
        title="هدف روزانه من"
        snapPoints={[0.7]}
      >
        {draft && (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              try {
                await actions.save.mutateAsync(draft);
                setDraft(null);
              } catch {
                setError("ذخیره نشد؛ اطلاعاتت حفظ شده، دوباره تلاش کن.");
              }
            }}
          >
            <label className="grid gap-2 text-sm">
              نام عادت
              <InputGroup className="mt-2 w-full" variant="secondary">
                <InputGroup.Input
                  required
                  aria-label="نام عادت"
                  value={draft.title}
                  maxLength={80}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                />
              </InputGroup>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm">
                هدف
                <InputGroup className="mt-2 w-full" variant="secondary">
                  <InputGroup.Input
                    required
                    aria-label="هدف روزانه"
                    type="number"
                    min={0.1}
                    max={100000}
                    step="any"
                    value={String(draft.target)}
                    onChange={(event) =>
                      setDraft({ ...draft, target: Number(event.target.value) })
                    }
                  />
                </InputGroup>
              </label>
              <label className="grid gap-2 text-sm">
                واحد
                <InputGroup className="mt-2 w-full" variant="secondary">
                  <InputGroup.Input
                    required
                    aria-label="واحد هدف"
                    value={draft.unit}
                    maxLength={20}
                    onChange={(event) =>
                      setDraft({ ...draft, unit: event.target.value })
                    }
                  />
                </InputGroup>
              </label>
            </div>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              isPending={actions.save.isPending}
            >
              ذخیره هدف
            </Button>
          </form>
        )}
      </BottomSheet>
    </TrainingFrame>
  );
}
function HabitCard({
  habit,
  today,
  onEdit,
}: {
  habit: Habit;
  today: string;
  onEdit: () => void;
}) {
  const actions = useHabitActions();
  const todayValue = habit.logs.find((log) => log.date === today)?.value ?? 0;
  const [value, setValue] = useState(String(todayValue));
  const completed = habit.logs.filter((log) => log.value >= log.target).length;
  return (
    <Card className="p-5">
      <Card.Header>
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-accent/10 p-3 text-accent">
            <Sprout size={22} />
          </span>
          <div className="flex-1">
            <Card.Title>{habit.title}</Card.Title>
            <Card.Description>
              {number(habit.target)} {habit.unit} در روز
            </Card.Description>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`بایگانی ${habit.title}`}
            isPending={actions.archive.isPending}
            onPress={() => actions.archive.mutate(habit.id)}
          >
            <Archive size={16} />
          </Button>
        </div>
      </Card.Header>
      <Card.Content className="space-y-4">
        <ProgressMeter
          value={todayValue}
          max={habit.target}
          label={`پیشرفت ${habit.title}`}
        />
        <div className="flex items-end gap-3">
          <label className="min-w-0 flex-1 text-xs">
            امروز ({habit.unit})
            <InputGroup className="mt-2 w-full" variant="secondary">
              <InputGroup.Input
                aria-label={`ثبت ${habit.title}`}
                type="number"
                min={0}
                max={100000}
                step="any"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </InputGroup>
          </label>
          <Button
            isPending={actions.log.isPending}
            isDisabled={
              value === "" ||
              !Number.isFinite(Number(value)) ||
              Number(value) < 0 ||
              Number(value) > 100000
            }
            onPress={() =>
              actions.log.mutate({
                id: habit.id,
                date: today,
                value: Number(value),
              })
            }
          >
            <Check size={16} />
            ثبت
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {number(completed)} روز رسیدن به هدف در ثبت‌های اخیر
          </span>
          <Button size="sm" variant="ghost" onPress={onEdit}>
            ویرایش هدف
          </Button>
        </div>
        {actions.log.isSuccess && (
          <p role="status" className="text-xs text-accent">
            ثبت امروز ذخیره شد.
          </p>
        )}
        {(actions.log.isError || actions.archive.isError) && (
          <p role="alert" className="text-xs text-danger">
            عملیات انجام نشد؛ دوباره امتحان کن.
          </p>
        )}
      </Card.Content>
    </Card>
  );
}

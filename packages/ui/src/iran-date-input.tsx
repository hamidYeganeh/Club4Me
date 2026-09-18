"use client";

import {
  Calendar,
  DateField,
  DatePicker,
  TimeField,
} from "@heroui/react";
import {
  createCalendar,
  parseDate,
  parseDateTime,
  parseTime,
  Time,
  type CalendarDate,
  type DateValue,
} from "@internationalized/date";
import { I18nProvider } from "react-aria-components";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";

const PERSIAN_LOCALE = "fa-IR-u-ca-persian";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange" | "min" | "max"
> & {
  variant?: "primary" | "secondary";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  withTime?: boolean;
  min?: string;
  max?: string;
};

function gregorianDateFromIso(iso: string, withTime: boolean): DateValue | null {
  if (!iso) return null;
  try {
    const normalized = iso.trim();
    if (withTime) {
      const slice = normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
      return parseDateTime(slice);
    }
    return parseDate(normalized.slice(0, 10));
  } catch {
    return null;
  }
}

function timeFromIso(iso: string): Time {
  const match = iso.trim().match(/T(\d{2}):(\d{2})/);
  if (!match) return new Time(0, 0);
  return new Time(Number(match[1]), Number(match[2]));
}

function combineIso(
  date: CalendarDate | null,
  time: Time | null,
  withTime: boolean,
): string {
  if (!date) return "";
  const civil = date.toString();
  if (!withTime) return civil;
  const t = time ?? new Time(0, 0);
  return `${civil}T${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

function isOutOfRange(value: string, min?: string, max?: string) {
  if (!value) return false;
  if (min && value < min) return true;
  if (max && value > max) return true;
  return false;
}

function PersianCalendarPicker({
  value,
  onValueChange,
  withTime,
  min,
  max,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  id,
}: {
  value: string;
  onValueChange: (next: string) => void;
  withTime: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  id?: string;
}) {
  const dateValue = useMemo(
    () => gregorianDateFromIso(value, withTime),
    [value, withTime],
  );
  const [timeValue, setTimeValue] = useState(() => timeFromIso(value));

  useEffect(() => {
    setTimeValue(timeFromIso(value));
  }, [value]);

  const minValue = useMemo(
    () => (min ? gregorianDateFromIso(min, withTime) : undefined),
    [min, withTime],
  );
  const maxValue = useMemo(
    () => (max ? gregorianDateFromIso(max, withTime) : undefined),
    [max, withTime],
  );

  const invalid = isOutOfRange(value, min, max);

  const onDateChange = useCallback(
    (next: DateValue | null) => {
      const civil = next as CalendarDate | null;
      onValueChange(combineIso(civil, timeValue, withTime));
    },
    [onValueChange, timeValue, withTime],
  );

  const onTimeChange = useCallback(
    (next: Time | null) => {
      const t = next ?? new Time(0, 0);
      setTimeValue(t);
      const civil = gregorianDateFromIso(value, withTime) as CalendarDate | null;
      onValueChange(combineIso(civil, t, withTime));
    },
    [onValueChange, value, withTime],
  );

  return (
    <I18nProvider locale={PERSIAN_LOCALE}>
      <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
        <DatePicker
          id={id}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          isDisabled={disabled}
          value={dateValue}
          minValue={minValue ?? undefined}
          maxValue={maxValue ?? undefined}
          onChange={onDateChange}
          isInvalid={invalid}
          className="w-full min-w-0"
        >
          <DateField.Group fullWidth variant="secondary">
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover className={withTime ? "flex flex-col gap-3" : undefined}>
            <Calendar
              aria-label={ariaLabel ?? "تاریخ"}
              createCalendar={createCalendar}
            >
              <Calendar.Header>
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </Calendar.GridBody>
              </Calendar.Grid>
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {({ year }) => <Calendar.YearPickerCell year={year} />}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>
        {withTime ? (
          <TimeField
            aria-label="ساعت"
            hourCycle={24}
            isDisabled={disabled}
            value={timeValue}
            onChange={(next) => onTimeChange(next as Time | null)}
            isInvalid={invalid}
            className="w-full min-w-0"
          >
            <TimeField.Group fullWidth variant="secondary">
              <TimeField.Input>
                {(segment) => <TimeField.Segment segment={segment} />}
              </TimeField.Input>
            </TimeField.Group>
          </TimeField>
        ) : null}
      </div>
    </I18nProvider>
  );
}

/** Gregorian API values; Persian Jalali display via HeroUI DatePicker. */
export function IranDateInput({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  withTime = false,
  name,
  min,
  max,
  className,
  disabled,
  id,
  ...props
}: Props) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const value = controlledValue ?? localValue;
  const validityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = validityRef.current?.form;
    const reset = () => setLocalValue(defaultValue);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue]);

  const invalid = isOutOfRange(value, min, max);
  useEffect(() => {
    validityRef.current?.setCustomValidity(
      invalid ? "تاریخ شمسی معتبر و در بازه مجاز وارد کنید." : "",
    );
  }, [invalid]);

  const commit = (next: string) => {
    setLocalValue(next);
    onValueChange?.(next);
  };

  return (
    <>
      <input
        ref={validityRef}
        type="text"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        value={value}
        readOnly
      />
      <PersianCalendarPicker
        {...props}
        id={id}
        className={className}
        disabled={disabled}
        value={value}
        withTime={withTime}
        min={min}
        max={max}
        onValueChange={commit}
      />
      {name ? (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      ) : null}
    </>
  );
}

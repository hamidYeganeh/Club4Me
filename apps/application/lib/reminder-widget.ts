"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

type ReminderWidgetPlugin = {
  setReminder(reminder: {
    date: string;
    time: string;
    meta: string;
    startsAtEpochMs: number;
  }): Promise<{ updated: boolean }>;
  clearReminder(): Promise<{ updated: boolean }>;
};

const reminderWidget = registerPlugin<ReminderWidgetPlugin>("ReminderWidget");

export function updateAndroidReminderWidget(reminder: {
  date: string;
  time: string;
  meta: string;
  startsAtEpochMs: number;
}): Promise<{ updated: boolean }> | undefined {
  if (Capacitor.getPlatform() !== "android") {
    return undefined;
  }

  return reminderWidget.setReminder(reminder);
}

export function clearAndroidReminderWidget():
  | Promise<{ updated: boolean }>
  | undefined {
  if (Capacitor.getPlatform() !== "android") {
    return undefined;
  }

  return reminderWidget.clearReminder();
}

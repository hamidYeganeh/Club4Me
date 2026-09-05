package com.gym4me.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ReminderWidget")
public class ReminderWidgetPlugin extends Plugin {
    @PluginMethod
    public void setReminder(PluginCall call) {
        String date = call.getString("date");
        String time = call.getString("time");
        String meta = call.getString("meta");
        Double startsAtEpochMs = call.getDouble("startsAtEpochMs");

        if (date == null || time == null || meta == null || startsAtEpochMs == null) {
            call.reject("date, time, meta, and startsAtEpochMs are required");
            return;
        }

        SharedPreferences preferences = getContext().getSharedPreferences(
                ReminderWidgetProvider.PREFERENCES_NAME,
                Context.MODE_PRIVATE
        );
        preferences.edit()
                .putString(ReminderWidgetProvider.DATE_KEY, date)
                .putString(ReminderWidgetProvider.TIME_KEY, time)
                .putString(ReminderWidgetProvider.META_KEY, meta)
                .putLong(ReminderWidgetProvider.STARTS_AT_KEY, startsAtEpochMs.longValue())
                .putBoolean(ReminderWidgetProvider.HAS_REMINDER_KEY, true)
                .apply();

        ReminderWidgetProvider.refresh(getContext());

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }

    @PluginMethod
    public void clearReminder(PluginCall call) {
        SharedPreferences preferences = getContext().getSharedPreferences(
                ReminderWidgetProvider.PREFERENCES_NAME,
                Context.MODE_PRIVATE
        );
        preferences.edit().clear().apply();
        ReminderWidgetProvider.refresh(getContext());

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }
}

package com.gym4me.application;

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
        Integer joinedCount = call.getInt("joinedCount");
        Integer interestedCount = call.getInt("interestedCount");

        if (date == null || time == null || joinedCount == null || interestedCount == null) {
            call.reject("date, time, joinedCount, and interestedCount are required");
            return;
        }

        SharedPreferences preferences = getContext().getSharedPreferences(
                ReminderWidgetProvider.PREFERENCES_NAME,
                Context.MODE_PRIVATE
        );
        preferences.edit()
                .putString(ReminderWidgetProvider.DATE_KEY, date)
                .putString(ReminderWidgetProvider.TIME_KEY, time)
                .putInt(ReminderWidgetProvider.JOINED_COUNT_KEY, joinedCount)
                .putInt(ReminderWidgetProvider.INTERESTED_COUNT_KEY, interestedCount)
                .apply();

        ReminderWidgetProvider.refresh(getContext());

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }
}

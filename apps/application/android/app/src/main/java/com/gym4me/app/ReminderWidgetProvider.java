package com.gym4me.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

public class ReminderWidgetProvider extends AppWidgetProvider {
    static final String PREFERENCES_NAME = "reminder_widget";
    static final String DATE_KEY = "date";
    static final String TIME_KEY = "time";
    static final String META_KEY = "meta";
    static final String STARTS_AT_KEY = "starts_at";
    static final String HAS_REMINDER_KEY = "has_reminder";

    @Override
    public void onUpdate(
            Context context,
            AppWidgetManager appWidgetManager,
            int[] appWidgetIds
    ) {
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, createViews(context));
        }
    }

    public static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, ReminderWidgetProvider.class);
        manager.updateAppWidget(provider, createViews(context));
    }

    private static RemoteViews createViews(Context context) {
        RemoteViews views = new RemoteViews(
                context.getPackageName(),
                R.layout.reminder_widget
        );
        SharedPreferences preferences = context.getSharedPreferences(
                PREFERENCES_NAME,
                Context.MODE_PRIVATE
        );
        boolean hasReminder = preferences.getBoolean(HAS_REMINDER_KEY, false);
        long startsAt = preferences.getLong(STARTS_AT_KEY, 0L);
        boolean isUpcoming = hasReminder && startsAt > System.currentTimeMillis();

        views.setViewVisibility(
                R.id.reminder_widget_root,
                isUpcoming ? View.VISIBLE : View.GONE
        );
        if (!isUpcoming) {
            return views;
        }

        views.setTextViewText(R.id.reminder_widget_date, preferences.getString(DATE_KEY, ""));
        views.setTextViewText(R.id.reminder_widget_time, preferences.getString(TIME_KEY, ""));
        views.setTextViewText(R.id.reminder_widget_meta, preferences.getString(META_KEY, ""));

        Intent launchIntent = new Intent(context, MainActivity.class)
                .setAction(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_LAUNCHER)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent launchPendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        views.setOnClickPendingIntent(R.id.reminder_widget_root, launchPendingIntent);
        return views;
    }
}

package com.gym4me.application;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class ReminderWidgetProvider extends AppWidgetProvider {
    static final String PREFERENCES_NAME = "reminder_widget";
    static final String DATE_KEY = "date";
    static final String TIME_KEY = "time";
    static final String JOINED_COUNT_KEY = "joined_count";
    static final String INTERESTED_COUNT_KEY = "interested_count";

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
        String date = preferences.getString(
                DATE_KEY,
                context.getString(R.string.reminder_widget_date)
        );
        String time = preferences.getString(
                TIME_KEY,
                context.getString(R.string.reminder_widget_time)
        );
        int joinedCount = preferences.getInt(JOINED_COUNT_KEY, 26);
        int interestedCount = preferences.getInt(INTERESTED_COUNT_KEY, 18);

        views.setTextViewText(R.id.reminder_widget_date, date);
        views.setTextViewText(R.id.reminder_widget_time, time);
        views.setTextViewText(
                R.id.reminder_widget_meta,
                context.getString(
                        R.string.reminder_widget_meta,
                        joinedCount,
                        interestedCount
                )
        );

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

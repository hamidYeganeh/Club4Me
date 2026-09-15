package com.gym4me.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;

/** Local permission rationale; opens without login, networking or reading health data. */
public class HealthPrivacyActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        TextView text = new TextView(this);
        text.setText("حریم خصوصی داده فعالیت\n\nکلاب‌فورمی فقط با انتخاب شما مجموع قدم‌های هفت روز اخیر را از Health Connect می‌خواند و روی همین صفحه نمایش می‌دهد. این داده در سرور ذخیره نمی‌شود، به مربی یا باشگاه ارسال نمی‌شود و در تحلیل رفتار یا تبلیغات استفاده نمی‌شود.\n\nهیچ داده‌ای در Health Connect نوشته یا حذف نمی‌شود. دسترسی پس‌زمینه درخواست نمی‌شود. از تنظیمات Health Connect می‌توانید دسترسی قدم‌ها را هر زمان لغو کنید. بستن صفحه، خواندن دوره‌ای را متوقف می‌کند.");
        text.setTextSize(18); text.setPadding(24, 40, 24, 40);
        text.setTextDirection(View.TEXT_DIRECTION_RTL);
        ScrollView scroll = new ScrollView(this); scroll.addView(text); setContentView(scroll);
    }
}

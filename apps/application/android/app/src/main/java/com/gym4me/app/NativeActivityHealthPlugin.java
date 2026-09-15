package com.gym4me.app;

import android.annotation.TargetApi;
import android.health.connect.AggregateRecordsRequest;
import android.health.connect.AggregateRecordsResponse;
import android.health.connect.HealthConnectException;
import android.health.connect.HealthConnectManager;
import android.health.connect.TimeInstantRangeFilter;
import android.health.connect.datatypes.StepsRecord;
import android.os.Build;
import android.os.OutcomeReceiver;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.time.LocalDate;
import java.time.ZoneId;
import org.json.JSONObject;

/** Read-only daily aggregates; no raw records, identifiers, writes or background access. */
@CapacitorPlugin(name = "NativeActivityHealth", permissions = @Permission(alias = "steps", strings = {"android.permission.health.READ_STEPS"}))
public class NativeActivityHealthPlugin extends Plugin {
    private boolean available() {
        return Build.VERSION.SDK_INT >= 34 && getContext().getSystemService(HealthConnectManager.class) != null;
    }
    @PluginMethod public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", available());
        result.put("provider", "health-connect");
        call.resolve(result);
    }
    @PluginMethod public void authorize(PluginCall call) {
        if (!available()) { call.reject("Health Connect requires Android 14 or later", "HEALTH_UNAVAILABLE"); return; }
        requestPermissionForAlias("steps", call, "stepsPermissionResult");
    }
    @PermissionCallback private void stepsPermissionResult(PluginCall call) {
        if (getPermissionState("steps") != PermissionState.GRANTED) { call.reject("Step access was not granted", "HEALTH_DENIED"); return; }
        call.resolve();
    }
    @PluginMethod public void readWeek(PluginCall call) {
        if (!available()) { call.reject("Health Connect is unavailable", "HEALTH_UNAVAILABLE"); return; }
        if (getPermissionState("steps") != PermissionState.GRANTED) { call.reject("Step access was not granted", "HEALTH_DENIED"); return; }
        readDay(call, LocalDate.now(ZoneId.of("Asia/Tehran")).minusDays(6), 0, new JSArray());
    }
    @TargetApi(34) private void readDay(PluginCall call, LocalDate date, int index, JSArray days) {
        if (index == 7) { JSObject result = new JSObject(); result.put("days", days); call.resolve(result); return; }
        ZoneId zone = ZoneId.of("Asia/Tehran");
        TimeInstantRangeFilter range = new TimeInstantRangeFilter.Builder()
                .setStartTime(date.atStartOfDay(zone).toInstant())
                .setEndTime(date.plusDays(1).atStartOfDay(zone).toInstant()).build();
        AggregateRecordsRequest<Long> request = new AggregateRecordsRequest.Builder<Long>(range)
                .addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).build();
        try {
            getContext().getSystemService(HealthConnectManager.class).aggregate(request, getContext().getMainExecutor(),
                    new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                        @Override public void onResult(AggregateRecordsResponse<Long> response) {
                            JSObject row = new JSObject(); row.put("date", date.toString());
                            Long count = response.get(StepsRecord.STEPS_COUNT_TOTAL);
                            row.put("steps", count == null ? JSONObject.NULL : count);
                            days.put(row); readDay(call, date.plusDays(1), index + 1, days);
                        }
                        @Override public void onError(HealthConnectException error) {
                            call.reject("Unable to read step totals; check Health Connect permissions", "HEALTH_READ_FAILED");
                        }
                    });
        } catch (SecurityException error) { call.reject("Step access was revoked", "HEALTH_DENIED"); }
          catch (Exception error) { call.reject("Health Connect is unavailable", "HEALTH_READ_FAILED"); }
    }
}

package com.gym4me.app;

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "NativeGeolocation",
        permissions = @Permission(
                alias = "location",
                strings = {
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.ACCESS_FINE_LOCATION
                }
        )
)
public class NativeGeolocationPlugin extends Plugin {
    private static final long LOCATION_TIMEOUT_MS = 12_000;

    @PluginMethod
    public void getCurrentPosition(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }
        locate(call);
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("Location permission was denied");
            return;
        }
        locate(call);
    }

    private void locate(PluginCall call) {
        LocationManager manager = (LocationManager) getContext()
                .getSystemService(Context.LOCATION_SERVICE);
        String provider = selectProvider(manager);
        if (provider == null) {
            call.reject("Location services are disabled");
            return;
        }

        try {
            Location cached = manager.getLastKnownLocation(provider);
            if (cached != null && System.currentTimeMillis() - cached.getTime() < 30_000) {
                call.resolve(toResult(cached));
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                manager.getCurrentLocation(
                        provider,
                        null,
                        getActivity().getMainExecutor(),
                        location -> resolveLocation(call, location)
                );
                return;
            }

            Handler handler = new Handler(Looper.getMainLooper());
            LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    handler.removeCallbacksAndMessages(this);
                    manager.removeUpdates(this);
                    resolveLocation(call, location);
                }

                @Override
                public void onProviderDisabled(String disabledProvider) {
                    handler.removeCallbacksAndMessages(this);
                    manager.removeUpdates(this);
                    call.reject("Location services are disabled");
                }

                @Override
                public void onStatusChanged(String changedProvider, int status, Bundle extras) {
                    // Required on Android versions below API 30.
                }
            };
            manager.requestSingleUpdate(provider, listener, Looper.getMainLooper());
            handler.postAtTime(() -> {
                manager.removeUpdates(listener);
                call.reject("Location request timed out");
            }, listener, SystemClock.uptimeMillis() + LOCATION_TIMEOUT_MS);
        } catch (SecurityException error) {
            call.reject("Location permission is unavailable", error);
        }
    }

    private String selectProvider(LocationManager manager) {
        if (manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            return LocationManager.GPS_PROVIDER;
        }
        if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
            return LocationManager.NETWORK_PROVIDER;
        }
        return null;
    }

    private void resolveLocation(PluginCall call, Location location) {
        if (location == null) {
            call.reject("Current location is unavailable");
            return;
        }
        call.resolve(toResult(location));
    }

    private JSObject toResult(Location location) {
        JSObject coords = new JSObject();
        coords.put("latitude", location.getLatitude());
        coords.put("longitude", location.getLongitude());
        coords.put("accuracy", location.getAccuracy());
        coords.put("altitude", location.hasAltitude() ? location.getAltitude() : null);

        JSObject result = new JSObject();
        result.put("timestamp", location.getTime());
        result.put("coords", coords);
        return result;
    }
}

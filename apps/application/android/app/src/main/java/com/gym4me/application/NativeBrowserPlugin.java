package com.gym4me.application;

import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeBrowser")
public class NativeBrowserPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isBlank()) {
            call.reject("A URL is required");
            return;
        }

        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        if (!("https".equals(scheme) || "http".equals(scheme) || "market".equals(scheme))) {
            call.reject("Unsupported URL scheme");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        if (intent.resolveActivity(getContext().getPackageManager()) == null) {
            call.reject("No application can open this URL");
            return;
        }

        getActivity().startActivity(intent);
        JSObject result = new JSObject();
        result.put("opened", true);
        call.resolve(result);
    }
}

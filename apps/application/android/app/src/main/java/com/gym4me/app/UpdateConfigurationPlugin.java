package com.gym4me.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Trust and compatibility values come from the APK, never from a downloaded web bundle. */
@CapacitorPlugin(name = "UpdateConfiguration")
public class UpdateConfigurationPlugin extends Plugin {
    @PluginMethod
    public void getConfig(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", getConfig().getBoolean("enabled", false));
        result.put("runtimeVersion", getConfig().getString("runtimeVersion", ""));
        result.put("manifestUrl", getConfig().getString("manifestUrl", ""));
        result.put("publicKey", getConfig().getString("publicKey", ""));
        call.resolve(result);
    }
}

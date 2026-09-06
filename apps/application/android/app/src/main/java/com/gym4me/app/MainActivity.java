package com.gym4me.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(UpdateConfigurationPlugin.class);
        registerPlugin(ReminderWidgetPlugin.class);
        registerPlugin(NativeGeolocationPlugin.class);
        registerPlugin(NativeBrowserPlugin.class);
        registerPlugin(SecureTokenStoragePlugin.class);
        registerPlugin(BiometricAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

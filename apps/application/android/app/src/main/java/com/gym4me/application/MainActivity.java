package com.gym4me.application;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(ReminderWidgetPlugin.class);
        registerPlugin(NativeGeolocationPlugin.class);
        registerPlugin(NativeBrowserPlugin.class);
        registerPlugin(SecureTokenStoragePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

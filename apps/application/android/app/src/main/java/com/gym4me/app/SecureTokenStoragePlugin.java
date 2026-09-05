package com.gym4me.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SecureTokenStorage")
public class SecureTokenStoragePlugin extends Plugin {
    private static final String ACCESS_TOKEN_KEY = "gym4me.accessToken";
    private static final String REFRESH_TOKEN_KEY = "gym4me.refreshToken";
    private static final String KEY_ALIAS = "gym4me_session_key_v1";
    private static final String STORE_NAME = "gym4me_secure_session";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";

    @PluginMethod
    public void getItem(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isBlank()) {
            call.reject("A non-empty key is required");
            return;
        }
        try {
            String encrypted = preferences().getString(key, null);
            JSObject result = new JSObject();
            result.put("value", encrypted == null ? null : decrypt(encrypted));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Secure storage read failed", error);
        }
    }

    @PluginMethod
    public void setItem(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || key.isBlank() || value == null) {
            call.reject("A non-empty key and value are required");
            return;
        }
        try {
            preferences().edit().putString(key, encrypt(value)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Secure storage write failed", error);
        }
    }

    @PluginMethod
    public void removeItem(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isBlank()) {
            call.reject("A non-empty key is required");
            return;
        }
        preferences().edit().remove(key).apply();
        call.resolve();
    }

    @PluginMethod
    public void hasSession(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "value",
            preferences().contains(ACCESS_TOKEN_KEY) &&
                preferences().contains(REFRESH_TOKEN_KEY)
        );
        call.resolve(result);
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(STORE_NAME, Context.MODE_PRIVATE);
    }

    private SecretKey key() throws Exception {
        KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        generator.init(new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
         .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
         .setRandomizedEncryptionRequired(true)
         .build());
        return generator.generateKey();
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        byte[] iv = cipher.getIV();
        ByteBuffer payload = ByteBuffer.allocate(4 + iv.length + encrypted.length);
        payload.putInt(iv.length).put(iv).put(encrypted);
        return Base64.encodeToString(payload.array(), Base64.NO_WRAP);
    }

    private String decrypt(String encoded) throws Exception {
        ByteBuffer payload = ByteBuffer.wrap(Base64.decode(encoded, Base64.NO_WRAP));
        int ivLength = payload.getInt();
        if (ivLength < 12 || ivLength > 32 || payload.remaining() <= ivLength) {
            throw new IllegalArgumentException("Invalid encrypted payload");
        }
        byte[] iv = new byte[ivLength];
        payload.get(iv);
        byte[] encrypted = new byte[payload.remaining()];
        payload.get(encrypted);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }
}

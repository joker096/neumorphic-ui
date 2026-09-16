# TWA custom rules. Keep TWA/browser-helper classes referenced from the manifest.
-keep class com.messanger.e2e.** { *; }
-keep class com.google.androidbrowserhelper.** { *; }

# Keep AndroidX core (FileProvider referenced from manifest).
-keep class androidx.core.content.FileProvider { *; }

# Keep WebView/TrustedWebActivity service classes invoked via reflection from manifest.
-keep class * extends com.google.androidbrowserhelper.trusted.DelegationService { *; }
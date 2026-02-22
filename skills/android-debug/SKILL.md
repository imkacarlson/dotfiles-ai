---
name: android-debug
description: "Connects to an Android device over WiFi via ADB and forwards port 9222 for Chrome DevTools remote debugging. Takes the device IP:port as argument."
argument-hint: "<ip:port>"
allowed-tools:
  - Bash(adb connect *)
  - Bash(adb devices)
  - Bash(adb forward tcp:9222 localabstract:chrome_devtools_remote)
---

# Android Debug

Connect to the Android device and set up Chrome DevTools remote debugging.

The user's device address is: `$ARGUMENTS`

## Steps

1. **Connect via ADB**
   Run: `adb connect $ARGUMENTS`
   If the output does not contain "connected", report the error and stop.

2. **Verify device is listed**
   Run: `adb devices`
   Confirm the device appears with status `device` (not `unauthorized` or `offline`).

3. **Forward DevTools port**
   Run: `adb forward tcp:9222 localabstract:chrome_devtools_remote`
   This maps localhost:9222 to Chrome's remote debug socket on the device.

4. **Report success**
   Tell the user the device is connected and Chrome DevTools MCP is ready to use.
   Remind them to open the app in Chrome on their phone if not already open.

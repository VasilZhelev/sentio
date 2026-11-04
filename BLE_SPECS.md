# Sentio Glasses BLE Integration Guide

## Hardware
ESP32-S3 using standard Nordic UART Service architecture.

## 1. Connection Details
- **Device Name**: `Sentio_Glasses`
- **Service UUID**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **RX Characteristic** (App WRITES to this): `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` (Write as UTF-8 Strings. Write Without Response is enabled).
- **TX Characteristic** (App LISTENS to this): `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` (Enable notifications/subscribe to this).

## 2. Commands (App -> Glasses via RX)
Send exactly as Strings (no line endings `\n` required).

- `CANCEL` -> Stops the crash countdown immediately.
- `MSG:Hello John!` -> Displays a notification on the glasses for 4 seconds.
- `SPD:24` -> Updates the speedometer on the glasses to 24 km/h.
- `BAT:85` -> Updates the battery indicator to 85%.
- `TIM:14:30` -> Updates the clock.

## 3. Events (Glasses -> App via TX)
- `CRASH_ALERT` -> Fired instantly when an impact is detected. Trigger a 10-second UI countdown on the phone.
- `TRIGGER_SOS` -> Fired if the 10-second countdown on the glasses finishes without being canceled. Trigger to fetch GPS and send the SOS to the backend.

## Common Pitfalls
- **Android 12+ Permissions**: Request `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` at runtime.
- **MTU Size**: ESP32 requests an MTU of 512. Ensure BLE library accepts this MTU negotiation to send longer `MSG:` strings without truncation.

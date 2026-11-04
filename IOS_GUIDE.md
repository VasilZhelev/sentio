# Running Sentio on iPhone (free Apple ID, no Mac)

This setup needs no paid Apple Developer account. EAS builds an **unsigned** `.ipa`, and **Sideloadly** on Windows signs and installs it with a normal Apple ID. JS changes then ship over the air with **EAS Update**.

## One-time PC setup

Install these **web** versions. If you have the Microsoft Store versions, uninstall them first.

- iTunes (64-bit): https://www.apple.com/itunes/download/win64
- iCloud: https://updates.cdn-apple.com/2020/windows/001-39935-20200911-1A70AA56-F448-11EA-8CC0-99D41950005E/iCloudSetup.exe
- Sideloadly: https://sideloadly.io/SideloadlySetup64.exe

Restart the PC after installing iTunes and iCloud.

## Install the app on the iPhone

1. Get the `.ipa`. Use the newest iOS build on expo.dev (open it on the PC, then click **Download**). Or use `sentio-unsigned.ipa` in this folder.
2. Connect the iPhone with a USB cable and unlock it. Tap **Trust This Computer** and enter the passcode.
3. You don't need to open iTunes. If the Microsoft Store **Apple Music** app is installed, iTunes won't show the phone icon at all, and that's fine. What matters is that the phone appears in Sideloadly's **iDevice** list.
4. Open **Sideloadly**:
   - Drag the `.ipa` into the window, or click the IPA icon to pick it.
   - **iDevice:** select your iPhone.
   - **Apple account:** enter your Apple ID email.
   - Click **Start**. Enter your Apple ID password, and the 2FA code if it asks.
   - Wait for **Done**.
5. On the iPhone:
   - Go to **Settings › General › VPN & Device Management**, tap your Apple ID and tap **Trust**.
   - Turn on **Settings › Privacy & Security › Developer Mode**. The phone restarts. After the restart, tap **Turn On**.
6. Open **Sentio** and allow **Bluetooth** and **Location** (choose "While Using the App" or better).
7. Turn on the glasses. The app scans and connects automatically.

## Everyday workflow: pushing code changes (no reinstall)

After you change JS or TS code (screens, logic, styles, images):

```bash
eas update --channel production --message "short description"
```

Then open Sentio on the iPhone. A popup says **Update ready**. Tap **Restart now**.

If no popup appears, fully close the app (swipe it away) and open it again.

## When a full rebuild is needed

An over-the-air update is **not** enough when you:

- add, remove or upgrade a package that contains native code (most `expo-*` / `react-native-*` libraries with iOS code)
- change `app.json` plugins, permissions, the icon, splash, bundle ID or app name

In that case:

1. Bump `"version"` in `app.json`, for example `1.0.0` → `1.0.1`. Old installs then won't receive updates meant for the new native code.
2. Build:
   ```bash
   eas build -p ios --profile unsigned
   ```
3. Download the new `.ipa` from the build page (on the PC) and install it with Sideloadly as above.

## Every 7 days: re-sign

With a free Apple ID the app stops opening after **7 days**. Your data and your published updates stay on the phone. To renew:

- Plug the phone in, open Sideloadly, drag in the same `.ipa` and click **Start**.

Do this a day or two before any demo.

## Troubleshooting

| Problem | Fix |
|---|---|
| Sideloadly doesn't see the phone | Use the web iTunes (not the Microsoft Store one), unlock the phone, tap Trust, try another cable or port. |
| "Untrusted Developer" when opening the app | Settings › General › VPN & Device Management › your Apple ID › Trust. |
| App won't open / "no longer available" | The 7 days are up. Re-sign with Sideloadly. |
| Developer Mode option missing | It appears after the first Sideloadly install. Check again. |
| Glasses don't connect | Check that Bluetooth is on and Sentio has Bluetooth access in Settings › Sentio. Keep the glasses close and reopen the app. |
| Sideloadly 2FA / password error | Use your normal Apple ID password and enter the code that pops up on your iPhone. Make sure iCloud for Windows is the web version. |
| Limit of 3 apps / 10 app IDs per week | Free Apple ID limit. Remove other sideloaded apps, or wait a week. |

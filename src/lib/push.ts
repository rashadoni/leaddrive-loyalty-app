/**
 * Native push registration for the loyalty app.
 *
 * After sign-in we ask permission, fetch this device's Expo push token, and
 * register it with the backend (`/portal-push-register`) so the loyalty earn
 * hooks can notify the member. Requires a physical device + an EAS projectId
 * (set by `eas init` — Slice 4). Until EAS is configured, `registerForPush`
 * no-ops gracefully (logs + returns null), so the rest of the app is unaffected.
 */
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import Constants from "expo-constants"
import { registerPushToken, unregisterPushToken } from "./api"

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
}

/**
 * Register for push. Returns the Expo token on success, or null when push can't
 * be set up (simulator, denied permission, or no EAS projectId yet). Never
 * throws — push is best-effort.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null // push needs a real device

    const existing = await Notifications.getPermissionsAsync()
    let status = existing.status
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status
    }
    if (status !== "granted") return null

    const projectId = getProjectId()
    if (!projectId) {
      console.warn("[push] no EAS projectId yet — run `eas init` (Slice 4) to enable push")
      return null
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    await registerPushToken(token).catch((e) => console.warn("[push] backend register failed:", e))
    return token
  } catch (e) {
    console.warn("[push] registerForPush failed:", e)
    return null
  }
}

/**
 * Remove this device's token on sign-out, so the previous member stops getting
 * pushes if someone else signs in on the same device. Best-effort, never throws.
 * MUST run BEFORE the JWT is cleared (the DELETE needs the Bearer).
 */
export async function unregisterForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return
    const projectId = getProjectId()
    if (!projectId) return
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") return
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    await unregisterPushToken(token)
  } catch (e) {
    console.warn("[push] unregisterForPush failed:", e)
  }
}

/**
 * Platform-safe token storage.
 *
 * Native (iOS/Android) → expo-secure-store (Keychain / Keystore) — the real,
 * encrypted store for the JWT. Web (used only for local dev preview) →
 * localStorage, since SecureStore has no web implementation. Production members
 * are always on native, where the token is hardware-backed.
 */
import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null
  }
  return SecureStore.getItemAsync(key)
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}

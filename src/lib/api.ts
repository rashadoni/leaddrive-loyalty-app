/**
 * Typed API client for the public loyalty member endpoints.
 *
 * Auth is token-based (NOT the web's httpOnly cookie): the JWT lives in
 * expo-secure-store and is sent as `Authorization: Bearer`. The login endpoint
 * returns the token in the body — this requires the Phase-0 backend change
 * (token-login + Bearer acceptance in getPortalUser); until that lands, login
 * will report "token endpoint pending".
 */
import { API_BASE, TOKEN_KEY } from "./config"
import { getItem, setItem, deleteItem } from "./storage"

/* ── Response shapes (mirror /api/v1/public/portal-loyalty) ───────────── */

export interface LoyaltyTierInfo {
  code: string | null
  name: string | null
  multiplier: number
  minLifetimePoints: number
}
export interface LoyaltyData {
  account: { points: number; lifetimePoints: number; tier: string | null; tierName: string | null }
  tier: {
    current: LoyaltyTierInfo | null
    next: LoyaltyTierInfo | null
    /** null when there is no next tier (member is at the top). */
    pointsToNext: number | null
    progressPct: number
  }
  benefits?: string[]
  history: { type: string; delta: number; reason: string | null; createdAt: string }[]
  rewards: {
    id: string
    name: string
    description: string | null
    pointsCost: number
    affordable: boolean
    soldOut: boolean
  }[]
  card: { memberName: string; memberNumber: string; qrDataUrl: string | null } | null
}
export type LoyaltyResponse =
  | { success: true; enabled: false }
  | { success: true; enabled: true; data: LoyaltyData }

/* ── Token helpers ────────────────────────────────────────────────────── */

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY)
}
export async function setToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token)
}
export async function clearToken(): Promise<void> {
  await deleteItem(TOKEN_KEY)
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/* ── Endpoints ────────────────────────────────────────────────────────── */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Exchange email+password for a JWT. The Phase-0 backend returns `{ token }` in
 * the body; if it's absent (old cookie-only endpoint), we surface a clear error
 * so the app fails loud rather than silently "logging in" with no token.
 */
export async function login(email: string, password: string): Promise<string> {
  // Real route is /portal-auth (verified against the deployed backend). It sets
  // the JWT as an httpOnly cookie today; Phase 0 makes it ALSO return the token
  // in the body for native clients. Until then `body.token` is absent → we throw.
  const r = await fetch(`${API_BASE}/api/v1/public/portal-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, body?.error || "Login failed")
  if (typeof body?.token !== "string" || !body.token) {
    throw new ApiError(501, "Token login not enabled on the server yet (Phase 0 backend pending)")
  }
  await setToken(body.token)
  return body.token
}

export async function fetchLoyalty(): Promise<LoyaltyResponse> {
  const r = await fetch(`${API_BASE}/api/v1/public/portal-loyalty`, {
    headers: { ...(await authHeaders()) },
  })
  if (r.status === 401) throw new ApiError(401, "Not signed in")
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, body?.error || "Failed to load loyalty")
  return body as LoyaltyResponse
}

export interface RedeemResult {
  success: true
  redemptionId: string
  remainingPoints: number
  reward: { name: string; pointsSpent: number }
}
export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const r = await fetch(`${API_BASE}/api/v1/public/portal-redeem`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ rewardId }),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, body?.error || "Redeem failed")
  return body as RedeemResult
}

/** Register this device's Expo push token so the loyalty earn hooks can notify it. */
export async function registerPushToken(expoPushToken: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/v1/public/portal-push-register`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ expoPushToken }),
  })
  if (!r.ok) throw new ApiError(r.status, "Push registration failed")
}

/** Unregister this device's token (call on sign-out). */
export async function unregisterPushToken(expoPushToken: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/public/portal-push-register`, {
    method: "DELETE",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ expoPushToken }),
  }).catch(() => {})
}

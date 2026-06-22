/**
 * Backend + storage config for the LeadDrive Loyalty member app.
 *
 * API_BASE points at the same multi-tenant CRM backend the web portal uses;
 * the member's tenant (org) is resolved server-side from their JWT, so a single
 * app build serves ALL tenants (no per-tenant build). Override per environment
 * later via app.json `extra` / EAS env vars.
 */
export const API_BASE = "https://app.leaddrivecrm.org"

/** expo-secure-store key for the portal JWT (Keychain on iOS / Keystore on Android). */
export const TOKEN_KEY = "ld_portal_token"

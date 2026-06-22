/**
 * Auth context — holds the member's signed-in state.
 *
 * On launch we restore the JWT from secure storage (no network) so a returning
 * member skips the login screen. `signIn` exchanges credentials for a token via
 * the API; `signOut` clears it. The token itself never leaves expo-secure-store
 * except as a Bearer header inside the api client.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { login as apiLogin, getToken, clearToken } from "./api"

interface AuthState {
  /** true once the launch-time token restore has finished. */
  ready: boolean
  /** true when a token is present (member is signed in). */
  signedIn: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    getToken()
      .then((t) => setSignedIn(!!t))
      .finally(() => setReady(true))
  }, [])

  async function signIn(email: string, password: string) {
    await apiLogin(email, password) // stores the token on success or throws
    setSignedIn(true)
  }

  async function signOut() {
    await clearToken()
    setSignedIn(false)
  }

  return <AuthContext.Provider value={{ ready, signedIn, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}

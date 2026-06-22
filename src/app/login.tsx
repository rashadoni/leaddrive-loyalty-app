import { useState } from "react"
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native"
import { Redirect, useRouter } from "expo-router"
import { useAuth } from "../lib/auth"

export default function LoginScreen() {
  const { ready, signedIn, signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // already signed in → straight to the card
  if (ready && signedIn) return <Redirect href="/" />

  async function onSubmit() {
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      router.replace("/")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <Text style={styles.brand}>LeadDrive</Text>
        <Text style={styles.title}>Loyalty</Text>
        <Text style={styles.subtitle}>Sign in to see your points and rewards</Text>

        <TextInput
          style={styles.input}
          placeholder="you@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, (busy || !email || !password) && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={busy || !email || !password}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 12 },
  brand: { fontSize: 18, fontWeight: "700", color: "#ea580c", textAlign: "center" },
  title: { fontSize: 34, fontWeight: "800", textAlign: "center", marginTop: -4 },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { color: "#dc2626", fontSize: 13, textAlign: "center" },
  button: {
    backgroundColor: "#ea580c",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
})

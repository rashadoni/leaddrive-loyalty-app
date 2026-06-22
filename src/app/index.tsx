import { useCallback, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, RefreshControl } from "react-native"
import { Redirect, useRouter, useFocusEffect } from "expo-router"
import QRCode from "react-native-qrcode-svg"
import { useAuth } from "../lib/auth"
import { fetchLoyalty, type LoyaltyData } from "../lib/api"

export default function CardScreen() {
  const { ready, signedIn, signOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await fetchLoyalty()
      if (r.enabled) setData(r.data)
      else setError("Loyalty isn't enabled for your account yet.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your loyalty info")
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (signedIn) load()
    }, [signedIn, load]),
  )

  if (!ready) return <Centered><ActivityIndicator color="#ea580c" /></Centered>
  if (!signedIn) return <Redirect href="/login" />

  const acct = data?.account
  const tier = data?.tier
  const card = data?.card

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#ea580c" />}
    >
      {/* Membership card */}
      <View style={styles.card}>
        <Text style={styles.cardBrand}>LeadDrive Loyalty</Text>
        <Text style={styles.points}>{acct?.points?.toLocaleString() ?? "—"}</Text>
        <Text style={styles.pointsLabel}>points</Text>
        {tier?.current?.name && <Text style={styles.tier}>{tier.current.name} tier</Text>}
        <View style={styles.qrWrap}>
          {card?.memberNumber ? (
            <QRCode value={card.memberNumber} size={140} />
          ) : (
            <Text style={styles.qrPlaceholder}>QR appears once signed in</Text>
          )}
        </View>
        {card?.memberNumber && <Text style={styles.memberNo}>{card.memberNumber}</Text>}
      </View>

      {/* Tier progress */}
      {tier?.next && (
        <View style={styles.progressBox}>
          <Text style={styles.progressText}>
            {(tier.pointsToNext ?? 0).toLocaleString()} pts to {tier.next.name}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, tier.progressPct)}%` }]} />
          </View>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Nav */}
      <Pressable style={styles.navBtn} onPress={() => router.push("/rewards")}>
        <Text style={styles.navBtnText}>Spend your points →</Text>
      </Pressable>
      <Pressable style={styles.navBtnGhost} onPress={() => router.push("/history")}>
        <Text style={styles.navBtnGhostText}>Activity history</Text>
      </Pressable>
      <Pressable style={styles.signOut} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: 20, gap: 16 },
  card: {
    backgroundColor: "#ea580c",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 2,
  },
  cardBrand: { color: "#fff", opacity: 0.9, fontWeight: "600", marginBottom: 8 },
  points: { color: "#fff", fontSize: 48, fontWeight: "800" },
  pointsLabel: { color: "#fff", opacity: 0.9, marginTop: -6 },
  tier: { color: "#fff", fontWeight: "700", marginTop: 6 },
  qrWrap: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    minHeight: 172,
    minWidth: 172,
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholder: { color: "#9ca3af", textAlign: "center", width: 140 },
  memberNo: { color: "#fff", opacity: 0.9, marginTop: 10, letterSpacing: 1 },
  progressBox: { gap: 6 },
  progressText: { color: "#6b7280", fontSize: 13 },
  progressTrack: { height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#ea580c", borderRadius: 4 },
  error: { color: "#dc2626", fontSize: 13, textAlign: "center" },
  navBtn: { backgroundColor: "#ea580c", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  navBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  navBtnGhost: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  navBtnGhostText: { color: "#111827", fontWeight: "600" },
  signOut: { alignItems: "center", paddingVertical: 8 },
  signOutText: { color: "#9ca3af" },
})

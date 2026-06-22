import { useCallback, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Pressable, Alert } from "react-native"
import { Redirect, useFocusEffect } from "expo-router"
import { useAuth } from "../lib/auth"
import { fetchLoyalty, redeemReward, type LoyaltyData } from "../lib/api"

type Reward = LoyaltyData["rewards"][number]

export default function RewardsScreen() {
  const { ready, signedIn } = useAuth()
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await fetchLoyalty()
      if (r.enabled) setData(r.data)
      else setError("Loyalty isn't enabled yet.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load rewards")
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (signedIn) load()
    }, [signedIn, load]),
  )

  async function redeem(reward: Reward) {
    setBusyId(reward.id)
    try {
      const res = await redeemReward(reward.id)
      Alert.alert("Redeemed 🎉", `${res.reward.name} — ${res.remainingPoints.toLocaleString()} pts left`)
      await load()
    } catch (e) {
      Alert.alert("Couldn't redeem", e instanceof Error ? e.message : "Try again")
    } finally {
      setBusyId(null)
    }
  }

  if (!ready) return <View style={styles.centered}><ActivityIndicator color="#ea580c" /></View>
  if (!signedIn) return <Redirect href="/login" />

  return (
    <View style={styles.flex}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        contentContainerStyle={styles.list}
        data={data?.rewards ?? []}
        keyExtractor={(r) => r.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          loading ? null : <Text style={styles.empty}>No rewards available yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              <Text style={styles.cost}>{item.pointsCost.toLocaleString()} pts</Text>
            </View>
            <Pressable
              style={[styles.btn, (!item.affordable || item.soldOut || busyId === item.id) && styles.btnDisabled]}
              disabled={!item.affordable || item.soldOut || busyId === item.id}
              onPress={() => redeem(item)}
            >
              {busyId === item.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{item.soldOut ? "Sold out" : !item.affordable ? "Need more" : "Redeem"}</Text>
              )}
            </Pressable>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 10 },
  error: { color: "#dc2626", fontSize: 13, textAlign: "center", padding: 12 },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
  },
  rowInfo: { flex: 1, gap: 2 },
  name: { fontWeight: "700", fontSize: 15 },
  desc: { color: "#6b7280", fontSize: 13 },
  cost: { color: "#ea580c", fontWeight: "700", marginTop: 2 },
  btn: { backgroundColor: "#ea580c", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, minWidth: 92, alignItems: "center" },
  btnDisabled: { backgroundColor: "#d1d5db" },
  btnText: { color: "#fff", fontWeight: "700" },
})

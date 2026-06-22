import { useCallback, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from "react-native"
import { Redirect, useFocusEffect } from "expo-router"
import { useAuth } from "../lib/auth"
import { fetchLoyalty, type LoyaltyData } from "../lib/api"

type Row = LoyaltyData["history"][number]

export default function HistoryScreen() {
  const { ready, signedIn } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await fetchLoyalty()
      if (r.enabled) setRows(r.data.history)
      else setError("Loyalty isn't enabled yet.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load history")
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (signedIn) load()
    }, [signedIn, load]),
  )

  if (!ready) return <View style={styles.centered}><ActivityIndicator color="#ea580c" /></View>
  if (!signedIn) return <Redirect href="/login" />

  return (
    <View style={styles.flex}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        contentContainerStyle={styles.list}
        data={rows}
        keyExtractor={(_, i) => String(i)}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={loading ? null : <Text style={styles.empty}>No activity yet.</Text>}
        renderItem={({ item }) => {
          const positive = item.delta >= 0
          return (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.reason}>{item.reason || item.type}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.delta, { color: positive ? "#16a34a" : "#dc2626" }]}>
                {positive ? "+" : ""}
                {item.delta.toLocaleString()}
              </Text>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 8 },
  error: { color: "#dc2626", fontSize: 13, textAlign: "center", padding: 12 },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 12,
  },
  rowInfo: { flex: 1, gap: 2 },
  reason: { fontWeight: "600", fontSize: 14 },
  date: { color: "#9ca3af", fontSize: 12 },
  delta: { fontWeight: "800", fontSize: 16, fontVariant: ["tabular-nums"] },
})

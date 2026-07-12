import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getListing } from "@/api/client";
import { formatArea, formatGs, formatOperation, formatUsd } from "@/lib/format";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la propiedad.</Text>
      </View>
    );
  }

  const contact = listing.agent ?? listing.agency;
  const whatsapp = contact?.whatsapp?.replace(/[^\d]/g, "");

  return (
    <ScrollView>
      {listing.coverImage && (
        <Image source={{ uri: listing.coverImage.url }} style={styles.hero} />
      )}
      <View style={styles.body}>
        <Text style={styles.price}>{formatUsd(listing.priceUsd)}</Text>
        {listing.cuotaGs != null && (
          <Text style={styles.cuota}>Cuota desde {formatGs(listing.cuotaGs)}/mes</Text>
        )}
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>
          {listing.locationName} · {formatOperation(listing.operation)}
        </Text>
        <View style={styles.factsRow}>
          {listing.bedrooms != null && <Fact label="Dormitorios" value={String(listing.bedrooms)} />}
          {listing.bathrooms != null && <Fact label="Baños" value={String(listing.bathrooms)} />}
          {listing.parking != null && <Fact label="Cocheras" value={String(listing.parking)} />}
          {formatArea(listing.areaM2) && <Fact label="Superficie" value={formatArea(listing.areaM2)!} />}
          {formatArea(listing.landM2) && <Fact label="Terreno" value={formatArea(listing.landM2)!} />}
        </View>
        {listing.descriptionEs && <Text style={styles.description}>{listing.descriptionEs}</Text>}

        {whatsapp && (
          <Pressable
            style={styles.whatsappButton}
            onPress={() =>
              Linking.openURL(
                `https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Hola, me interesa "${listing.title}" (propia.com.py)`,
                )}`,
              )
            }
          >
            <Text style={styles.whatsappButtonText}>Contactar por WhatsApp</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { width: "100%", height: 280, backgroundColor: "#e2e8f0" },
  body: { padding: 16, gap: 4 },
  price: { fontSize: 24, fontWeight: "700", color: "#0B1B2B" },
  cuota: { fontSize: 14, color: "#16a34a", marginBottom: 4 },
  title: { fontSize: 17, fontWeight: "600", color: "#1e293b", marginTop: 4 },
  meta: { fontSize: 14, color: "#64748b", marginBottom: 12 },
  factsRow: { flexDirection: "row", flexWrap: "wrap", gap: 20, marginBottom: 16 },
  fact: { minWidth: 70 },
  factValue: { fontSize: 16, fontWeight: "600", color: "#0B1B2B" },
  factLabel: { fontSize: 12, color: "#64748b" },
  description: { fontSize: 14, color: "#334155", lineHeight: 20, marginBottom: 20 },
  whatsappButton: {
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  whatsappButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

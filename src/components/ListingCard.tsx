import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import type { ListingSummary } from "@/types/listing";
import { formatArea, formatOperation, formatUsd } from "@/lib/format";

export function ListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <Link href={`/listing/${listing.publicId}`} asChild>
      <Pressable style={styles.card}>
        {listing.coverImage ? (
          <Image source={{ uri: listing.coverImage.url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={styles.body}>
          <Text style={styles.price}>{formatUsd(listing.priceUsd)}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={styles.meta}>
            {listing.locationName} · {formatOperation(listing.operation)}
          </Text>
          <Text style={styles.meta}>
            {[
              listing.bedrooms != null ? `${listing.bedrooms} dorm` : null,
              listing.bathrooms != null ? `${listing.bathrooms} baños` : null,
              formatArea(listing.areaM2 ?? listing.landM2),
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { width: "100%", height: 180, backgroundColor: "#e2e8f0" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  body: { padding: 12, gap: 2 },
  price: { fontSize: 18, fontWeight: "700", color: "#0B1B2B" },
  title: { fontSize: 15, fontWeight: "500", color: "#1e293b" },
  meta: { fontSize: 13, color: "#64748b" },
});

import { FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getListings } from "@/api/client";
import { ListingCard } from "@/components/ListingCard";

export default function HomeScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["listings"],
    queryFn: () => getListings({}),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>No se pudieron cargar las propiedades.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(item) => item.publicId}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <ListingCard listing={item} />}
      ListHeaderComponent={
        <Text style={styles.count}>{data?.total ?? 0} propiedades</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  count: { fontSize: 13, color: "#64748b", marginBottom: 12 },
});

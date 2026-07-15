import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getListings } from "@/api/client";
import { ListingCard } from "@/components/ListingCard";
import { FilterBar, type FilterState } from "@/components/FilterBar";

const INITIAL_FILTERS: FilterState = { operation: null, propertyType: null };

export default function HomeScreen() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const { data, isLoading, error } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () =>
      getListings({
        operation: filters.operation ?? undefined,
        propertyType: filters.propertyType ?? undefined,
      }),
  });

  return (
    <View style={styles.screen}>
      <FilterBar value={filters} onChange={setFilters} />

      {isLoading ? (
        <View style={styles.center}>
          <Text>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text>No se pudieron cargar las propiedades.</Text>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.publicId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ListingCard listing={item} />}
          ListHeaderComponent={
            <Text style={styles.count}>{data?.total ?? 0} propiedades</Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No hay propiedades con estos filtros.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 40 },
  count: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  empty: { fontSize: 14, color: "#64748b" },
});

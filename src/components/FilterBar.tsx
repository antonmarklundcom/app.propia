import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Operation, PropertyType } from "@/types/listing";

const OPERATIONS: { value: Operation | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

const PROPERTY_TYPES: { value: PropertyType | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Depto" },
  { value: "terreno", label: "Terreno" },
  { value: "duplex", label: "Dúplex" },
  { value: "comercial", label: "Comercial" },
];

export interface FilterState {
  operation: Operation | null;
  propertyType: PropertyType | null;
}

export function FilterBar({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <View style={styles.container}>
      <ChipRow
        options={OPERATIONS}
        selected={value.operation}
        onSelect={(operation) => onChange({ ...value, operation })}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
        <ChipRow
          options={PROPERTY_TYPES}
          selected={value.propertyType}
          onSelect={(propertyType) => onChange({ ...value, propertyType })}
        />
      </ScrollView>
    </View>
  );
}

function ChipRow<T extends string | null>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onSelect(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  typeRow: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  chipActive: { backgroundColor: "#0B1B2B" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#334155" },
  chipTextActive: { color: "#fff" },
});

/** es-PY formatting, mirrors propia.node's src/lib/format.ts conventions. */

export function formatUsd(amount: number): string {
  return `US$ ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
}

export function formatGs(amount: number): string {
  return `₲ ${amount.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
}

export function formatArea(m2: number | null): string | null {
  if (m2 == null) return null;
  return `${m2.toLocaleString("es-PY", { maximumFractionDigits: 0 })} m²`;
}

const OPERATION_LABEL: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

export function formatOperation(operation: string): string {
  return OPERATION_LABEL[operation] ?? operation;
}

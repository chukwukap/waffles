// Shared date range utilities - can be used on both server and client

export const DATE_PRESETS = [
  { label: "7D", value: "7d", days: 7 },
  { label: "14D", value: "14d", days: 14 },
  { label: "30D", value: "30d", days: 30 },
  { label: "90D", value: "90d", days: 90 },
  { label: "All", value: "all", days: null },
] as const;

export function getDateRangeFromParam(range: string): {
  start: Date;
  end: Date;
  label: string;
} {
  const end = new Date();
  const preset = DATE_PRESETS.find((p) => p.value === range) || DATE_PRESETS[0];

  if (preset.days === null) {
    // All time - start from Jan 1, 2024
    return {
      start: new Date("2024-01-01"),
      end,
      label: "All Time",
    };
  }

  const start = new Date(end.getTime() - preset.days * 24 * 60 * 60 * 1000);
  return {
    start,
    end,
    label: `Last ${preset.days} days`,
  };
}

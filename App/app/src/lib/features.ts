export const FEATURES = {
  WAITER: "waiter",
  KITCHEN: "kitchen",
  DASHBOARD: "dashboard",
  STOCK: "stock",
} as const;

export type FeatureKey =
  (typeof FEATURES)[keyof typeof FEATURES];

export function hasFeature(
  feature: FeatureKey,
): boolean {
  const raw =
    localStorage.getItem("features");

  if (!raw) {
    return false;
  }

  try {
    const features =
      JSON.parse(raw);

    return Array.isArray(features)
      ? features.includes(feature)
      : false;
  } catch {
    return false;
  }
}

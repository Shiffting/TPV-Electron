export const FEATURES = Object.freeze({
  WAITER: "waiter",
  KITCHEN: "kitchen",
  DASHBOARD: "dashboard",
  STOCK: "stock",
});

export const FEATURE_VALUES = Object.freeze(
  Object.values(FEATURES),
);

export function isKnownFeature(feature) {
  return FEATURE_VALUES.includes(feature);
}

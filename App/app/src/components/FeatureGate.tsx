import {
  Navigate,
} from "react-router-dom";

import {
  getFeatures,
} from "../lib/auth";

import type {
  FeatureKey,
} from "../lib/features";

type Props = {
  feature: FeatureKey;
  children: React.ReactNode;
};

export default function FeatureGate({
  feature,
  children,
}: Props) {
  const features =
    getFeatures();

  if (!features.includes(feature)) {
    return (
      <Navigate
        to="/app/mesas"
        replace
      />
    );
  }

  return <>{children}</>;
}

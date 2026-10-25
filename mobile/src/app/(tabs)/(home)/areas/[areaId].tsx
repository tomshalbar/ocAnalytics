import { useLocalSearchParams } from "expo-router";

import { AreaDetailsScreen } from "@/features/area-details/area-details-screen";

export default function AreaDetailsRoute() {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  return <AreaDetailsScreen areaId={areaId} />;
}

import { useEffect, useMemo, useState } from "react";

import { Screen } from "@/components/layout/screen";
import { ScreenHeading } from "@/components/layout/screen-heading";
import { Section } from "@/components/layout/section";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { EmptyState } from "@/components/ui/empty-state";
import { areaForLocation } from "@/data/adapters/locations";
import { useLocations } from "@/data/api/use-locations";
import { useLocationForecasts } from "@/data/api/use-location-forecasts";
import {
  facilityFilterId,
  facilityFilterOptions,
} from "@/data/reference/source-facilities";
import { RequestState } from "@/features/areas/request-state";
import { RecommendationCard } from "./components/recommendation-card";
import { buildPlanOptions, filterPlanOptions } from "./plan-options";

export function PlanScreen() {
  const locations = useLocations();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const forecasts = useLocationForecasts(
    locations.rows.map((row) => String(row.LocationId)),
  );
  const planOptions = useMemo(
    () => buildPlanOptions(forecasts.data?.forecasts ?? [], now),
    [forecasts.data, now],
  );
  const facilityOptions = facilityFilterOptions(
    locations.rows.map((row) => facilityFilterId(row.FacilityId)),
  );
  const facilityId = facilityOptions.some(
    (option) => option.value === selectedFacilityId,
  )
    ? selectedFacilityId
    : facilityOptions[0]?.value;
  const visibleOptions = filterPlanOptions(
    planOptions,
    locations.rows,
    facilityId,
    "all",
  );
  const unavailable = forecasts.data?.unavailableLocationIds ?? [];
  const error =
    locations.error ??
    forecasts.error ??
    (unavailable.length
      ? `Predictions are unavailable for ${unavailable.length} ${unavailable.length === 1 ? "location" : "locations"}. Pull to refresh or retry; suggestions use available forecasts only.`
      : null);
  const loading = locations.loading || forecasts.loading;
  const refresh = () => {
    locations.refresh();
    forecasts.refresh();
    setNow(Date.now());
  };

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <ScreenHeading
        title="Plan your visit"
        subtitle="Find the lowest predicted occupancy over the next 24 hours."
      />
      {(loading || error) && (
        <RequestState loading={loading} error={error} refresh={refresh} />
      )}
      {facilityOptions.length > 0 && (
        <Section title="Location">
          <ChoiceGroup
            label="Source facility"
            options={facilityOptions}
            value={facilityId!}
            onChange={setSelectedFacilityId}
          />
        </Section>
      )}
      <Section
        title="Suggested times"
        description={`${visibleOptions.length} suggested ${visibleOptions.length === 1 ? "visit" : "visits"}, lowest predicted count first. Best hour per location each day, in your local time zone. Predictions do not confirm opening hours.`}
      >
        {visibleOptions.map(({ recommendation, locationId: id }) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            areaName={areaForLocation(Number(id)).name}
          />
        ))}
        {!loading && !error && visibleOptions.length === 0 && (
          <EmptyState
            title="No matching visits"
            description="No future forecast times match this facility. Try another facility or Both, or pull to refresh predictions."
          />
        )}
      </Section>
    </Screen>
  );
}

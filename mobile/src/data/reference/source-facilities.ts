export function facilityFilterId(facilityId: number | null): string {
  if (facilityId === 596) return "Southwest Rec";
  return facilityId === 597 || facilityId === 725
    ? "Student Rec"
    : String(facilityId ?? "unknown");
}

export function facilityFilterOptions(facilityIds: Iterable<string>) {
  const options = Array.from(new Set(facilityIds), (id) => ({
    value: id,
    label: id === "unknown" ? "Not provided" : id,
  }));
  return options.length ? [...options, { value: "all", label: "Both" }] : [];
}

export function matchesFacilityFilter(
  facilityId: string,
  selectedFacilityId: string | undefined,
) {
  return selectedFacilityId === "all" || facilityId === selectedFacilityId;
}

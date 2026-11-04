export function facilityFilterId(facilityId: number | null): string {
  if (facilityId === 596) return "Southwest Rec";
  return facilityId === 597 || facilityId === 725
    ? "Student Rec"
    : String(facilityId ?? "unknown");
}

"""Explicit API contracts; preserve upstream field names for existing clients."""
from datetime import datetime
from pydantic import BaseModel


class Observation(BaseModel):
    id: int
    LocationId: int
    FacilityId: int | None
    CountOfParticipants: int | None
    PercetageCapacity: float | None
    LastCount: int | None
    IsClosed: bool | None
    LastUpdatedDateAndTime: datetime | None
    runDatetime: datetime
    is_stale: bool
    collection_is_stale: bool


class Statistics(BaseModel):
    total_readings: int
    average_count: float | None
    minimum_count: int | None
    maximum_count: int | None


class StatisticsResponse(BaseModel):
    location_id: int
    start: datetime
    end: datetime
    statistics: Statistics

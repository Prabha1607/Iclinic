from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional
from src.data.models.postgres.ENUM import AppointmentStatus, BookingChannel


class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    provider_id: int
    appointment_type_id: int
    availability_slot_id: int

    patient_name: str

    scheduled_date: date
    scheduled_start_time: time
    scheduled_end_time: time

    status: AppointmentStatus

    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None

    booking_channel: Optional[BookingChannel] = None
    instructions: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


        
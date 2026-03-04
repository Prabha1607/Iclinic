from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.rest.dependencies import get_db
from src.data.repositories.generic_crud import bulk_get_instance
from src.data.models.postgres.appointment import Appointment

from src.schemas.appointment_booking import AppointmentResponse


router = APIRouter(prefix="/booking", tags=["Booking"])


@router.get("/user/{user_id}", response_model=list[AppointmentResponse])
async def get_user_appointments(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:

        appointments = await bulk_get_instance(
            model=Appointment,
            db=db,
            user_id=user_id
        )

        if not appointments:
            return []

        return appointments

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user appointments"
        )
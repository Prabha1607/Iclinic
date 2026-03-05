from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from src.api.rest.dependencies import get_db
from src.data.repositories.generic_crud import bulk_get_instance
from src.data.models.postgres.appointment import Appointment
from src.schemas.appointment_booking import AppointmentResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/booking", tags=["Booking"])


@router.get("/user/{user_id}", response_model=list[AppointmentResponse])
async def get_user_appointments(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    logger.info("Fetching appointments", extra={"user_id": user_id})

    try:
        appointments = await bulk_get_instance(
            model=Appointment,
            db=db,
            user_id=user_id
        )

        if not appointments:
            logger.warning("No appointments found", extra={"user_id": user_id})
            return []

        logger.info("Appointments fetched successfully", extra={"user_id": user_id, "count": len(appointments)})
        return appointments

    except HTTPException:
        raise

    except Exception as e:
        logger.error("Failed to fetch appointments", extra={"user_id": user_id, "error": str(e)})
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user appointments"
        )
    
@router.get("/appointments", response_model=list[AppointmentResponse])
async def get_all_appointments(db: AsyncSession = Depends(get_db)):

    logger.info("Fetching all appointments")

    try:
        appointments = await bulk_get_instance(
            model=Appointment,
            db=db
        )

        if not appointments:
            logger.warning("No appointments found")
            return []

        logger.info("Appointments fetched successfully", extra={"count": len(appointments)})
        return appointments

    except HTTPException:
        raise

    except Exception as e:
        logger.error("Failed to fetch appointments", extra={"error": str(e)})
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch appointments"
        )


        


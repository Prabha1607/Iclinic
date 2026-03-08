from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.data.models.postgres.user import PatientProfile, User

async def get_patients(
    db: AsyncSession,
    page: int,
    page_size: int,
    is_active: bool | None = None,
):

    stmt = (
        select(User)
        .where(User.role_id == 1)
        .options(selectinload(User.patient_profile))
    )

    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)

    return result.scalars().all()

async def get_all_providers(
    db: AsyncSession,
    page: int,
    page_size: int,
    is_active: bool | None
):
    stmt = (
        select(User)
        .where(User.role_id == 2)
        .options(selectinload(User.provider_profile))
    )

    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)

    return result.scalars().all()

from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def get_providers_by_type_repo(
    db: AsyncSession,
    appointment_type_id: int,
    is_active: bool | None = None
):

    stmt = (
        select(User)
        .where(
            User.role_id == 2,
            User.appointment_type_id == appointment_type_id
        )
        .options(selectinload(User.provider_profile))
    )

    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    result = await db.execute(stmt)

    return result.scalars().all()


from sqlalchemy import insert, select
from sqlalchemy.orm import selectinload


async def create_patient_repo(
    db: AsyncSession,
    user_data: dict
):

    try:
        # create user
        user = User(**user_data)

        db.add(user)
        await db.flush()  # get user.id

        # create patient profile
        patient_profile = PatientProfile(
            user_id=user.id
        )

        db.add(patient_profile)

        await db.commit()

        # reload with relationship
        stmt = (
            select(User)
            .where(User.id == user.id)
            .options(selectinload(User.patient_profile))
        )

        result = await db.execute(stmt)

        return result.scalar_one()

    except Exception:
        await db.rollback()
        raise Exception("Failed to create patient")
    
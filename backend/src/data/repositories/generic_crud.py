from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError , IntegrityError
from typing import List, Type
from sqlalchemy import select, update, delete , insert , and_
from src.data.repositories.common_commit import commit_transaction

# stmt
# SQL Statement object
# It is just a variable name that stores a SQL query built by SQLAlchemy.


async def insert_instance(
    model: Type, 
    db: AsyncSession, 
    **kwargs
):
    try:
        stmt = insert(model).values(**kwargs)
        await db.execute(stmt)
        await commit_transaction(db=db)

    except IntegrityError:
        await db.rollback()
        raise

    except SQLAlchemyError as e:
        await db.rollback()
        raise 

async def bulk_insert_instance(
    model: Type, 
    db: AsyncSession, 
    data: list[dict]
):
    try:

        stmt = insert(model)
        await db.execute(stmt,data)
        await commit_transaction(db=db)
    
    except SQLAlchemyError as e:
        await db.rollback()
        raise Exception(f"Bulk insert failed: {str(e)}")

async def update_instance(
    id : int, 
    model: Type, 
    db: AsyncSession, 
    **kwargs
):
    try:
        stmt = update(model).where(model.id == id).values(**kwargs)

        result = await db.execute(stmt)
        
        if result.rowcount == 0:
            raise Exception("Record not found")

        await commit_transaction(db=db)
    
    except SQLAlchemyError as e:
        await db.rollback()
        raise Exception(f"Update failed: {str(e)}")

async def Bulk_update_instance( 
    model: Type, 
    db: AsyncSession, 
    filter : dict , 
    data : dict
):

    try:
        stmt = update(model)

        for key, value in filter.items():
            stmt = stmt.where(getattr(model,key,value))

        stmt = stmt.values(**data)

        results = await db.execute(stmt)

        if results.rowcount == 0:
            raise Exception("Record not found")

        await commit_transaction(db=db)

    except SQLAlchemyError as e:
        await db.rollback()
        raise Exception(f"Bulk update failed: {str(e)}")

async def delete_instance(
    id : int, 
    model: Type, 
    db: AsyncSession
):
    try:
        stmt = delete(model).where(model.id== id)

        result = await db.execute(stmt)

        if result.rowcount == 0:
            raise Exception("Record not found")
        
        await commit_transaction(db=db)

    except SQLAlchemyError as e:
        await db.rollback()
        raise Exception(f"Update failed: {str(e)}")
    
async def bulk_delete_instance(
    model: Type,
    db: AsyncSession,
    ids: List[int]
):
    try:
        stmt = delete(model).where(model.id.in_(ids))

        result = await db.execute(stmt)

        if result.rowcount == 0:
            raise Exception("No records found to delete")

        await commit_transaction(db=db)

    except SQLAlchemyError as e:
        await db.rollback()
        raise Exception(f"Bulk delete failed: {str(e)}")
    
async def get_instance_by_id(
    id : int, 
    model: Type,
    db: AsyncSession
):

    stmt = select(model).where(model.id == id)

    result = await db.execute(stmt)

    return result.scalar_one_or_none()

async def get_instance_by_any(
    model: Type,
    db: AsyncSession,
    data : dict
):

    conditions = []

    for key, value in data.items():
        column = getattr(model, key)
        conditions.append(column == value)

    stmt = select(model).where(and_(*conditions))

    result = await db.execute(stmt)

    return result.scalar_one_or_none()

async def bulk_get_instance(
    model: Type,
    db: AsyncSession,
    **kwargs
):
    stmt = select(model)

    for key,value in kwargs.items():
        if hasattr(model, key):
            stmt = stmt.where(getattr(model,key) == value)
    result = await db.execute(stmt)

    return result.scalars().all()



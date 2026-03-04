from datetime import datetime,timezone
from fastapi import HTTPException
from sqlalchemy import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from src.config.hashing import get_password_hash
from src.utils.to_uuid import to_uuid
from src.data.models.postgres.refresh_token import RefreshToken
from src.data.repositories.common_commit import commit_transaction
from src.data.repositories.generic_crud import get_instance_by_any, insert_instance , bulk_get_instance
from src.data.models.postgres.role import Role
from src.data.models.postgres.user import User


def is_email(value: str) -> bool:
    return "@" in value


async def create_user(db : AsyncSession,user_data):

    try:
        hashed_password = get_password_hash(user_data.password)

        user_dict = user_data.model_dump()
        user_dict["password"] = hashed_password
        
        await insert_instance(db=db , model=User , **user_dict)

    except HTTPException:
        raise
    except Exception:
        raise Exception("User creation failed")


async def get_user_by_email(email : str , db : AsyncSession):

    try:
        user = await get_instance_by_any(db = db , model = User,data = {"email" : email})
        return user

    except Exception:
        raise Exception("Failed to fetch user by email")


async def get_user_by_phone(phone_no : str , db : AsyncSession):

    try:
        user = await get_instance_by_any(db = db , model = User,data = {"phone_no" : phone_no})
        return user

    except Exception:
        raise Exception("Failed to fetch user by phone")


async def get_user(identifier : str , db : AsyncSession):

    try:
        if is_email(identifier):
            user = await get_user_by_email(identifier, db)
        else:
            user = await get_user_by_phone(identifier, db)
        
        return user

    except Exception:
        raise Exception("Failed to fetch user")


async def is_revoked(jti: UUID ,db : AsyncSession):

    try:
        refresh_token = await get_instance_by_any(model = RefreshToken , db = db , data={"token_id" :jti})

        if not refresh_token:
            return True
        
        if refresh_token.is_revoked:
            return True
        
        if refresh_token.expire_at < datetime.now(timezone.utc):
            refresh_token.is_revoked = True
            await commit_transaction(db=db)
            return True
        
        return False

    except Exception:
        raise Exception("Token validation failed")


async def make_it_revoked(db : AsyncSession,jti: str):

    try:
        uuid_jti = to_uuid(jti)

        refresh_token = await get_instance_by_any(
            model = RefreshToken,
            db = db,
            data = {"token_id": uuid_jti}
        )

        print(refresh_token)

        if not refresh_token:
            raise HTTPException(
                status_code=403,
                detail="Token not found"
            )
        
        if refresh_token.is_revoked:
            return
        
        refresh_token.is_revoked = True

        await commit_transaction(db=db)

    except HTTPException:
        raise
    except Exception:
        raise Exception("Failed to revoke token")


async def insert_refresh_token(db : AsyncSession,jti : str):

    try:
        uuid_jti = to_uuid(jti)
        
        await insert_instance(model = RefreshToken , db=db , **{"token_id" :uuid_jti})
        
        return True

    except Exception:
        raise Exception("Failed to insert refresh token")


async def get_roles(db : AsyncSession):

    try:
        roles = await bulk_get_instance(model = Role , db=db)

        return [{"id": role.id, "name": role.role_name} for role in roles]

    except Exception:
        raise Exception("Failed to fetch roles")
    

    
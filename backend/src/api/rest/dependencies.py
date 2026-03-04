from src.data.clients.postgres_client import AsyncSessionLocal
from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from src.config.jwt_handler import verify_access_token
from src.core.services.user import get_user

async def get_db():

    async with AsyncSessionLocal()  as Session:
        yield Session

  
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Get token from cookie
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Access token missing")

    # Verify token
    payload = await verify_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = payload.get("email")
    phone_no = payload.get("phone_number")
    name = payload.get("name")
    
    return {"email": email, "phone_number": phone_no, "name": name}



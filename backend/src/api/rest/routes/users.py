from fastapi import APIRouter, Depends, Request, Response
from src.core.services.user import get_roles
from src.data.models.postgres.role import Role
from src.api.rest.dependencies import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix = "/users", tags=["Users"])

@router.get("/get_roles")
async def refresh_token(request: Request,response:Response, db: AsyncSession = Depends(get_db)):

    result = await get_roles(db=db)
    
    return result

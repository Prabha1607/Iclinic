from fastapi import APIRouter, Depends, Request, Response
from src.config.hashing import verify_password
from src.config.jwt_handler import create_access_token, create_refresh_token, verify_refresh_token
from src.core.services.user import make_it_revoked, create_user, get_user, insert_refresh_token, is_revoked
from src.api.rest.dependencies import get_db
from src.schemas.user import UserCreate,UserLogin
from src.config.settings import settings
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix = "/auth",tags=["Authentication"])

@router.post("/register")
async def register_user(user_data : UserCreate, db : AsyncSession = Depends(get_db)):

    try:
        await create_user(db = db, user_data=user_data)
        return {"message": "User registered successfully"}

    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Email or phone number already exists"
        )

    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=500,
            detail="Something went wrong"
        )

@router.post("/login")
async def login_user(request: Request,response:Response,user_data : UserLogin,db : AsyncSession = Depends(get_db)):
    try :
        identifier = user_data.identifier
        password = user_data.password

        user = await get_user(identifier, db)
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )
        
        if not verify_password(password,user.password):
                raise HTTPException(
                status_code=401,
                detail="Invalid credentials password not mached"
            )

        payload = {
            "id": user.id,
            "email": user.email,
            "name" : user.first_name + " " + user.last_name,
            "phone_number": user.phone_no
        }
        
        access_data = await create_access_token(payload=payload)
        refresh_data = await create_refresh_token(payload=payload)
        
        access_token = access_data[0]
        refresh_token = refresh_data[0]
        refresh_token_id = refresh_data[1]
        
        await insert_refresh_token(db, refresh_token_id)
        response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="lax",secure=False,max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES*60) 
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, samesite="lax",secure=False,max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86000) 

        return {"message": "Authentication Successfull!!!","access_token": access_token}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail={"msg": "unexpected error occured", "detail": str(e)})

@router.get("/logout")
async def logout(request: Request,response:Response,db: AsyncSession =  Depends(get_db)):
    try:
        refresh_token = request.cookies.get("refresh_token")
        # print(refresh_token)
        if not refresh_token:
            raise HTTPException(status_code=400 , detail = "Refres Token missing")
        
        payload = await verify_refresh_token(refresh_token)

        if payload is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired refresh token"
            )
        jti = payload.get("jti")
        # print(payload)

        await make_it_revoked(db=db , jti=jti)

        response.delete_cookie("refresh_token")
        response.delete_cookie("access_token")
        
        return {"message": "Logout successful"}
    
    except Exception as e:  
        print(str(e))
        raise HTTPException(status_code=400, detail="Invalid token")

@router.post("/refresh")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    payload = await verify_refresh_token(refresh_token)

    if payload is None:
        raise HTTPException(status_code=403, detail="Invalid refresh token")
    
    jti = payload.get("jti")
   
    if await is_revoked(jti=jti, db=db):
        raise HTTPException(status_code=403, detail="Refresh token revoked")

    user_id = payload.get("id")
    email = payload.get("email")
    name = payload.get("name")
    phone_number = payload.get("phone_number")      
    
    token_data = {"email": email, "id": user_id, "name": name, "phone_number": phone_number}
    access_data = await create_access_token(token_data)

    response.set_cookie(key="access_token", value=access_data[0], httponly=True, samesite="lax", secure=False, max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    return {"access_token": access_data[0], "token_type": "bearer"}


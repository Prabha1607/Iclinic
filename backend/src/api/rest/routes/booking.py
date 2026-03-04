from fastapi import APIRouter, Request, Response
from sqlalchemy import String

router = APIRouter()

@router.post("/booking")
def book_an_appointment(request : Request , response : Response , phone_no : String):
    
    return ""
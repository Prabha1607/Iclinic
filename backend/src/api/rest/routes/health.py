from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health"])
def heack_check():
    return { "status" : "healthy", "version" : "1.0.0" }


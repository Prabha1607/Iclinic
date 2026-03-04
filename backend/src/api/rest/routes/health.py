from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/health", tags=["Health"])
def heack_check():
    try:
        return {"status": "healthy", "version": "1.0.0"}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Health check failed"
        )
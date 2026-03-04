import uvicorn
from src.api.rest.app import app  

if __name__ == "__main__":
    uvicorn.run(
        "src.api.rest.app:app",  
        host="127.0.0.1",
        port=8000,
        reload=True
    )
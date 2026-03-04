import re
from pydantic import BaseModel, Field, EmailStr , field_validator

class UserCreate(BaseModel):
    first_name : str  = Field(...,min_length=1, max_length=100,description="First Name of the user")
    last_name : str = Field(...,min_length=1, max_length=100,description="Last Name of the user")
    role_id : int = Field(..., description="Role ID of the user")
    country_code : str = Field(..., pattern=r"^\+\d{1,4}$") 
    email: EmailStr
    phone_no: str = Field(..., pattern=r"^\d{7,15}$")
    password: str = Field(...,description="Password with at least 6 chars, one uppercase, one number, one special symbol.")

    @field_validator("password")
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>/?~]", v):
            raise ValueError("Password must contain at least one special character.")
        return v
    
    model_config = {
        "from_attributes" : True
    }

class UserLogin(BaseModel):
    identifier : str
    password : str

    @field_validator("identifier")
    def validate_identifier(cls , v):
        email_pattern = r"^[^@]+@[^@]+\.[^@]+$"
        phone_pattern = r"^\+?\d{7,15}$"

        if not re.match(email_pattern, v) and not re.match(phone_pattern, v):
            raise ValueError("Identifier must be a valid email or phone number")

        return v
    
    
"""
Pydantic sxemləri — API-yə gələn/gedən datanın forması.
"""
from pydantic import BaseModel, EmailStr, ConfigDict, Field

class UserCreate(BaseModel):
    """Sign Up zamanı gələn data."""
    username: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=36)

class UserLogin(BaseModel):
    """Login zamanı gələn data."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Şifrəni HEÇ VAXT geri qaytarmırıq — yalnız təhlükəsiz sahələr."""
    id: int
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

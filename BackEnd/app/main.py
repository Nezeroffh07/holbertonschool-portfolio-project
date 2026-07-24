from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class User(BaseModel):
    username: str
    email: str
    password: str


@app.get("/")
def home():
    return {"message": "Backend is running"}


@app.post("/signup")
def signup(user: User):
    return {
        "message": "User created successfully",
        "user": user
    }


@app.post("/login")
def login(user: User):
    return {
        "message": "Login successful"
    }
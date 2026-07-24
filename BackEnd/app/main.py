"""
TUP (TeamUp Platform) — Backend
Sprint 1: MVP Foundation
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth_routes

app = FastAPI(
    title="TUP - TeamUp Platform API",
    description="Universitet tələbələri üçün komanda/layihə tapma platforması",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_routes.router)


@app.get("/", tags=["Health"], summary="Backend statusu")
def home():
    return {"message": "TUP Backend is running"}

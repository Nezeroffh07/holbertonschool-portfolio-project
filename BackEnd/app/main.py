"""
TUP (TeamUp Platform) — Backend
Sprint 1: MVP Foundation
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.database import Base, engine
from app.routers import (
    auth_routes,
    skills_routes,
    profile_routes,
    project_routes,
    application_routes,
)

app = FastAPI(
    title="TUP - TeamUp Platform API",
    description="Universitet tələbələri üçün komanda/layihə tapma platforması",
    version="0.2.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_routes.router)
app.include_router(skills_routes.router)
app.include_router(profile_routes.router)
app.include_router(project_routes.router)
app.include_router(application_routes.router)

@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Pydantic validasiya xətalarını (məs. tələb olunan sahə göndərilməyib,
    email formatı səhvdir, mətn çox qısadır/uzundur) frontend üçün daha
    oxunaqlı formada qaytarır.
    """
    errors = [
        {"field": ".".join(str(p) for p in err["loc"][1:]), "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": "Validasiya xətası", "errors": errors},
    )

@app.get("/", tags=["Health"], summary="Backend statusu")
def home():
    return {"message": "TUP Backend is running"}

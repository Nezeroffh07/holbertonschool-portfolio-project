"""
TUP (TeamUp Platform) — Backend
Sprint 3: Feature Completion & Deployment
"""
import os

from fastapi import FastAPI, Request
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
    description=(
        "Universitet tələbələri üçün komanda/layihə tapma platforması.\n\n"
        "**Autentifikasiya:** `/login` endpoint-i JWT `access_token` qaytarır. "
        "Qorunan endpoint-lər üçün Swagger-in yuxarısındakı **Authorize** "
        "düyməsinə basıb tokeni daxil edin."
    ),
    version="0.3.0",
)

# CORS origin-ləri environment variable-dan gəlir (vergüllə ayrılmış siyahı).
# Lokal development üçün default dəyər kifayətdir; production-da Render-də
# ALLOWED_ORIGINS dəyişəni real frontend domeni ilə təyin edilməlidir.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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

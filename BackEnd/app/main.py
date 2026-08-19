"""
TUP (TeamUp Platform) — Backend
Sprint 3: Feature Completion & Deployment
"""
import os
import secrets

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi

from app.database import Base, engine
from app.routers import (
    auth_routes,
    skills_routes,
    profile_routes,
    project_routes,
    application_routes,
    invitation_routes,
    team_routes,
    admin_routes,
    community_routes,
)

# Swagger/ReDoc-u parolla qorumaq (istəyə bağlı).
# DOCS_USERNAME və DOCS_PASSWORD environment variable-ları TƏYİN OLUNMAYIBSA,
# /docs və /redoc adi qaydada, açıq qalır (lokal development rahatlığı üçün).
# Production-da (Render) bu 2 dəyişəni təyin etsəniz, Swagger yalnız həmin
# istifadəçi adı/şifrə ilə açılacaq — HTTP Basic Auth vasitəsilə.
DOCS_USERNAME = os.getenv("DOCS_USERNAME")
DOCS_PASSWORD = os.getenv("DOCS_PASSWORD")
DOCS_PROTECTED = bool(DOCS_USERNAME and DOCS_PASSWORD)

app = FastAPI(
    title="TUP - TeamUp Platform API",
    description=(
        "Universitet tələbələri üçün komanda/layihə tapma platforması.\n\n"
        "**Autentifikasiya:** `/login` endpoint-i JWT `access_token` qaytarır. "
        "Qorunan endpoint-lər üçün Swagger-in yuxarısındakı **Authorize** "
        "düyməsinə basıb tokeni daxil edin."
    ),
    version="0.3.0",
    # DOCS_PROTECTED-dirsə, default (qorunmasız) /docs, /redoc, /openapi.json
    # söndürülür — aşağıda öz qorunan versiyalarımızı əlavə edirik.
    docs_url=None if DOCS_PROTECTED else "/docs",
    redoc_url=None if DOCS_PROTECTED else "/redoc",
    openapi_url=None if DOCS_PROTECTED else "/openapi.json",
)

if DOCS_PROTECTED:
    _security = HTTPBasic()

    def _verify_docs_credentials(credentials: HTTPBasicCredentials = Depends(_security)) -> bool:
        # secrets.compare_digest — timing-attack-a qarşı təhlükəsiz müqayisə
        correct_username = secrets.compare_digest(credentials.username, DOCS_USERNAME)
        correct_password = secrets.compare_digest(credentials.password, DOCS_PASSWORD)
        if not (correct_username and correct_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Yanlış istifadəçi adı və ya şifrə",
                headers={"WWW-Authenticate": "Basic"},
            )
        return True

    @app.get("/openapi.json", include_in_schema=False)
    def get_protected_openapi(_: bool = Depends(_verify_docs_credentials)):
        return get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )

    @app.get("/docs", include_in_schema=False)
    def get_protected_docs(_: bool = Depends(_verify_docs_credentials)):
        return get_swagger_ui_html(
            openapi_url="/openapi.json", title=app.title + " - Swagger UI"
        )

    @app.get("/redoc", include_in_schema=False)
    def get_protected_redoc(_: bool = Depends(_verify_docs_credentials)):
        return get_redoc_html(
            openapi_url="/openapi.json", title=app.title + " - ReDoc"
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
app.include_router(invitation_routes.router)
app.include_router(team_routes.router)
app.include_router(admin_routes.router)
app.include_router(community_routes.router)


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

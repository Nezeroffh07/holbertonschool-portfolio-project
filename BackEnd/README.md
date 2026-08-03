# TUP — TeamUp Platform (Backend)

Universitet tələbələrinin akademik/innovativ layihələr üçün komanda üzvü
tapmasını asanlaşdıran platformanın backend hissəsi.

## Sprint 2 — Core Features Integration

Sprint 1-in (auth) üzərinə əlavə olundu:

- **Skills** — ortaq bacarıq siyahısı (Profile və Project tərəfindən istifadə olunur)
- **Profile** — istifadəçinin bio, universitet/fakültə, portfolio, bacarıqları
- **Project Board** — layihə CRUD-u (yarat/bax/yenilə/sil), axtarış, status və
  bacarığa görə filtrasiya
- **Team Matching** — layihəyə müraciət et, sahib qəbul/rədd etsin, layihə
  boş mövqe qalmayanda avtomatik bağlanır

### ⚠️ Bilərəkdən edilmiş sadələşdirmə (Sprint 3-ə saxlanılıb)

Bu sprintdə **JWT/token əsaslı autentifikasiya yoxdur** (acceptance criteria
bunu tələb etmirdi). Ona görə "bu sorğunu edən kimdir" məlumatı request
body-dən gəlir (`owner_id`, `applicant_id`). Bu, təhlükəsiz deyil — istənilən
adam özünü başqası kimi göstərə bilər. Frontend login-dən sonra qayıdan
`user.id`-ni yadda saxlayıb (məs. React state/localStorage) bu sahələrə
ötürməlidir. Real auth (JWT + "cari istifadəçi" asılılığı) sonrakı sprintdə
əlavə olunanda bu sahələr avtomatik token-dən veriləcək, request-dən silinəcək.

## Quraşdırma


```bash
cd TUP-Backend
python -m venv venv
**Windows:** venv\Scripts\activate
**Mac/Linux:** source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Server: http://127.0.0.1:8000
Swagger UI: http://127.0.0.1:8000/docs

## Endpoint-lər

| Method | Path                              | Təsvir                              |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/`                                | Backend statusu                      |
| POST   | `/signup`                         | Qeydiyyat                            |
| POST   | `/login`                          | Giriş                                |
| GET    | `/skills`                         | Bütün bacarıqlar                     |
| POST   | `/skills`                         | Yeni bacarıq yarat                   |
| GET    | `/users/{user_id}/profile`        | Profili gətir                        |
| PUT    | `/users/{user_id}/profile`        | Profili yarat/yenilə                 |
| GET    | `/projects`                       | Layihələr (axtarış/filtrlə)          |
| POST   | `/projects`                       | Yeni layihə                          |
| GET    | `/projects/{id}`                  | Layihə detalları                     |
| PUT    | `/projects/{id}`                  | Layihəni yenilə                      |
| DELETE | `/projects/{id}`                  | Layihəni sil                         |
| POST   | `/projects/{id}/apply`            | Layihəyə müraciət et                 |
| GET    | `/projects/{id}/applications`     | Layihənin müraciətləri               |
| GET    | `/users/{user_id}/applications`   | İstifadəçinin müraciətləri           |
| PATCH  | `/applications/{id}`              | Müraciəti qəbul/rədd et              |

## Struktur

```
BackEnd/
├── requirements.txt
├── .gitignore
├── README.md
└── app/
    ├── main.py                    # FastAPI app, CORS, router-lər, error handler
    ├── database.py                # DB qoşulması (SQLite)
    ├── models.py                  # SQLAlchemy modelləri
    ├── schemas.py                 # Pydantic sxemləri
    ├── auth.py                    # Şifrə hash-ləmə
    └── routers/
        ├── auth_routes.py         # Sign Up / Login
        ├── skills_routes.py       # Skills
        ├── profile_routes.py      # Profile
        ├── project_routes.py      # Project Board (CRUD)
        └── application_routes.py  # Team Matching
```

## Növbəti sprint üçün planlaşdırılan

- JWT/token əsaslı auth (real "cari istifadəçi" identifikasiyası)
- Admin panel
- Collaboration Dashboard (komanda üzvləri, rol idarəetməsi)


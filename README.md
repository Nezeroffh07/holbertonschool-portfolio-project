# TUP — TeamUp Platform (Backend)

Universitet tələbələrinin akademik/innovativ layihələr üçün komanda üzvü
tapmasını asanlaşdıran platformanın backend hissəsi.

## Sprint 1 — MVP Foundation (bu paketin əhatə etdiyi hissə)

- FastAPI ilə backend strukturu
- SQLite + SQLAlchemy ilə verilənlər bazası
- Sign Up / Login API-ləri (bcrypt ilə şifrə hash-ləmə)
- Swagger/OpenAPI sənədləşməsi (`/docs`)
- CORS aktiv — frontend inteqrasiyasına hazır

## Quraşdırma

```bash
cd TUP-Backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Server: http://127.0.0.1:8000
Swagger UI: http://127.0.0.1:8000/docs

## Endpoint-lər

| Method | Path      | Təsvir                          |
|--------|-----------|----------------------------------|
| GET    | `/`       | Backend statusu                  |
| POST   | `/signup` | Yeni istifadəçi qeydiyyatı       |
| POST   | `/login`  | İstifadəçi girişi                |

## Struktur

```
TUP-Backend/
├── requirements.txt
├── .gitignore
└── app/
    ├── main.py           # FastAPI app, CORS, router qoşulması
    ├── database.py       # DB qoşulması (SQLite)
    ├── models.py         # SQLAlchemy modelləri (User)
    ├── schemas.py         # Pydantic sxemləri (request/response)
    ├── auth.py            # Şifrə hash-ləmə (bcrypt)
    └── routers/
        └── auth_routes.py # Sign Up / Login endpoint-ləri
```

## Gələcək sprintlər üçün planlaşdırılan modullar

Layihə sənədinə əsasən aşağıdakılar sonrakı sprintlərdə əlavə olunacaq:

- **Profile & Skills** — ixtisas, bacarıqlar, maraq sahələri, portfolio
- **Project Board** — layihə yaratmaq, tələb olunan bacarıqlar, boş mövqelər
- **Team Matching** — layihəyə müraciət, komanda rəhbərinin qərarı
- **Collaboration Dashboard** — komanda strukturu, rol idarəetməsi
- **Admin panel**

Bu sprintdə bilərəkdən JWT/token sistemi əlavə edilməyib — sadə auth
yoxlaması (login uğurlu/uğursuz) kifayətdir. Token-based auth sonrakı
sprintdə əlavə oluna bilər.

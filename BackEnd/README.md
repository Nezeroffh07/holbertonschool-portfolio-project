# TUP — Backend (Sprint 1)

Universitet tələbələri üçün komanda tapma platformasının backend hissəsi.

**Stack:** FastAPI + SQLite + SQLAlchemy + bcrypt

## Quraşdırma

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Server: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs

## Endpoint-lər

| Method | Path      | Təsvir |
|--------|-----------|--------|
| GET    | `/`       | Status yoxlaması |
| POST   | `/signup` | Qeydiyyat |
| POST   | `/login`  | Giriş |

## Struktur

```
app/
├── main.py             FastAPI app, CORS, router
├── database.py         DB qoşulması
├── models.py            User modeli
├── schemas.py            Request/response sxemləri
├── auth.py                Şifrə hash-ləmə
└── routers/auth_routes.py Sign Up / Login
```

## Qeyd

Bu sprintdə JWT/token yoxdur — sadə uğur/uğursuzluq cavabı kifayətdir.
Token-based auth və digər modullar (Profile, Project Board və s.)
sonrakı sprintlərdə əlavə olunacaq.

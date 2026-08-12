# TUP — TeamUp Platform (Backend)

Universitet tələbələri üçün komanda/layihə tapma platformasının backend hissəsi.

**Stack:** FastAPI, SQLAlchemy, PostgreSQL (production) / SQLite (lokal), JWT

**Canlı:** https://tup-backend.onrender.com
**Swagger:** https://tup-backend.onrender.com/docs 
username: tup
password: 1937Tup@

---

## Lokal işə salmaq (kod üzərində işləmək üçün)

```
cd TUP-Backend
python -m venv venv
**Windows:** venv\Scripts\activate
**Mac/Linux:** source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Swagger: http://127.0.0.1:8000/docs 

---

## Giriş (JWT)

`POST /login` → `access_token` qaytarır. Swagger-də **Authorize** düyməsinə basıb tokeni yapışdırın.

---

## Struktur

```
app/
├── main.py           # FastAPI app, CORS, router-lər
├── database.py       # DB qoşulması
├── models.py         # SQLAlchemy modelləri
├── schemas.py        # Pydantic sxemləri
├── auth.py           # Şifrə + JWT
├── dependencies.py   # Cari istifadəçi, icazələr
└── routers/          # Endpoint-lər (auth, skills, profile, projects, applications, team, admin)
```

---

## Admin təyin etmək

Admin statusu yalnız verilənlər bazasından əl ilə təyin olunur:

```sql
UPDATE users SET is_admin = true WHERE email = 'sizin@qu.edu.az';
```

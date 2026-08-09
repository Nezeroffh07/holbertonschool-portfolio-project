"""
Verilənlər bazası qoşulması.

İki mühiti dəstəkləyir:
  - Lokal (dev): DATABASE_URL təyin olunmayıbsa, SQLite istifadə olunur
    (tup.db faylı) — heç bir əlavə quraşdırma tələb etmir.
  - Production (Render): DATABASE_URL environment variable-ı təyin olunur,
    PostgreSQL-ə qoşulur.

Yəni komandanın hər üzvü öz kompüterində heç nə dəyişmədən SQLite ilə
işləməyə davam edə bilər; deploy zamanı isə platforma DATABASE_URL verir
və kod avtomatik PostgreSQL-ə keçir.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tup.db")

# Render (və bir sıra digər platformalar) "postgres://" prefiksi ilə URL verir,
# SQLAlchemy 2.x isə "postgresql://" gözləyir — avtomatik düzəldirik.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# check_same_thread yalnız SQLite üçün lazımdır və PostgreSQL-də xəta verər
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    # Pulsuz hosting planlarında DB bağlantısı bir müddət sonra kəsilir;
    # pool_pre_ping hər sorğudan əvvəl bağlantını yoxlayıb lazım olsa yenidən qurur.
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: hər sorğu üçün DB session açır və sonda bağlayır."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

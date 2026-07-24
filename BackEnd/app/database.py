"""
Verilənlər bazası qoşulması.

Sprint 1 üçün SQLite istifadə olunur (server tələb etmir, tez qurulur,
komandanın hər üzvü öz kompüterində asanlıqla işə sala bilər).
Sonrakı sprintlərdə production üçün PostgreSQL-ə keçmək istəsəniz,
yalnız SQLALCHEMY_DATABASE_URL dəyişməlidir, qalan kod eyni qalır.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./tup.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
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

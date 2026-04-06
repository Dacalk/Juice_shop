from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Resolve DB path: Use DATABASE_PATH env var (for Fly.io /data/pos.db) or fallback to local
_HERE = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_DB_PATH = os.path.join(_HERE, 'pos.db')
db_file_path = os.getenv("DATABASE_PATH", _DEFAULT_DB_PATH)
print(f"[Database] Using DB at: {db_file_path}")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_file_path}"


engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    """Safely add new columns to existing databases without losing data."""
    import sqlite3
    db_path = os.getenv("DATABASE_PATH", os.path.join(_HERE, 'pos.db'))

    if not os.path.exists(db_path):
        return  # Fresh DB — create_all will handle it
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Get existing columns in products table
    cursor.execute("PRAGMA table_info(products)")
    existing_cols = {row[1] for row in cursor.fetchall()}
    # Add cost_price if missing
    if 'cost_price' not in existing_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0.0")
        print("[Migration] Added column: products.cost_price")
    conn.commit()
    conn.close()


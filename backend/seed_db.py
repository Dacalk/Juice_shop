try:
    from backend import models, auth, database
    from backend.database import SessionLocal, engine
except ImportError:
    import models, auth, database
    from database import SessionLocal, engine
from sqlalchemy import text

def seed_db():
    print("Initializing database tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Clearing existing data for a fresh seed...")
        # Clear users and products to ensure new hashing is applied
        db.execute(text("DELETE FROM users"))
        db.execute(text("DELETE FROM products"))
        db.commit()

        print("Seeding initial data with New Hashing...")
        
        # Create Admin
        admin_user = models.User(
            username="admin", 
            hashed_password=auth.get_password_hash("admin123"), 
            role="admin"
        )
        db.add(admin_user)
        
        # Create Cashier
        cashier_user = models.User(
            username="cashier", 
            hashed_password=auth.get_password_hash("cashier123"), 
            role="cashier"
        )
        db.add(cashier_user)
        
        # Create Sample Products
        products = [
            {"name": "Mixed Fruit Juice", "price": 450, "category": "Fruit & Juice", "unit": "pc", "image": "🍉"},
            {"name": "Mango Delight", "price": 550, "category": "Fruit & Juice", "unit": "pc", "image": "🥭"},
            {"name": "Spicy Murukku", "price": 120, "category": "Gram Section", "unit": "g", "image": "🥨"},
            {"name": "Sweet Murukku", "price": 150, "category": "Gram Section", "unit": "g", "image": "🍩"}
        ]
        for p in products:
            db.add(models.Product(**p))
            
        db.commit()
        print("Success! Created admin/admin123 and cashier/cashier123 with Direct Bcrypt.")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()

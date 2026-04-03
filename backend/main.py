from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional
import json
import os
import shutil

from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "cashier"

class ProductCreate(BaseModel):
    name: str
    price: float
    category: str
    unit: str = "pc"
    image: str = "🥤"
    stock: float = 0.0

try:
    # When run as a package: python -m uvicorn backend.main:app
    from backend.database import engine, get_db
    from backend import models, auth
except ImportError:
    # When run directly from backend/ folder: uvicorn main:app
    from database import engine, get_db
    import models, auth

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(title="Juice Bar POS API")

# Mount Static Files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], # Allow all headers for now
)

# --- AUTH ROUTES ---
@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"username": user.username, "role": user.role}
    }

# --- PUBLIC REGISTRATION ROUTE ---
@app.post("/auth/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = models.User(
        username=user.username,
        hashed_password=auth.get_password_hash(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    # Auto-login after registration
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role,
        "access_token": access_token,
        "token_type": "bearer"
    }

# --- USER MANAGEMENT ---
@app.get("/users", response_model=List[dict])
async def get_users(db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    users = db.query(models.User).all()
    # Mask password hashes for privacy
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]

@app.post("/users")
async def create_user(user: UserCreate, db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    # Check if user already exists
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=user.username,
        hashed_password=auth.get_password_hash(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role}

@app.put("/users/{user_id}")
async def update_user(user_id: int, user_update: dict, db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if 'username' in user_update:
        db_user.username = user_update['username']
    if 'role' in user_update:
        db_user.role = user_update['role']
    if 'password' in user_update and user_update['password']:
        db_user.hashed_password = auth.get_password_hash(user_update['password'])
        
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "username": db_user.username, "role": db_user.role}

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent self-deletion
    if db_user.username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

# --- PRODUCT ROUTES ---
@app.get("/products")
async def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.post("/products")
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db), 
    current_user = Depends(auth.check_admin)
):
    new_product = models.Product(
        name=product.name,
        price=product.price,
        category=product.category,
        unit=product.unit,
        image=product.image,
        stock=product.stock
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.put("/products/{product_id}")
async def update_product(product_id: int, product_update: dict, db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

# --- ORDER ROUTES ---
@app.post("/orders")
async def create_order(order_data: dict, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    # Generate Invoice Number (Simplified: TIMESTAMP + RANDOM)
    import uuid
    import datetime
    
    inv_num = f"INV-{datetime.datetime.now().strftime('%Y%m%d%H%M')}-{str(uuid.uuid4())[:4].upper()}"
    
    new_order = models.Order(
        invoice_number=inv_num,
        total=order_data['total'],
        paid=order_data['paid'],
        balance=order_data['balance'],
        cashier_id=current_user.id
    )
    db.add(new_order)
    db.flush() # Get ID before items
    
    def parse_unit_grams(unit_str):
        import re
        match = re.search(r"(\d+)", unit_str)
        if match:
            val = int(match.group(1))
            if "kg" in unit_str.lower():
                return val * 1000
            return val
        return 1 # Fallback to 1g if unit is "g" or similar

    for item in order_data['items']:
        product = db.query(models.Product).filter(models.Product.id == item['product_id']).first()
        if not product:
            continue
            
        # Calculate Price for Gram Section Items
        final_price = item['price']
        if product.category == "Gram Section":
            unit_grams = parse_unit_grams(product.unit)
            # final_price in order represents (product.price / unit_grams) * weight
            final_price = (product.price / unit_grams) * item['quantity']
        else:
            final_price = product.price * item['quantity']

        new_item = models.OrderItem(
            order_id=new_order.id,
            product_id=item['product_id'],
            quantity=item['quantity'],
            price=final_price
        )
        db.add(new_item)
        
        # Deduct Stock
        product.stock -= item['quantity']
    
    # Recalculate total for precision
    db.flush()
    order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == new_order.id).all()
    new_order.total = sum(i.price for i in order_items)

    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/reports/daily")
async def get_daily_report(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user = Depends(auth.check_admin)
):
    from datetime import datetime, date, time
    
    query = db.query(models.Order)
    
    if start_date:
        try:
            start_dt = datetime.combine(date.fromisoformat(start_date), time.min)
            query = query.filter(models.Order.timestamp >= start_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
            
    if end_date:
        try:
            end_dt = datetime.combine(date.fromisoformat(end_date), time.max)
            query = query.filter(models.Order.timestamp <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
            
    if not start_date and not end_date:
        # Default to today if no filters provided
        today = date.today()
        query = query.filter(models.Order.timestamp >= today)
        
    orders = query.order_by(models.Order.timestamp.desc()).all()
    
    total_sales = sum(o.total for o in orders)
    num_orders = len(orders)
    
    return {
        "total_sales": total_sales,
        "num_orders": num_orders,
        "orders": orders
    }

# --- THERMAL PRINT PLACEHOLDER ---
@app.post("/print")
async def print_receipt(receipt_data: dict, current_user = Depends(auth.get_current_user)):
    # This is where thermal printer ESC/POS logic would go
    print(f"--- THERMAL PRINT REQUEST FROM {current_user.username} ---")
    print(json.dumps(receipt_data, indent=2))
    return {"status": "printed", "message": "Receipt sent to printer spooler"}

# --- SEED DATA (RUN ONCE) ---
@app.post("/seed")
async def seed_db(db: Session = Depends(get_db)):
    # Check if admin exists
    if db.query(models.User).filter(models.User.username == "admin").first():
        return {"message": "Database already seeded"}
    
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
        {"name": "Mixed Fruit Juice", "price": 450, "category": "FruitSalad & Juice", "unit": "pc", "image": "🍉", "stock": 50},
        {"name": "Mango Delight", "price": 550, "category": "FruitSalad & Juice", "unit": "pc", "image": "🥭", "stock": 50},
        {"name": "Spicy Murukku", "price": 120, "category": "Gram Section", "unit": "100g", "image": "🥨", "stock": 5000},
        {"name": "Sweet Murukku", "price": 150, "category": "Gram Section", "unit": "100g", "image": "🍩", "stock": 5000}
    ]
    for p in products:
        db.add(models.Product(**p))
        
    db.commit()
    return {"message": "Seed successful: Created admin/admin123 and cashier/cashier123"}

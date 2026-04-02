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

from backend import models, auth, database
from backend.database import engine, get_db

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
UPLOAD_DIR = "backend/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(title="Juice Bar POS API")

# Mount Static Files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# --- USER MANAGEMENT ---
@app.get("/users", response_model=List[dict])
async def get_users(db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    users = db.query(models.User).all()
    # Mask password hashes for privacy
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]

# --- PRODUCT ROUTES ---
@app.get("/products")
async def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.post("/products")
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    unit: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db), 
    current_user = Depends(auth.check_admin)
):
    image_name = "default-product.png" # Placeholder if no file
    
    if image_file:
        file_extension = image_file.filename.split(".")[-1]
        image_name = f"prod_{name.replace(' ', '_').lower()}_{int(os.path.getmtime(UPLOAD_DIR))}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, image_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)
            
    new_product = models.Product(
        name=name,
        price=price,
        category=category,
        unit=unit,
        image=image_name
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
    
    for item in order_data['items']:
        new_item = models.OrderItem(
            order_id=new_order.id,
            product_id=item['product_id'],
            quantity=item['quantity'],
            price=item['price']
        )
        db.add(new_item)
    
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/reports/daily")
async def get_daily_report(db: Session = Depends(get_db), current_user = Depends(auth.check_admin)):
    # Basic daily aggregation (today's orders)
    from datetime import datetime, date
    today = date.today()
    orders = db.query(models.Order).filter(models.Order.timestamp >= today).all()
    
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
        {"name": "Mixed Fruit Juice", "price": 450, "category": "Fruit & Juice", "unit": "pc", "image": "🍉"},
        {"name": "Mango Delight", "price": 550, "category": "Fruit & Juice", "unit": "pc", "image": "🥭"},
        {"name": "Spicy Murukku", "price": 120, "category": "Gram Section", "unit": "g", "image": "🥨"},
        {"name": "Sweet Murukku", "price": 150, "category": "Gram Section", "unit": "g", "image": "🍩"}
    ]
    for p in products:
        db.add(models.Product(**p))
        
    db.commit()
    return {"message": "Seed successful: Created admin/admin123 and cashier/cashier123"}

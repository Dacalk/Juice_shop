from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta, date, time
from typing import List, Optional
import json
import os
import shutil
import uuid

from pydantic import BaseModel
from bson import ObjectId
from dotenv import load_dotenv

# Load .env file
load_dotenv()


# --- MODELS & DATABASE ---
try:
    from database import get_db, run_migrations
    import models, auth
except ImportError:
    from backend.database import get_db, run_migrations
    from backend import models, auth

app = FastAPI(title="Juice Bar POS API (MongoDB)")

# Run migrations (initial setup)
run_migrations()

# --- UPLOADS STORAGE ---
# Vercel filesystem is read-only. For local dev, we use "uploads".
# For production, /tmp is writable but transient.
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- CORS ---
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HELPER SCHEMAS ---
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
    cost_price: float = 0.0

# --- ROUTES ---

@app.get("/health")
async def health_check(db = Depends(get_db)):
    try:
        # Check if we can ping the database
        await db.command("ping")
        return {"status": "healthy", "database": "connected", "type": "mongodb"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# --- AUTH ---

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user_dict = await db["users"].find_one({"username": form_data.username})
    if not user_dict or not auth.verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token = auth.create_access_token(data={"sub": user_dict["username"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"username": user_dict["username"], "role": user_dict["role"]}
    }

@app.post("/auth/register")
async def register_user(user: UserCreate, db = Depends(get_db)):
    if await db["users"].find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = {
        "username": user.username,
        "hashed_password": auth.get_password_hash(user.password),
        "role": user.role
    }
    result = await db["users"].insert_one(new_user)
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "role": user.role,
        "access_token": access_token,
        "token_type": "bearer"
    }

# --- USERS ---

@app.get("/users")
async def get_users(db = Depends(get_db), current_user = Depends(auth.check_admin)):
    cursor = db["users"].find()
    users = await cursor.to_list(length=100)
    return [{"id": str(u["_id"]), "username": u["username"], "role": u["role"]} for u in users]

@app.post("/users")
async def create_user(user: UserCreate, db = Depends(get_db), current_user = Depends(auth.check_admin)):
    if await db["users"].find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = {
        "username": user.username,
        "hashed_password": auth.get_password_hash(user.password),
        "role": user.role
    }
    result = await db["users"].insert_one(new_user)
    return {"id": str(result.inserted_id), "username": user.username, "role": user.role}

@app.put("/users/{user_id}")
async def update_user(user_id: str, user_update: dict, db = Depends(get_db), current_user = Depends(auth.check_admin)):
    update_data = {}
    if "username" in user_update: update_data["username"] = user_update["username"]
    if "role" in user_update: update_data["role"] = user_update["role"]
    if "password" in user_update and user_update["password"]:
        update_data["hashed_password"] = auth.get_password_hash(user_update["password"])
    
    result = await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated = await db["users"].find_one({"_id": ObjectId(user_id)})
    return {"id": str(updated["_id"]), "username": updated["username"], "role": updated["role"]}

@app.delete("/users/{user_id}")
async def delete_user(user_id: str, db = Depends(get_db), current_user = Depends(auth.check_admin)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db["users"].delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# --- PRODUCTS ---

@app.get("/products")
async def get_products(db = Depends(get_db)):
    cursor = db["products"].find()
    products = await cursor.to_list(length=1000)
    for p in products:
        p["id"] = str(p["_id"])
        del p["_id"]
    return products

@app.post("/products")
async def create_product(product: ProductCreate, db = Depends(get_db), current_user = Depends(auth.check_admin)):
    new_product = product.dict()
    result = await db["products"].insert_one(new_product)
    new_product["id"] = str(result.inserted_id)
    del new_product["_id"]
    return new_product

@app.put("/products/{product_id}")
async def update_product(product_id: str, product_update: dict, db = Depends(get_db), current_user = Depends(auth.check_admin)):
    if "id" in product_update: del product_update["id"]
    result = await db["products"].update_one({"_id": ObjectId(product_id)}, {"$set": product_update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await db["products"].find_one({"_id": ObjectId(product_id)})
    updated["id"] = str(updated["_id"])
    del updated["_id"]
    return updated

@app.delete("/products/{product_id}")
async def delete_product(product_id: str, db = Depends(get_db), current_user = Depends(auth.check_admin)):
    result = await db["products"].delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# --- ORDERS ---

@app.post("/orders")
async def create_order(order_data: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    inv_num = f"INV-{datetime.now().strftime('%Y%m%d%H%M')}-{str(uuid.uuid4())[:4].upper()}"
    
    # In MongoDB, we store the full order with its items embedded
    total = 0.0
    processed_items = []
    
    for item in order_data['items']:
        product = await db["products"].find_one({"_id": ObjectId(item['product_id'])})
        if not product: continue
        
        # Calculate Price
        quantity = item['quantity']
        item_price = product['price']
        
        if product['category'] == "Gram Section":
            import re
            match = re.search(r"(\d+)", product.get('unit', '100'))
            unit_grams = int(match.group(1)) if match else 100
            price_per_item = (item_price / unit_grams) * quantity
        else:
            price_per_item = item_price * quantity
            
        total += price_per_item
        processed_items.append({
            "product_id": item['product_id'],
            "name": product['name'],
            "quantity": quantity,
            "price": round(price_per_item, 2)
        })
        
        # Deduct Stock
        await db["products"].update_one(
            {"_id": ObjectId(item['product_id'])},
            {"$inc": {"stock": -quantity}}
        )
    
    new_order = {
        "invoice_number": inv_num,
        "total": round(total, 2),
        "paid": order_data['paid'],
        "balance": round(order_data['paid'] - total, 2),
        "timestamp": datetime.utcnow(),
        "cashier_id": str(current_user.id),
        "items": processed_items
    }
    
    result = await db["orders"].insert_one(new_order)
    new_order["id"] = str(result.inserted_id)
    del new_order["_id"]
    return new_order

@app.get("/reports/daily")
async def get_daily_report(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    db = Depends(get_db), 
    current_user = Depends(auth.check_admin)
):
    query = {}
    if start_date:
        start_dt = datetime.combine(date.fromisoformat(start_date), time.min)
        query["timestamp"] = {"$gte": start_dt}
    if end_date:
        end_dt = datetime.combine(date.fromisoformat(end_date), time.max)
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_dt
        else:
            query["timestamp"] = {"$lte": end_dt}
            
    if not start_date and not end_date:
        # Default to today
        today = datetime.combine(date.today(), time.min)
        query["timestamp"] = {"$gte": today}
        
    cursor = db["orders"].find(query).sort("timestamp", -1)
    orders = await cursor.to_list(length=1000)
    
    # Process for response
    total_sales = sum(o["total"] for o in orders)
    num_orders = len(orders)
    
    # Simplify for response
    for o in orders:
        o["id"] = str(o["_id"])
        del o["_id"]
        o["timestamp"] = o["timestamp"].isoformat()
        
    return {
        "total_sales": total_sales,
        "num_orders": num_orders,
        "orders": orders
    }

# --- SEED ---

@app.get("/seed")
async def seed_db(db = Depends(get_db)):
    if await db["users"].find_one({"username": "admin"}):
        return {"message": "Database already seeded"}
    
    # Admin & Cashier
    await db["users"].insert_one({
        "username": "admin", 
        "hashed_password": auth.get_password_hash("admin123"), 
        "role": "admin"
    })
    await db["users"].insert_one({
        "username": "cashier", 
        "hashed_password": auth.get_password_hash("cashier123"), 
        "role": "cashier"
    })
    
    # Products
    products = [
        {"name": "Mixed Fruit Juice", "price": 450, "category": "FruitSalad & Juice", "unit": "pc", "image": "🍉", "stock": 50},
        {"name": "Mango Delight", "price": 550, "category": "FruitSalad & Juice", "unit": "pc", "image": "🥭", "stock": 50},
        {"name": "Spicy Murukku", "price": 120, "category": "Gram Section", "unit": "100g", "image": "🥨", "stock": 5000},
        {"name": "Sweet Murukku", "price": 150, "category": "Gram Section", "unit": "100g", "image": "🍩", "stock": 5000}
    ]
    await db["products"].insert_many(products)
    
    return {"message": "Seed successful: Created admin/admin123 and cashier/cashier123"}

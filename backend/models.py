from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from backend.database import Base
except ImportError:
    from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin' or 'cashier'

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    unit = Column(String) # 'pc' or 'g' (100g)
    category = Column(String) # 'Gram Section' or 'Fruit & Juice'
    image = Column(String) # Emoji or Image URL

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    total = Column(Float)
    paid = Column(Float)
    balance = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    cashier_id = Column(Integer, ForeignKey("users.id"))
    
    cashier = relationship("User")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    price = Column(Float) # Price at time of purchase
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

from pydantic import BaseModel, Field, ConfigDict, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import List, Optional, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ]),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x),
                return_schema=core_schema.str_schema(),
            ),
        )

    @classmethod
    def validate(cls, v: Any) -> ObjectId:
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

class MongoModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class User(MongoModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    username: str
    hashed_password: str
    role: str # 'admin' or 'cashier'

class Product(MongoModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    price: float
    unit: str # 'pc' or '100g'
    category: str # 'Gram Section' or 'Fruit & Juice'
    image: str # Emoji or Image URL
    stock: float = 0.0
    cost_price: float = 0.0

class Category(MongoModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str # e.g. 'FruitSalad', 'Juice', 'Gram Section'
    icon: str = "🏷️" # Emoji or Icon name

class OrderItem(MongoModel):
    product_id: str
    name: str
    quantity: float
    price: float # Total price for this quantity at time of purchase

class OrderBase(MongoModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    invoice_number: str
    total: float
    paid: float
    balance: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cashier_id: str
    items: List[OrderItem]

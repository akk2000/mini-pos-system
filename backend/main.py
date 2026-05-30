import os
import logging
from fastapi import FastAPI, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from typing import List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mini POS System API")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "mydb"),
            user=os.getenv("DB_USER", "myuser"),
            password=os.getenv("DB_PASSWORD", "mypassword"),
            connect_timeout=3  
        )
        return conn
    except Exception as e:
        logger.error(f"Database ချိတ်ဆက်မှု မအောင်မြင်ပါ- {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

class CartItem(BaseModel):
    product_id: int
    quantity: int

class CheckoutRequest(BaseModel):
    items: List[CartItem]

@app.get("/products")
def get_products():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor) 
    cur.execute("SELECT id, name, price, stock FROM products ORDER BY id ASC;")
    products = cur.fetchall()
    cur.close()
    conn.close()
    return products

@app.post("/checkout")
def checkout(request: CheckoutRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    total_amount = 0.0
    
    try:
        for item in request.items:
            cur.execute("SELECT name, price, stock FROM products WHERE id = %s FOR UPDATE;", (item.product_id,))
            product = cur.fetchone()
            
            if not product:
                raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} ကို ရှာမတွေ့ပါ။")
            
            p_name, p_price, p_stock = product[0], float(product[1]), product[2]
            
            if p_stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"{p_name} သည် လက်ကျန် မလုံလောက်ပါ။ (လက်ကျန်: {p_stock})")
            
            total_amount += p_price * item.quantity
            new_stock = p_stock - item.quantity
            cur.execute("UPDATE products SET stock = %s WHERE id = %s;", (new_stock, item.product_id))
        
        cur.execute("INSERT INTO sales (total_amount) VALUES (%s) RETURNING id;", (total_amount,))
        sale_id = cur.fetchone()[0]
        
        conn.commit()
        logger.info(f"ဘေလ်ဖြတ်မှု အောင်မြင်သည်။ Invoice ID: {sale_id}, စုစုပေါင်း: {total_amount}")
        return {"status": "success", "invoice_id": sale_id, "total_amount": total_amount}

    except HTTPException as he:
        conn.rollback() 
        raise he
    except Exception as e:
        conn.rollback()
        logger.error(f"Checkout လုပ်စဉ် Error တက်သွားသည်- {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    finally:
        cur.close()
        conn.close()
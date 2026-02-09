from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models for Ghiras Club
class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    points: int = 0
    notebook: int = 0  # 0 = not completed, 1 = completed
    phone: Optional[str] = None  # رقم جوال ولي الأمر
    group_name: Optional[str] = None  # اسم المجموعة
    image_url: Optional[str] = None  # صورة الطالب
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    group_name: Optional[str] = None
    image_url: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    group_name: Optional[str] = None
    image_url: Optional[str] = None

class PointsUpdate(BaseModel):
    points: int  # يمكن أن يكون موجب أو سالب
    reason: str  # السبب

class StudentResponse(BaseModel):
    id: str
    name: str
    points: int
    notebook: int
    phone: Optional[str] = None
    group_name: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

# Routes for Ghiras Club App
@api_router.get("/")
async def root():
    return {"message": "مرحباً بك في نادي غِراس 🌱"}

@api_router.post("/students", response_model=Student)
async def add_student(input: StudentCreate):
    """إضافة طالب جديد"""
    student = Student(**input.model_dump())
    
    # Convert to dict and serialize datetime
    doc = student.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.students.insert_one(doc)
    return student

@api_router.get("/students", response_model=List[Student])
async def get_students():
    """جلب كل الطلاب مرتبين حسب النقاط"""
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime
    for student in students:
        if isinstance(student.get('created_at'), str):
            student['created_at'] = datetime.fromisoformat(student['created_at'])
    
    # Sort by points descending
    students.sort(key=lambda x: x['points'], reverse=True)
    
    return students

@api_router.put("/students/{student_id}/attendance")
async def mark_attendance(student_id: str):
    """تسجيل حضور - إضافة 10 نقاط"""
    result = await db.students.update_one(
        {"id": student_id},
        {"$inc": {"points": 10}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Get updated student
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if student and isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    
    return student

@api_router.put("/students/{student_id}/notebook")
async def mark_notebook(student_id: str):
    """تسجيل الدفتر - إضافة 120 نقطة (مرة واحدة فقط)"""
    # First check if notebook is already completed
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    if student.get('notebook', 0) == 1:
        raise HTTPException(status_code=400, detail="الدفتر منجز مسبقاً")
    
    # Update: add 120 points and mark notebook as completed
    result = await db.students.update_one(
        {"id": student_id, "notebook": 0},
        {
            "$inc": {"points": 120},
            "$set": {"notebook": 1}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="لا يمكن تحديث الدفتر")
    
    # Get updated student
    updated_student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if updated_student and isinstance(updated_student.get('created_at'), str):
        updated_student['created_at'] = datetime.fromisoformat(updated_student['created_at'])
    
    return updated_student

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, update_data: StudentUpdate):
    """تحديث معلومات الطالب"""
    # Get only non-None fields
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="لا توجد بيانات للتحديث")
    
    result = await db.students.update_one(
        {"id": student_id},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Get updated student
    updated_student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if updated_student and isinstance(updated_student.get('created_at'), str):
        updated_student['created_at'] = datetime.fromisoformat(updated_student['created_at'])
    
    return updated_student

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    """حذف طالب"""
    result = await db.students.delete_one({"id": student_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    return {"message": "تم حذف الطالب بنجاح", "deleted": True}

@api_router.put("/students/{student_id}/points")
async def update_points(student_id: str, points_data: PointsUpdate):
    """إضافة أو خصم نقاط (للأفعال المختلفة)"""
    result = await db.students.update_one(
        {"id": student_id},
        {"$inc": {"points": points_data.points}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Get updated student
    updated_student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if updated_student and isinstance(updated_student.get('created_at'), str):
        updated_student['created_at'] = datetime.fromisoformat(updated_student['created_at'])
    
    return updated_student

@api_router.get("/students/{student_id}/profile")
async def get_student_profile(student_id: str):
    """الحصول على ملف الطالب مع ترتيبه"""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Convert ISO string to datetime
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    
    # Get all students to calculate rank
    all_students = await db.students.find({}, {"_id": 0}).to_list(1000)
    all_students.sort(key=lambda x: x['points'], reverse=True)
    
    # Find rank
    rank = next((i + 1 for i, s in enumerate(all_students) if s['id'] == student_id), None)
    
    return {
        "student": student,
        "rank": rank,
        "total_students": len(all_students)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
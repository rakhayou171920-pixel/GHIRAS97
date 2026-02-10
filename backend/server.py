from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import base64
import jwt
from passlib.context import CryptContext


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

# Security setup
SECRET_KEY = os.environ.get('JWT_SECRET', 'ghiras-club-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Admin credentials (single admin)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD_HASH = pwd_context.hash(os.environ.get('ADMIN_PASSWORD', 'ghiras2024'))


# Authentication Models
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="توكن غير صالح")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="انتهت صلاحية التوكن")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="توكن غير صالح")


# Define Models for Ghiras Club
class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    points: int = 0
    phone: Optional[str] = None  # رقم جوال ولي الأمر
    supervisor: Optional[str] = None  # اسم المشرف
    image_url: Optional[str] = None  # صورة الطالب
    answered_challenges: List[str] = []  # IDs of answered challenges
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Challenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str  # السؤال
    options: List[str]  # الخيارات
    correct_answer: int  # رقم الإجابة الصحيحة (0-based index)
    points: int  # النقاط المستحقة
    active: bool = True  # فعالة أم لا
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChallengeCreate(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    points: int

class ChallengeAnswer(BaseModel):
    answer: int  # رقم الإجابة المختارة

class StudentCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    image_url: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    image_url: Optional[str] = None

class PointsUpdate(BaseModel):
    points: int  # يمكن أن يكون موجب أو سالب
    reason: str  # السبب

class StudentResponse(BaseModel):
    id: str
    name: str
    points: int
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    image_url: Optional[str] = None
    answered_challenges: List[str] = []
    created_at: datetime

# Routes for Ghiras Club App
@api_router.get("/")
async def root():
    return {"message": "مرحباً بك في نادي غِراس 🌱"}


# Authentication Routes
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """تسجيل دخول المسؤول"""
    if request.username != ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
    
    if not pwd_context.verify(request.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
    
    access_token = create_access_token(data={"sub": request.username})
    return TokenResponse(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )


@api_router.get("/auth/verify")
async def verify_auth(username: str = Depends(verify_token)):
    """التحقق من صلاحية التوكن"""
    return {"valid": True, "username": username}

@api_router.post("/students", response_model=Student)
async def add_student(input: StudentCreate, _: str = Depends(verify_token)):
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
async def mark_attendance(student_id: str, _: str = Depends(verify_token)):
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

@api_router.post("/students/{student_id}/upload-image")
async def upload_student_image(student_id: str, file: UploadFile = File(...)):
    """رفع صورة الطالب"""
    # Check if student exists
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Read file and convert to base64
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    
    # Create data URL
    file_extension = file.filename.split('.')[-1].lower()
    mime_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }
    mime_type = mime_types.get(file_extension, 'image/jpeg')
    image_url = f"data:{mime_type};base64,{base64_image}"
    
    # Update student with image
    await db.students.update_one(
        {"id": student_id},
        {"$set": {"image_url": image_url}}
    )
    
    return {"image_url": image_url, "message": "تم رفع الصورة بنجاح"}

# Challenge APIs
@api_router.post("/challenges", response_model=Challenge)
async def create_challenge(input: ChallengeCreate):
    """إنشاء منافسة جديدة"""
    challenge = Challenge(**input.model_dump())
    doc = challenge.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.challenges.insert_one(doc)
    return challenge

@api_router.get("/challenges", response_model=List[Challenge])
async def get_challenges():
    """جلب كل المنافسات"""
    challenges = await db.challenges.find({}, {"_id": 0}).to_list(1000)
    for challenge in challenges:
        if isinstance(challenge.get('created_at'), str):
            challenge['created_at'] = datetime.fromisoformat(challenge['created_at'])
    return challenges

@api_router.get("/challenges/active", response_model=List[Challenge])
async def get_active_challenges():
    """جلب المنافسات الفعالة فقط"""
    challenges = await db.challenges.find({"active": True}, {"_id": 0}).to_list(1000)
    for challenge in challenges:
        if isinstance(challenge.get('created_at'), str):
            challenge['created_at'] = datetime.fromisoformat(challenge['created_at'])
    return challenges

@api_router.post("/challenges/{challenge_id}/answer/{student_id}")
async def answer_challenge(challenge_id: str, student_id: str, answer: ChallengeAnswer):
    """إجابة الطالب على منافسة"""
    # Get challenge
    challenge = await db.challenges.find_one({"id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    
    # Get student
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Check if already answered
    if challenge_id in student.get('answered_challenges', []):
        raise HTTPException(status_code=400, detail="تمت الإجابة على هذه المنافسة مسبقاً")
    
    # Check answer
    is_correct = answer.answer == challenge['correct_answer']
    
    # Add to answered list
    await db.students.update_one(
        {"id": student_id},
        {"$push": {"answered_challenges": challenge_id}}
    )
    
    # If correct, add points
    if is_correct:
        await db.students.update_one(
            {"id": student_id},
            {"$inc": {"points": challenge['points']}}
        )
    
    return {
        "correct": is_correct,
        "points_earned": challenge['points'] if is_correct else 0,
        "correct_answer": challenge['correct_answer'] if not is_correct else None
    }

@api_router.delete("/challenges/{challenge_id}")
async def delete_challenge(challenge_id: str):
    """حذف منافسة"""
    result = await db.challenges.delete_one({"id": challenge_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    
    return {"message": "تم حذف المنافسة بنجاح", "deleted": True}

@api_router.put("/challenges/{challenge_id}/toggle")
async def toggle_challenge(challenge_id: str):
    """تفعيل/إيقاف منافسة"""
    challenge = await db.challenges.find_one({"id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    
    new_status = not challenge.get('active', True)
    await db.challenges.update_one(
        {"id": challenge_id},
        {"$set": {"active": new_status}}
    )
    
    return {"active": new_status}

# Get supervisors list
@api_router.get("/supervisors")
async def get_supervisors():
    """جلب قائمة المشرفين"""
    students = await db.students.find({}, {"_id": 0, "supervisor": 1}).to_list(1000)
    supervisors = list(set([s['supervisor'] for s in students if s.get('supervisor')]))
    return supervisors

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
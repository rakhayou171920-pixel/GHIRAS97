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


# Ramadan Quiz Questions - أسئلة مسابقة رمضان
RAMADAN_QUESTIONS = [
    {
        "day": 1,
        "question": "في أي سنة هجرية فُرض صيام شهر رمضان على المسلمين؟",
        "options": ["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 2,
        "question": "ما هي الغزوة الكبرى التي وقعت في رمضان في السنة الثانية للهجرة؟",
        "options": ["غزوة أحد", "غزوة بدر", "غزوة الخندق", "غزوة حنين"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 3,
        "question": "في أي ليلة من رمضان نزل القرآن الكريم؟",
        "options": ["ليلة 15", "ليلة 21", "ليلة القدر", "ليلة 1"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 4,
        "question": "ما اسم الصحابي الذي كان يؤذن لصلاة الفجر في رمضان بالمدينة؟",
        "options": ["بلال بن رباح", "عبدالله بن أم مكتوم", "أبو بكر الصديق", "عمر بن الخطاب"],
        "correct": 0,
        "points": 20
    },
    {
        "day": 5,
        "question": "كم عدد المسلمين في غزوة بدر التي وقعت في رمضان؟",
        "options": ["100 مقاتل", "200 مقاتل", "313 مقاتل", "500 مقاتل"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 6,
        "question": "في أي عام هجري فُتحت مكة في شهر رمضان؟",
        "options": ["السنة 6", "السنة 7", "السنة 8", "السنة 9"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 7,
        "question": "من هو الصحابي الذي توفي في رمضان وكان أول من أسلم من الرجال؟",
        "options": ["علي بن أبي طالب", "أبو بكر الصديق", "عثمان بن عفان", "زيد بن حارثة"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 8,
        "question": "ما هي السورة التي ذُكر فيها شهر رمضان بالاسم؟",
        "options": ["سورة آل عمران", "سورة البقرة", "سورة النساء", "سورة المائدة"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 9,
        "question": "كان النبي ﷺ يعتكف في رمضان، في أي أيام كان يعتكف؟",
        "options": ["أول عشرة أيام", "العشر الوسطى", "العشر الأواخر", "الشهر كله"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 10,
        "question": "من هي زوجة النبي ﷺ التي توفيت في رمضان؟",
        "options": ["عائشة رضي الله عنها", "خديجة رضي الله عنها", "حفصة رضي الله عنها", "زينب رضي الله عنها"],
        "correct": 3,
        "points": 20
    },
    {
        "day": 11,
        "question": "ماذا كان يكثر النبي ﷺ في شهر رمضان؟",
        "options": ["النوم", "الصدقة والجود", "السفر", "الصمت"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 12,
        "question": "من كان يدارس النبي ﷺ القرآن في رمضان؟",
        "options": ["أبو بكر الصديق", "جبريل عليه السلام", "عمر بن الخطاب", "علي بن أبي طالب"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 13,
        "question": "ما هي العبادة التي تُضاعف أجرها في رمضان وتعادل حجة مع النبي؟",
        "options": ["الصلاة", "الصيام", "العمرة", "الصدقة"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 14,
        "question": "كم مرة ختم النبي ﷺ القرآن مع جبريل في رمضان الأخير من حياته؟",
        "options": ["مرة واحدة", "مرتين", "ثلاث مرات", "أربع مرات"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 15,
        "question": "ما اسم الوجبة التي يتناولها المسلم قبل الفجر في رمضان؟",
        "options": ["الإفطار", "السحور", "الغداء", "العشاء"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 16,
        "question": "ما هي الصلاة التي تُصلى جماعة في ليالي رمضان؟",
        "options": ["صلاة الضحى", "صلاة التراويح", "صلاة الوتر", "صلاة الاستخارة"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 17,
        "question": "في أي يوم من رمضان وقعت غزوة بدر الكبرى؟",
        "options": ["1 رمضان", "10 رمضان", "17 رمضان", "27 رمضان"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 18,
        "question": "ما الدعاء الذي علّمه النبي ﷺ لعائشة لليلة القدر؟",
        "options": ["اللهم اغفر لي", "اللهم إنك عفو تحب العفو فاعف عني", "اللهم ارزقني", "اللهم اهدني"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 19,
        "question": "كم عدد ركعات صلاة التراويح التي صلاها عمر بن الخطاب بالناس؟",
        "options": ["8 ركعات", "11 ركعة", "20 ركعة", "23 ركعة"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 20,
        "question": "ما هو ثواب من فطّر صائماً في رمضان؟",
        "options": ["نصف أجر الصائم", "مثل أجر الصائم", "ضعف أجر الصائم", "ثلث أجر الصائم"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 21,
        "question": "متى تكون ليلة القدر حسب الأرجح من أقوال العلماء؟",
        "options": ["ليلة 21", "ليلة 23", "ليلة 27", "ليلة 29"],
        "correct": 2,
        "points": 20
    },
    {
        "day": 22,
        "question": "ما هي صدقة الفطر التي تُخرج في نهاية رمضان؟",
        "options": ["صدقة مال", "صدقة طعام", "صدقة ملابس", "صدقة ذهب"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 23,
        "question": "من هو الخليفة الذي جمع الناس على إمام واحد لصلاة التراويح؟",
        "options": ["أبو بكر الصديق", "عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 24,
        "question": "ماذا يُسن للمسلم أن يقول عند الإفطار؟",
        "options": ["الحمد لله", "ذهب الظمأ وابتلت العروق", "بسم الله", "الله أكبر"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 25,
        "question": "ليلة القدر خير من كم شهر؟",
        "options": ["مئة شهر", "ألف شهر", "خمسمئة شهر", "ألف ليلة"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 26,
        "question": "ما هو الشهر الذي يأتي بعد رمضان مباشرة؟",
        "options": ["شعبان", "شوال", "ذو القعدة", "محرم"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 27,
        "question": "ما هو عيد المسلمين الذي يأتي بعد رمضان؟",
        "options": ["عيد الأضحى", "عيد الفطر", "عيد الغدير", "عيد النصر"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 28,
        "question": "كم عدد أيام صيام شهر رمضان؟",
        "options": ["28 يوم", "29 أو 30 يوم", "30 يوم فقط", "31 يوم"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 29,
        "question": "ما هو السحور الذي أوصى به النبي ﷺ؟",
        "options": ["اللحم", "التمر", "الخبز", "الماء فقط"],
        "correct": 1,
        "points": 20
    },
    {
        "day": 30,
        "question": "بماذا وصف النبي ﷺ شهر رمضان؟",
        "options": ["شهر الصبر", "شهر البركة", "شهر المغفرة", "كل ما سبق"],
        "correct": 3,
        "points": 20
    }
]


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


# Ramadan Quiz API
@api_router.get("/ramadan-quiz/today")
async def get_today_ramadan_question():
    """جلب سؤال اليوم لمسابقة رمضان"""
    # Get current day of Ramadan (1-30)
    # For testing, we'll use the current day of month
    # In production, this should be calculated based on Ramadan start date
    today = datetime.now(timezone.utc)
    day_of_month = today.day
    
    # Make sure day is within 1-30
    day_index = (day_of_month - 1) % 30
    
    question_data = RAMADAN_QUESTIONS[day_index]
    
    return {
        "day": question_data["day"],
        "question": question_data["question"],
        "options": question_data["options"],
        "points": question_data["points"]
    }


@api_router.post("/ramadan-quiz/answer/{student_id}")
async def answer_ramadan_quiz(student_id: str, answer: int):
    """إجابة على سؤال مسابقة رمضان"""
    # Get current day question
    today = datetime.now(timezone.utc)
    day_of_month = today.day
    day_index = (day_of_month - 1) % 30
    
    question_data = RAMADAN_QUESTIONS[day_index]
    quiz_id = f"ramadan_day_{question_data['day']}"
    
    # Check if student exists
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Check if already answered today's question
    answered = student.get("answered_ramadan", [])
    if quiz_id in answered:
        raise HTTPException(status_code=400, detail="لقد أجبت على سؤال اليوم مسبقاً")
    
    # Check answer
    is_correct = answer == question_data["correct"]
    points_earned = question_data["points"] if is_correct else 0
    
    # Update student
    update_data = {
        "$push": {"answered_ramadan": quiz_id}
    }
    
    if is_correct:
        update_data["$inc"] = {"points": points_earned}
    
    await db.students.update_one({"id": student_id}, update_data)
    
    return {
        "correct": is_correct,
        "points_earned": points_earned,
        "correct_answer": question_data["correct"],
        "message": "أحسنت! إجابة صحيحة 🎉" if is_correct else "إجابة خاطئة، حاول غداً 💪"
    }


@api_router.get("/ramadan-quiz/status/{student_id}")
async def get_ramadan_quiz_status(student_id: str):
    """التحقق إذا كان الطالب قد أجاب على سؤال اليوم"""
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    today = datetime.now(timezone.utc)
    day_of_month = today.day
    day_index = (day_of_month - 1) % 30
    
    question_data = RAMADAN_QUESTIONS[day_index]
    quiz_id = f"ramadan_day_{question_data['day']}"
    
    answered = student.get("answered_ramadan", [])
    
    return {
        "day": question_data["day"],
        "already_answered": quiz_id in answered,
        "total_answered": len(answered)
    }


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
async def toggle_challenge(challenge_id: str, _: str = Depends(verify_token)):
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
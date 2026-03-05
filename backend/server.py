from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
import jwt
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Auth config
ADMIN_USERNAME = "ghiras2026"
ADMIN_PASSWORD = "ghras2026"
JWT_SECRET = "ghiras-club-secret-key-2026-xyz"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Ramadan Quiz
RAMADAN_START_DATE = datetime(2026, 2, 16, 0, 0, 0, tzinfo=timezone.utc)

RAMADAN_QUESTIONS = [
    {"day": 1, "question": "في أي سنة هجرية فرض الله صيام شهر رمضان؟", "options": ["السنة الأولى للهجرة", "السنة الثانية للهجرة", "السنة الثالثة للهجرة", "السنة الرابعة للهجرة"], "correct": 1, "points": 20},
    {"day": 2, "question": "ما اسم الغزوة التي انتصر فيها المسلمون في شهر رمضان من السنة الثانية للهجرة؟", "options": ["غزوة أحد", "غزوة بدر الكبرى", "غزوة الخندق", "غزوة خيبر"], "correct": 1, "points": 20},
    {"day": 3, "question": "ما اسم الليلة المباركة التي نزل فيها القرآن الكريم في شهر رمضان؟", "options": ["ليلة النصف من رمضان", "ليلة القدر", "ليلة الإسراء", "أول ليلة من رمضان"], "correct": 1, "points": 20},
    {"day": 4, "question": "ما اسم السورة التي ذكر فيها شهر رمضان؟", "options": ["سورة آل عمران", "سورة البقرة", "سورة النساء", "سورة المائدة"], "correct": 1, "points": 20},
    {"day": 5, "question": "في أي عشر من رمضان كان النبي صلى الله عليه وسلم يعتكف؟", "options": ["العشر الأولى", "العشر الوسطى", "العشر الأواخر", "طوال الشهر"], "correct": 2, "points": 20},
    {"day": 6, "question": "ماذا كان يفعل النبي صلى الله عليه وسلم في رمضان أكثر من غيره؟", "options": ["النوم الكثير", "الكرم والجود والصدقة", "السفر", "الصمت"], "correct": 1, "points": 20},
    {"day": 7, "question": "من الملك الذي كان يراجع القرآن مع النبي صلى الله عليه وسلم في رمضان؟", "options": ["ميكائيل عليه السلام", "جبريل عليه السلام", "إسرافيل عليه السلام", "ملك الموت"], "correct": 1, "points": 20},
    {"day": 8, "question": "ما اسم الوجبة التي يتناولها المسلم قبل أذان الفجر في رمضان؟", "options": ["الإفطار", "السحور", "الغداء", "العشاء"], "correct": 1, "points": 20},
    {"day": 9, "question": "ما اسم صلاة الليل التي تصلى في رمضان بعد صلاة العشاء؟", "options": ["صلاة الضحى", "صلاة التراويح", "صلاة الظهر", "صلاة العصر"], "correct": 1, "points": 20},
    {"day": 10, "question": "ما الدعاء الذي علمه النبي صلى الله عليه وسلم لعائشة رضي الله عنها في ليلة القدر؟", "options": ["اللهم اغفر لي", "اللهم إنك عفو تحب العفو فاعف عني", "اللهم ارزقني", "اللهم اهدني"], "correct": 1, "points": 20},
    {"day": 11, "question": "ما أجر من فطر صائما في رمضان؟", "options": ["نصف أجر الصائم", "مثل أجر الصائم من غير أن ينقص من أجره شيء", "ضعف أجر الصائم", "ثلث أجر الصائم"], "correct": 1, "points": 20},
    {"day": 12, "question": "ليلة القدر خير من كم شهر؟", "options": ["مئة شهر", "ألف شهر", "خمسمئة شهر", "مئتين شهر"], "correct": 1, "points": 20},
    {"day": 13, "question": "ما اسم الشهر الذي يأتي بعد شهر رمضان مباشرة؟", "options": ["شهر شعبان", "شهر شوال", "شهر ذو القعدة", "شهر محرم"], "correct": 1, "points": 20},
    {"day": 14, "question": "ما اسم العيد الذي يأتي بعد انتهاء شهر رمضان؟", "options": ["عيد الأضحى", "عيد الفطر", "يوم عرفة", "يوم عاشوراء"], "correct": 1, "points": 20},
    {"day": 15, "question": "ما الذي يفسد صيام المسلم في نهار رمضان؟", "options": ["النوم", "الأكل والشرب عمدا", "الصلاة", "قراءة القرآن"], "correct": 1, "points": 20},
]


def get_ramadan_day():
    now = datetime.now(timezone.utc)
    delta = now - RAMADAN_START_DATE
    day = delta.days + 1
    if day < 1:
        return 0
    if day > 30:
        return -1
    return day


# ==================== Auth ====================
def create_token(username: str):
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="غير مصرح")
    token = authorization.split(" ")[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="جلسة منتهية")
    return username


class LoginRequest(BaseModel):
    username: str
    password: str


@api_router.post("/auth/login")
async def login(req: LoginRequest):
    if req.username == ADMIN_USERNAME and req.password == ADMIN_PASSWORD:
        token = create_token(req.username)
        return {"token": token, "username": req.username}
    raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")


@api_router.get("/auth/verify")
async def verify_auth(user: str = Depends(get_current_user)):
    return {"valid": True, "username": user}


# ==================== Models ====================
class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    points: int = 0
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    image_url: Optional[str] = None
    answered_challenges: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    points: int
    reason: str

class Challenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int
    points: int
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChallengeCreate(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    points: int

class ChallengeAnswer(BaseModel):
    answer: int

class TaskCreate(BaseModel):
    group: str
    description: str
    points: int

class MatchCreate(BaseModel):
    team1: str
    team2: str

class MatchUpdateScore(BaseModel):
    score1: int
    score2: int

class LeagueStarCreate(BaseModel):
    student_id: str
    student_name: str
    image_url: Optional[str] = None
    reason: str

class ViewerLinkCreate(BaseModel):
    name: str

class BulkPointsUpdate(BaseModel):
    group: str
    points: int
    reason: str


# ==================== Helper ====================
def fix_datetime(doc):
    if doc and isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc


async def log_points(student_id: str, student_name: str, points: int, reason: str):
    """Log every point change"""
    await db.points_log.insert_one({
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "student_name": student_name,
        "points": points,
        "reason": reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    })


# ==================== Root ====================
@api_router.get("/")
async def root():
    return {"message": "نادي غِراس"}


# ==================== Ramadan Quiz ====================
@api_router.get("/ramadan-quiz/today")
async def get_today_ramadan_question():
    ramadan_day = get_ramadan_day()
    if ramadan_day == 0:
        return {"status": "not_started", "message": "لم تبدأ مسابقة رمضان بعد", "start_date": RAMADAN_START_DATE.strftime("%Y-%m-%d")}
    if ramadan_day == -1:
        return {"status": "ended", "message": "انتهت مسابقة رمضان لهذا العام"}
    if ramadan_day > 15:
        return {"status": "completed", "message": "انتهت اسئلة المسابقة شكرا لمشاركتك"}
    q = RAMADAN_QUESTIONS[ramadan_day - 1]
    return {"status": "active", "day": ramadan_day, "question": q["question"], "options": q["options"], "points": q["points"]}


@api_router.post("/ramadan-quiz/answer/{student_id}")
async def answer_ramadan_quiz(student_id: str, answer: int):
    ramadan_day = get_ramadan_day()
    if ramadan_day <= 0 or ramadan_day > 15:
        raise HTTPException(status_code=400, detail="المسابقة غير متاحة حالياً")
    q = RAMADAN_QUESTIONS[ramadan_day - 1]
    quiz_id = f"ramadan_day_{ramadan_day}"
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    if quiz_id in student.get("answered_ramadan", []):
        raise HTTPException(status_code=400, detail="لقد أجبت على سؤال اليوم مسبقاً")
    is_correct = answer == q["correct"]
    points_earned = q["points"] if is_correct else 0
    update_data = {"$push": {"answered_ramadan": quiz_id}}
    if is_correct:
        update_data["$inc"] = {"points": points_earned}
    await db.students.update_one({"id": student_id}, update_data)
    if is_correct:
        await log_points(student_id, student.get("name", ""), points_earned, "مسابقة رمضان")
    return {"correct": is_correct, "points_earned": points_earned, "correct_answer": q["correct"], "message": "احسنت اجابة صحيحة" if is_correct else "اجابة خاطئة حاول غدا"}


@api_router.get("/ramadan-quiz/status/{student_id}")
async def get_ramadan_quiz_status(student_id: str):
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    ramadan_day = get_ramadan_day()
    if ramadan_day <= 0:
        return {"status": "not_active", "day": 0, "already_answered": False, "total_answered": len(student.get("answered_ramadan", []))}
    if ramadan_day > 15:
        return {"status": "completed", "day": ramadan_day, "already_answered": True, "total_answered": len(student.get("answered_ramadan", []))}
    quiz_id = f"ramadan_day_{ramadan_day}"
    answered = student.get("answered_ramadan", [])
    return {"status": "active", "day": ramadan_day, "already_answered": quiz_id in answered, "total_answered": len(answered)}


# ==================== Students ====================
@api_router.post("/students", response_model=Student)
async def add_student(input: StudentCreate):
    student = Student(**input.model_dump())
    doc = student.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.students.insert_one(doc)
    return student


@api_router.get("/students", response_model=List[Student])
async def get_students(lite: bool = False):
    projection = {"_id": 0}
    if lite:
        projection["image_url"] = 0
    students = await db.students.find({}, projection).to_list(1000)
    for s in students:
        fix_datetime(s)
        if lite and 'image_url' not in s:
            s['image_url'] = None
    students.sort(key=lambda x: x['points'], reverse=True)
    return students


# Bulk points must be BEFORE dynamic {student_id} routes to avoid route conflicts
@api_router.put("/students/bulk-points")
async def bulk_update_points(data: BulkPointsUpdate):
    students = await db.students.find({"supervisor": data.group}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    if not students:
        raise HTTPException(status_code=404, detail="لا يوجد طلاب في هذه المجموعة")
    await db.students.update_many({"supervisor": data.group}, {"$inc": {"points": data.points}})
    for s in students:
        await log_points(s["id"], s["name"], data.points, data.reason)
    return {"message": f"تم تحديث نقاط {len(students)} طالب", "count": len(students)}


@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, update_data: StudentUpdate):
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="لا توجد بيانات للتحديث")
    result = await db.students.update_one({"id": student_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return fix_datetime(updated)


@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    return {"message": "تم حذف الطالب بنجاح", "deleted": True}


@api_router.put("/students/{student_id}/points")
async def update_points(student_id: str, points_data: PointsUpdate):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    await db.students.update_one({"id": student_id}, {"$inc": {"points": points_data.points}})
    await log_points(student_id, student.get("name", ""), points_data.points, points_data.reason)
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return fix_datetime(updated)


@api_router.put("/students/{student_id}/attendance")
async def mark_attendance(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    await db.students.update_one({"id": student_id}, {"$inc": {"points": 10}})
    await log_points(student_id, student.get("name", ""), 10, "حضور")
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return fix_datetime(updated)


@api_router.get("/students/{student_id}/profile")
async def get_student_profile(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    fix_datetime(student)
    all_students = await db.students.find({}, {"_id": 0, "id": 1, "points": 1}).to_list(1000)
    all_students.sort(key=lambda x: x['points'], reverse=True)
    rank = next((i + 1 for i, s in enumerate(all_students) if s['id'] == student_id), None)
    return {"student": student, "rank": rank, "total_students": len(all_students)}


@api_router.post("/students/{student_id}/upload-image")
async def upload_student_image(student_id: str, file: UploadFile = File(...)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    ext = file.filename.split('.')[-1].lower()
    mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp'}.get(ext, 'image/jpeg')
    image_url = f"data:{mime};base64,{base64_image}"
    await db.students.update_one({"id": student_id}, {"$set": {"image_url": image_url}})
    return {"image_url": image_url, "message": "تم رفع الصورة بنجاح"}


# ==================== Points Log ====================
@api_router.get("/points-log/{student_id}")
async def get_points_log(student_id: str):
    logs = await db.points_log.find({"student_id": student_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for log in logs:
        if isinstance(log.get('created_at'), str):
            log['created_at'] = log['created_at']
    return logs


# ==================== Challenges ====================
@api_router.post("/challenges", response_model=Challenge)
async def create_challenge(input: ChallengeCreate):
    challenge = Challenge(**input.model_dump())
    doc = challenge.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.challenges.insert_one(doc)
    return challenge


@api_router.get("/challenges", response_model=List[Challenge])
async def get_challenges():
    challenges = await db.challenges.find({}, {"_id": 0}).to_list(1000)
    for c in challenges:
        fix_datetime(c)
    return challenges


@api_router.get("/challenges/active", response_model=List[Challenge])
async def get_active_challenges():
    challenges = await db.challenges.find({"active": True}, {"_id": 0}).to_list(1000)
    for c in challenges:
        fix_datetime(c)
    return challenges


@api_router.post("/challenges/{challenge_id}/answer/{student_id}")
async def answer_challenge(challenge_id: str, student_id: str, answer: ChallengeAnswer):
    challenge = await db.challenges.find_one({"id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    if challenge_id in student.get('answered_challenges', []):
        raise HTTPException(status_code=400, detail="تمت الإجابة على هذه المنافسة مسبقاً")
    is_correct = answer.answer == challenge['correct_answer']
    await db.students.update_one({"id": student_id}, {"$push": {"answered_challenges": challenge_id}})
    if is_correct:
        await db.students.update_one({"id": student_id}, {"$inc": {"points": challenge['points']}})
        await log_points(student_id, student.get("name", ""), challenge['points'], "منافسة")
    return {"correct": is_correct, "points_earned": challenge['points'] if is_correct else 0, "correct_answer": challenge['correct_answer'] if not is_correct else None}


@api_router.delete("/challenges/{challenge_id}")
async def delete_challenge(challenge_id: str):
    result = await db.challenges.delete_one({"id": challenge_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    return {"message": "تم حذف المنافسة بنجاح", "deleted": True}


@api_router.put("/challenges/{challenge_id}/toggle")
async def toggle_challenge(challenge_id: str):
    challenge = await db.challenges.find_one({"id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    new_status = not challenge.get('active', True)
    await db.challenges.update_one({"id": challenge_id}, {"$set": {"active": new_status}})
    return {"active": new_status}


# ==================== Tasks (Weekly) ====================
@api_router.post("/tasks")
async def create_task(data: TaskCreate):
    now = datetime.now(timezone.utc)
    task = {
        "id": str(uuid.uuid4()),
        "group": data.group,
        "description": data.description,
        "points": data.points,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "claimed_by": None,
        "claimed_by_name": None,
        "completed": False
    }
    await db.tasks.insert_one(task)
    task.pop("_id", None)
    return task


@api_router.get("/tasks")
async def get_tasks(group: Optional[str] = None):
    # Auto-delete expired tasks
    now = datetime.now(timezone.utc).isoformat()
    await db.tasks.delete_many({"expires_at": {"$lt": now}})

    query = {}
    if group:
        query["group"] = group
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return tasks


@api_router.post("/tasks/{task_id}/claim/{student_id}")
async def claim_task(task_id: str, student_id: str):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    if task.get("claimed_by"):
        raise HTTPException(status_code=400, detail="المهمة محجوزة من طالب آخر")
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    await db.tasks.update_one({"id": task_id}, {"$set": {"claimed_by": student_id, "claimed_by_name": student["name"]}})
    return {"message": "تم حجز المهمة بنجاح"}


@api_router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    if not task.get("claimed_by"):
        raise HTTPException(status_code=400, detail="المهمة لم يتم حجزها بعد")
    if task.get("completed"):
        raise HTTPException(status_code=400, detail="المهمة مكتملة بالفعل")
    student_id = task["claimed_by"]
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if student:
        await db.students.update_one({"id": student_id}, {"$inc": {"points": task["points"]}})
        await log_points(student_id, student.get("name", ""), task["points"], f"مهمة: {task['description']}")
    await db.tasks.update_one({"id": task_id}, {"$set": {"completed": True}})
    return {"message": "تم اكتمال المهمة وإضافة النقاط"}


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    return {"message": "تم حذف المهمة", "deleted": True}


# ==================== Football League ====================
@api_router.post("/matches")
async def create_match(data: MatchCreate):
    match = {
        "id": str(uuid.uuid4()),
        "team1": data.team1,
        "team2": data.team2,
        "score1": None,
        "score2": None,
        "played": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.matches.insert_one(match)
    match.pop("_id", None)
    return match


@api_router.put("/matches/{match_id}/score")
async def update_match_score(match_id: str, data: MatchUpdateScore):
    result = await db.matches.update_one({"id": match_id}, {"$set": {"score1": data.score1, "score2": data.score2, "played": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="المباراة غير موجودة")
    return {"message": "تم تحديث النتيجة"}


@api_router.get("/matches")
async def get_matches():
    matches = await db.matches.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return matches


@api_router.delete("/matches/{match_id}")
async def delete_match(match_id: str):
    result = await db.matches.delete_one({"id": match_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المباراة غير موجودة")
    return {"message": "تم حذف المباراة", "deleted": True}


@api_router.get("/league-standings")
async def get_league_standings():
    matches = await db.matches.find({"played": True}, {"_id": 0}).to_list(1000)
    standings = {}
    
    # Initialize all teams from supervisors
    students = await db.students.find({}, {"_id": 0, "supervisor": 1}).to_list(1000)
    all_teams = set([s['supervisor'] for s in students if s.get('supervisor')])
    for team in all_teams:
        standings[team] = {"team": team, "played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0}

    for m in matches:
        t1, t2 = m["team1"], m["team2"]
        s1, s2 = m["score1"], m["score2"]
        
        for team in [t1, t2]:
            if team not in standings:
                standings[team] = {"team": team, "played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0}

        standings[t1]["played"] += 1
        standings[t2]["played"] += 1
        standings[t1]["gf"] += s1
        standings[t1]["ga"] += s2
        standings[t2]["gf"] += s2
        standings[t2]["ga"] += s1

        if s1 > s2:
            standings[t1]["won"] += 1
            standings[t1]["points"] += 3
            standings[t2]["lost"] += 1
        elif s2 > s1:
            standings[t2]["won"] += 1
            standings[t2]["points"] += 3
            standings[t1]["lost"] += 1
        else:
            standings[t1]["drawn"] += 1
            standings[t2]["drawn"] += 1
            standings[t1]["points"] += 1
            standings[t2]["points"] += 1

        standings[t1]["gd"] = standings[t1]["gf"] - standings[t1]["ga"]
        standings[t2]["gd"] = standings[t2]["gf"] - standings[t2]["ga"]

    result = sorted(standings.values(), key=lambda x: (x["points"], x["gd"], x["gf"]), reverse=True)
    return result


# ==================== League Star ====================
@api_router.post("/league-star")
async def set_league_star(data: LeagueStarCreate):
    star = {
        "id": str(uuid.uuid4()),
        "student_id": data.student_id,
        "student_name": data.student_name,
        "image_url": data.image_url,
        "reason": data.reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.league_star.insert_one(star)
    star.pop("_id", None)
    return star


@api_router.get("/league-star")
async def get_league_star():
    star = await db.league_star.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    return star


@api_router.get("/league-stars")
async def get_all_league_stars():
    stars = await db.league_star.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return stars


@api_router.delete("/league-star/{star_id}")
async def delete_league_star(star_id: str):
    result = await db.league_star.delete_one({"id": star_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"message": "تم الحذف", "deleted": True}


# ==================== Viewer Links ====================
@api_router.post("/viewer-links")
async def create_viewer_link(data: ViewerLinkCreate):
    link = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "token": str(uuid.uuid4())[:8],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.viewer_links.insert_one(link)
    link.pop("_id", None)
    return link


@api_router.get("/viewer-links")
async def get_viewer_links():
    links = await db.viewer_links.find({}, {"_id": 0}).to_list(100)
    return links


@api_router.delete("/viewer-links/{link_id}")
async def delete_viewer_link(link_id: str):
    result = await db.viewer_links.delete_one({"id": link_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"message": "تم الحذف", "deleted": True}


@api_router.get("/viewer/{token}")
async def get_viewer_data(token: str):
    link = await db.viewer_links.find_one({"token": token}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="رابط غير صالح")
    return {"name": link["name"], "valid": True}


# ==================== Supervisors ====================
@api_router.get("/supervisors")
async def get_supervisors():
    students = await db.students.find({}, {"_id": 0, "supervisor": 1}).to_list(1000)
    supervisors = list(set([s['supervisor'] for s in students if s.get('supervisor')]))
    return supervisors


# ==================== App Setup ====================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

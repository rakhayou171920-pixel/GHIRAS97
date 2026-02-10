# نادي غِراس - نظام إدارة نقاط الطلاب
## Product Requirements Document (PRD)

### المشكلة الأصلية
بناء تطبيق ويب لإدارة نظام مكافآت الطلاب لنادي غِراس. يتتبع التطبيق الطلاب ونقاطهم وترتيبهم.

---

## المتطلبات المنجزة

### 1. إدارة الطلاب ✅
- إضافة، تعديل، وحذف الطلاب
- ملفات الطلاب تتضمن: الاسم، جوال ولي الأمر، المشرف، الصورة
- رفع صور الطلاب مباشرة من الجهاز
- تجميع الطلاب حسب المشرف مع ألوان مميزة لكل مجموعة

### 2. نظام النقاط ✅
**النقاط الإيجابية:**
- حضور: +10 نقاط
- مشروع طالب: +20 نقطة
- إلقاء كلمة: +20 نقطة
- أفعال إيجابية أخرى: +10 نقاط

**النقاط السلبية (الخصومات):**
- تأخير: -5 نقاط
- غياب: -40 نقطة
- التلفظ: -40 نقطة
- عدم إحضار الدفتر: -15 نقطة
- أفعال سلبية أخرى: -10 نقاط

### 3. نظام المنافسات/التحديات ✅
- صفحة إدارة لإنشاء أسئلة اختيار من متعدد
- كل سؤال له نقاط للإجابة الصحيحة
- الطلاب يجيبون على الأسئلة من صفحاتهم الشخصية

### 4. صفحة الطالب الشخصية ✅
- رابط فريد قابل للمشاركة لكل طالب
- عرض النقاط والترتيب وقائمة أفضل 10 طلاب
- إمكانية الإجابة على التحديات المتاحة
- QR Code للوصول السريع

### 5. نظام تسجيل الدخول للمسؤول ✅ [جديد]
- مستخدم مسؤول واحد (admin / ghiras2024)
- حماية جميع العمليات الإدارية بـ JWT Token
- Token صالح لـ 30 يوم
- الصفحات العامة للطلاب لا تحتاج تسجيل دخول

### 6. تحسين تجربة إضافة النقاط ✅ [جديد]
- نافذة منبثقة عند النقر على زر "تعديل النقاط"
- تبويبات للنقاط الإيجابية والسلبية والمخصصة
- واجهة سهلة وواضحة مع إيموجي لكل نوع نقطة

---

## البنية التقنية

### Backend (FastAPI + MongoDB)
```
/app/backend/
├── server.py          # API الرئيسي مع المصادقة
└── requirements.txt   # المتطلبات
```

**الـ Endpoints المحمية (تحتاج Token):**
- POST /api/students
- PUT /api/students/{id}
- DELETE /api/students/{id}
- PUT /api/students/{id}/points
- PUT /api/students/{id}/attendance
- POST /api/students/{id}/upload-image
- POST /api/challenges
- PUT /api/challenges/{id}/toggle
- DELETE /api/challenges/{id}

**الـ Endpoints العامة:**
- GET /api/students
- GET /api/students/{id}/profile
- GET /api/challenges
- GET /api/challenges/active
- POST /api/challenges/{id}/answer/{student_id}
- POST /api/auth/login
- GET /api/auth/verify

### Frontend (React + Tailwind CSS)
```
/app/frontend/src/
├── App.js                    # Routing والمصادقة
├── components/
│   ├── LoginPage.js          # صفحة تسجيل الدخول
│   ├── DashboardNew.js       # لوحة التحكم الرئيسية
│   ├── PointsModal.js        # نافذة تعديل النقاط
│   ├── ChallengesManager.js  # إدارة المنافسات
│   └── StudentProfilePublic.js # صفحة الطالب العامة
```

### قاعدة البيانات (MongoDB)
**مجموعة students:**
```json
{
  "id": "uuid",
  "name": "string",
  "points": "int",
  "phone": "string?",
  "supervisor": "string?",
  "image_url": "string?",
  "answered_challenges": ["challenge_ids"],
  "created_at": "datetime"
}
```

**مجموعة challenges:**
```json
{
  "id": "uuid",
  "question": "string",
  "options": ["string"],
  "correct_answer": "int",
  "points": "int",
  "active": "bool",
  "created_at": "datetime"
}
```

---

## بيانات الدخول
- **اسم المستخدم:** admin
- **كلمة المرور:** ghiras2024

---

## المهام المستقبلية (Backlog)

### P1 - أولوية عالية
1. إضافة إمكانية تغيير كلمة المرور للمسؤول
2. تحسين الأداء عند وجود عدد كبير من الطلاب (pagination)

### P2 - أولوية متوسطة
1. إعادة هيكلة الـ Backend (تقسيم server.py إلى ملفات منفصلة)
2. إضافة سجل لتاريخ النقاط (log) لكل طالب
3. إضافة تصدير البيانات (Excel/PDF)

### P3 - أولوية منخفضة
1. إضافة إشعارات للمشرفين
2. إضافة إحصائيات وتقارير

---

## تاريخ التحديثات
- **ديسمبر 2024:** إضافة نظام تسجيل الدخول + نافذة تعديل النقاط المنبثقة
- **سابقاً:** بناء MVP الكامل مع الطلاب والنقاط والمنافسات وصفحات QR

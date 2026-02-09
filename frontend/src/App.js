import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route, useParams, Link } from "react-router-dom";
import StudentProfilePublic from "@/components/StudentProfilePublic";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Student Profile Page Component
function StudentProfile() {
  const { studentId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API}/students/${studentId}/profile`);
        setProfileData(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center" dir="rtl">
        <div className="text-2xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center" dir="rtl">
        <div className="text-2xl text-gray-600">الطالب غير موجود</div>
      </div>
    );
  }

  const { student, rank, total_students } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 shadow-lg" data-testid="profile-header">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block mb-4 text-white hover:text-green-100" data-testid="back-link">
            ← العودة إلى الصفحة الرئيسية
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-center" data-testid="profile-title">
            🌱 ملف الطالب
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Student Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-green-500" data-testid="student-card">
          <div className="p-8">
            {/* Image */}
            <div className="flex justify-center mb-6">
              {student.image_url ? (
                <img
                  src={student.image_url}
                  alt={student.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
                  data-testid="student-image"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-green-500" data-testid="student-avatar">
                  {student.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name */}
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6" data-testid="student-name">
              {student.name}
            </h2>

            {/* Rank Badge */}
            <div className="flex justify-center mb-8" data-testid="rank-badge">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-8 py-4 rounded-full shadow-lg">
                <div className="text-center">
                  <div className="text-4xl font-bold">
                    {rank === 1 && "🥇"}
                    {rank === 2 && "🥈"}
                    {rank === 3 && "🥉"}
                    {rank > 3 && `#${rank}`}
                  </div>
                  <div className="text-sm mt-1">الترتيب من {total_students}</div>
                </div>
              </div>
            </div>

            {/* Points */}
            <div className="bg-green-50 rounded-xl p-6 mb-6" data-testid="points-section">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2" data-testid="student-points">{student.points}</div>
                <div className="text-gray-600 text-lg">نقطة 🌟</div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" data-testid="info-grid">
              {student.group_name && (
                <div className="bg-blue-50 rounded-lg p-4" data-testid="group-info">
                  <div className="text-sm text-gray-600 mb-1">المجموعة</div>
                  <div className="text-lg font-semibold text-gray-800">{student.group_name}</div>
                </div>
              )}
              {student.phone && (
                <div className="bg-purple-50 rounded-lg p-4" data-testid="phone-info">
                  <div className="text-sm text-gray-600 mb-1">جوال ولي الأمر</div>
                  <div className="text-lg font-semibold text-gray-800" dir="ltr">{student.phone}</div>
                </div>
              )}
              <div className="bg-emerald-50 rounded-lg p-4" data-testid="notebook-info">
                <div className="text-sm text-gray-600 mb-1">حالة الدفتر</div>
                <div className="text-lg font-semibold text-gray-800">
                  {student.notebook === 1 ? "✅ منجز" : "❌ غير منجز"}
                </div>
              </div>
            </div>

            {/* Share Link */}
            <div className="bg-gray-50 rounded-lg p-4" data-testid="share-link-section">
              <div className="text-sm text-gray-600 mb-2">رابط الملف الشخصي</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
                  data-testid="profile-link"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("تم نسخ الرابط!");
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                  data-testid="copy-link-button"
                >
                  📋 نسخ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCustomPointsModal, setShowCustomPointsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [customPoints, setCustomPoints] = useState({ points: 0, reason: "" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", group_name: "", image_file: null });
  const [addForm, setAddForm] = useState({ name: "", phone: "", group_name: "", image_file: null });

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      showMessage("حدث خطأ في جلب البيانات");
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Add new student
  const addStudent = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;

    setLoading(true);
    try {
      const studentData = {
        name: addForm.name,
        phone: addForm.phone || null,
        group_name: addForm.group_name || null,
        image_url: null
      };
      
      const response = await axios.post(`${API}/students`, studentData);
      const newStudent = response.data;
      
      // Upload image if selected
      if (addForm.image_file) {
        const formData = new FormData();
        formData.append('file', addForm.image_file);
        await axios.post(`${API}/students/${newStudent.id}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setAddForm({ name: "", phone: "", group_name: "", image_file: null });
      setShowAddModal(false);
      showMessage("تمت إضافة الطالب بنجاح! 🎉");
      await fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
      showMessage("حدث خطأ في إضافة الطالب");
    } finally {
      setLoading(false);
    }
  };

  // Update student
  const updateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const updateData = {
        name: editForm.name,
        phone: editForm.phone || null,
        group_name: editForm.group_name || null
      };
      
      await axios.put(`${API}/students/${selectedStudent.id}`, updateData);
      
      // Upload image if selected
      if (editForm.image_file) {
        const formData = new FormData();
        formData.append('file', editForm.image_file);
        await axios.post(`${API}/students/${selectedStudent.id}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowEditModal(false);
      setSelectedStudent(null);
      showMessage("تم تحديث بيانات الطالب بنجاح! ✅");
      await fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      showMessage("حدث خطأ في تحديث البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const deleteStudent = async (studentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;

    setLoading(true);
    try {
      await axios.delete(`${API}/students/${studentId}`);
      showMessage("تم حذف الطالب بنجاح! 🗑️");
      await fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      showMessage("حدث خطأ في حذف الطالب");
    } finally {
      setLoading(false);
    }
  };

  // Add/subtract points
  const updatePoints = async (studentId, points, reason) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/points`, { points, reason });
      const sign = points > 0 ? "+" : "";
      showMessage(`تم ${reason}! ${sign}${points} نقطة 🌟`);
      await fetchStudents();
    } catch (error) {
      console.error("Error updating points:", error);
      showMessage("حدث خطأ في تحديث النقاط");
    } finally {
      setLoading(false);
    }
  };

  // Custom points
  const applyCustomPoints = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !customPoints.reason.trim()) return;
    
    await updatePoints(selectedStudent.id, parseInt(customPoints.points), customPoints.reason);
    setShowCustomPointsModal(false);
    setCustomPoints({ points: 0, reason: "" });
    setSelectedStudent(null);
  };

  // Mark attendance
  const markAttendance = async (studentId) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/attendance`);
      showMessage("تم تسجيل الحضور! +10 نقاط 🌟");
      await fetchStudents();
    } catch (error) {
      console.error("Error marking attendance:", error);
      showMessage("حدث خطأ في تسجيل الحضور");
    } finally {
      setLoading(false);
    }
  };

  // Mark notebook
  const markNotebook = async (studentId) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/notebook`);
      showMessage("تم تسجيل الدفتر! +120 نقطة 📚");
      await fetchStudents();
    } catch (error) {
      console.error("Error marking notebook:", error);
      if (error.response?.status === 400) {
        showMessage("الدفتر منجز مسبقاً ✓");
      } else {
        showMessage("حدث خطأ في تسجيل الدفتر");
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      phone: student.phone || "",
      group_name: student.group_name || "",
      image_file: null
    });
    setShowEditModal(true);
  };

  const openCustomPointsModal = (student) => {
    setSelectedStudent(student);
    setCustomPoints({ points: 0, reason: "" });
    setShowCustomPointsModal(true);
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 shadow-lg" data-testid="header-section">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 flex items-center justify-center gap-3" data-testid="app-title">
            <span className="text-5xl">🌱</span>
            <span>نادي غِراس</span>
          </h1>
          <p className="text-center text-green-100 text-lg" data-testid="app-subtitle">منصة تتبع نقاط الطلاب</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Message Alert */}
        {message && (
          <div className="mb-6 bg-white border-r-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md animate-fadeIn" data-testid="message-alert">
            <p className="font-semibold text-center">{message}</p>
          </div>
        )}

        {/* Add Student Button */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            data-testid="open-add-modal-button"
          >
            ➕ إضافة طالب جديد
          </button>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-emerald-500" data-testid="students-table-container">
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2" data-testid="students-table-title">
              <span className="text-3xl">🏆</span>
              <span>لوحة المتصدرين</span>
              <span className="mr-auto bg-green-600 text-white px-4 py-1 rounded-full text-sm" data-testid="students-count">
                {students.length} طالب
              </span>
            </h2>
          </div>

          {students.length === 0 ? (
            <div className="p-12 text-center text-gray-500" data-testid="empty-state">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-xl">لا يوجد طلاب بعد. ابدأ بإضافة طالب جديد!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="students-table">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-700" data-testid="header-rank">الترتيب</th>
                    <th className="px-4 py-4 text-right text-sm font-bold text-gray-700" data-testid="header-name">الاسم</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-700" data-testid="header-group">المجموعة</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-700" data-testid="header-points">النقاط</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-700" data-testid="header-notebook">الدفتر</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-gray-700" data-testid="header-actions">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr
                      key={student.id}
                      className={`border-b hover:bg-green-50 transition-colors ${
                        index === 0 ? "bg-yellow-50" : index === 1 ? "bg-gray-50" : index === 2 ? "bg-orange-50" : ""
                      }`}
                      data-testid={`student-row-${student.id}`}
                    >
                      <td className="px-4 py-4 text-right" data-testid={`student-rank-${student.id}`}>
                        <span className="text-2xl font-bold">
                          {index === 0 && "🥇"}
                          {index === 1 && "🥈"}
                          {index === 2 && "🥉"}
                          {index > 2 && <span className="text-gray-600">{index + 1}</span>}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right" data-testid={`student-name-${student.id}`}>
                        <Link
                          to={`/student/${student.id}`}
                          className="font-semibold text-gray-800 text-lg hover:text-green-600 hover:underline"
                          data-testid={`student-link-${student.id}`}
                        >
                          {student.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center" data-testid={`student-group-${student.id}`}>
                        <span className="text-sm text-gray-600">{student.group_name || "-"}</span>
                      </td>
                      <td className="px-4 py-4 text-center" data-testid={`student-points-${student.id}`}>
                        <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg">
                          {student.points} 🌟
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center" data-testid={`student-notebook-${student.id}`}>
                        {student.notebook === 1 ? (
                          <span className="text-2xl" title="منجز">✅</span>
                        ) : (
                          <span className="text-2xl" title="غير منجز">❌</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {/* Dropdown for positive points */}
                          <div className="relative group">
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all shadow hover:shadow-lg"
                              data-testid={`positive-points-button-${student.id}`}
                            >
                              ⊕ نقاط
                            </button>
                            <div className="hidden group-hover:block absolute z-10 bg-white rounded-lg shadow-xl border mt-1 w-48">
                              <button
                                onClick={() => markAttendance(student.id)}
                                className="block w-full text-right px-4 py-2 hover:bg-green-50 text-sm"
                                data-testid={`attendance-action-${student.id}`}
                              >
                                حضور (+10)
                              </button>
                              <button
                                onClick={() => updatePoints(student.id, 20, "مشروع طالب")}
                                className="block w-full text-right px-4 py-2 hover:bg-green-50 text-sm"
                                data-testid={`project-action-${student.id}`}
                              >
                                مشروع طالب (+20)
                              </button>
                              <button
                                onClick={() => updatePoints(student.id, 20, "إلقاء كلمة")}
                                className="block w-full text-right px-4 py-2 hover:bg-green-50 text-sm"
                                data-testid={`speech-action-${student.id}`}
                              >
                                إلقاء كلمة (+20)
                              </button>
                              <button
                                onClick={() => updatePoints(student.id, 10, "أفعال إيجابية أخرى")}
                                className="block w-full text-right px-4 py-2 hover:bg-green-50 text-sm"
                                data-testid={`other-positive-action-${student.id}`}
                              >
                                أفعال أخرى (+10)
                              </button>
                              <button
                                onClick={() => markNotebook(student.id)}
                                disabled={student.notebook === 1}
                                className="block w-full text-right px-4 py-2 hover:bg-green-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid={`notebook-action-${student.id}`}
                              >
                                دفتر (+120)
                              </button>
                            </div>
                          </div>

                          {/* Dropdown for negative points */}
                          <div className="relative group">
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all shadow hover:shadow-lg"
                              data-testid={`negative-points-button-${student.id}`}
                            >
                              ⊖ خصم
                            </button>
                            <div className="hidden group-hover:block absolute z-10 bg-white rounded-lg shadow-xl border mt-1 w-56">
                              <button
                                onClick={() => updatePoints(student.id, -5, "تأخير")}
                                className="block w-full text-right px-4 py-2 hover:bg-red-50 text-sm"
                                data-testid={`late-action-${student.id}`}
                              >
                                تأخير (-5)
                              </button>
                              <button
                                onClick={() => updatePoints(student.id, -40, "غياب")}
                                className="block w-full text-right px-4 py-2 hover:bg-red-50 text-sm"
                                data-testid={`absence-action-${student.id}`}
                              >
                                غياب (-40)
                              </button>
                              <button
                                onClick={() => updatePoints(student.id, -40, "التلفظ")}
                                className="block w-full text-right px-4 py-2 hover:bg-red-50 text-sm"
                                data-testid={`verbal-action-${student.id}`}
                              >
                                التلفظ (-40)
                              </button>
                              <button
                                onClick={() => updatePoints(student.id, -15, "عدم إحضار الدفتر")}
                                className="block w-full text-right px-4 py-2 hover:bg-red-50 text-sm"
                                data-testid={`no-notebook-action-${student.id}`}
                              >
                                عدم إحضار الدفتر (-15)
                              </button>
                              <button
                                onClick={() => updatePoints(student.id, -10, "أفعال سلبية أخرى")}
                                className="block w-full text-right px-4 py-2 hover:bg-red-50 text-sm"
                                data-testid={`negative-action-${student.id}`}
                              >
                                أفعال سلبية أخرى (-10)
                              </button>
                            </div>
                          </div>

                          {/* Custom points button */}
                          <button
                            onClick={() => openCustomPointsModal(student)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all shadow hover:shadow-lg"
                            data-testid={`custom-points-button-${student.id}`}
                            title="نقاط مخصصة"
                          >
                            ✏️
                          </button>

                          {/* Settings button */}
                          <button
                            onClick={() => openEditModal(student)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all shadow hover:shadow-lg"
                            data-testid={`edit-button-${student.id}`}
                          >
                            ⚙️
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all shadow hover:shadow-lg"
                            data-testid={`delete-button-${student.id}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {students.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="stats-section">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-blue-500" data-testid="stat-total-students">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-3xl font-bold text-gray-800">{students.length}</div>
              <div className="text-gray-600">إجمالي الطلاب</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-green-500" data-testid="stat-total-points">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-gray-800">
                {students.reduce((sum, s) => sum + s.points, 0)}
              </div>
              <div className="text-gray-600">إجمالي النقاط</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-purple-500" data-testid="stat-notebooks-completed">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-3xl font-bold text-gray-800">
                {students.filter((s) => s.notebook === 1).length}
              </div>
              <div className="text-gray-600">دفاتر منجزة</div>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="add-modal">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">➕ إضافة طالب جديد</h3>
            <form onSubmit={addStudent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="اسم الطالب"
                    required
                    data-testid="add-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">جوال ولي الأمر</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="05xxxxxxxx"
                    data-testid="add-phone-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المجموعة</label>
                  <input
                    type="text"
                    value={addForm.group_name}
                    onChange={(e) => setAddForm({ ...addForm, group_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="اسم المجموعة"
                    data-testid="add-group-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الطالب</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAddForm({ ...addForm, image_file: e.target.files[0] })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    data-testid="add-image-input"
                  />
                  {addForm.image_file && (
                    <p className="text-sm text-green-600 mt-1">تم اختيار: {addForm.image_file.name}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                  data-testid="add-submit-button"
                >
                  {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                  data-testid="add-cancel-button"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="edit-modal">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">⚙️ تعديل بيانات الطالب</h3>
            <form onSubmit={updateStudent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="اسم الطالب"
                    required
                    data-testid="edit-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">جوال ولي الأمر</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="05xxxxxxxx"
                    data-testid="edit-phone-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المجموعة</label>
                  <input
                    type="text"
                    value={editForm.group_name}
                    onChange={(e) => setEditForm({ ...editForm, group_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="اسم المجموعة"
                    data-testid="edit-group-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تغيير الصورة</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditForm({ ...editForm, image_file: e.target.files[0] })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    data-testid="edit-image-input"
                  />
                  {editForm.image_file && (
                    <p className="text-sm text-green-600 mt-1">تم اختيار: {editForm.image_file.name}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                  data-testid="edit-submit-button"
                >
                  {loading ? "جاري التحديث..." : "تحديث"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                  data-testid="edit-cancel-button"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Points Modal */}
      {showCustomPointsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="custom-points-modal">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">✏️ نقاط مخصصة</h3>
            <p className="text-gray-600 mb-4">الطالب: <span className="font-bold">{selectedStudent.name}</span></p>
            <form onSubmit={applyCustomPoints}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">عدد النقاط *</label>
                  <input
                    type="number"
                    value={customPoints.points}
                    onChange={(e) => setCustomPoints({ ...customPoints, points: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="أدخل عدد النقاط (موجب أو سالب)"
                    required
                    data-testid="custom-points-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">مثال: 50 أو -25</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">السبب *</label>
                  <input
                    type="text"
                    value={customPoints.reason}
                    onChange={(e) => setCustomPoints({ ...customPoints, reason: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="مثال: فوز في مسابقة"
                    required
                    data-testid="custom-reason-input"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                  data-testid="custom-points-submit-button"
                >
                  {loading ? "جاري التطبيق..." : "تطبيق"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomPointsModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                  data-testid="custom-points-cancel-button"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/student/:studentId" element={<StudentProfile />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import PointsModal from "./PointsModal";
import LeaderboardTicker from "./LeaderboardTicker";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("ghiras_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Predefined colors for supervisors
const SUPERVISOR_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-800", badge: "bg-blue-500" },
  { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-800", badge: "bg-purple-500" },
  { bg: "bg-pink-50", border: "border-pink-500", text: "text-pink-800", badge: "bg-pink-500" },
  { bg: "bg-orange-50", border: "border-orange-500", text: "text-orange-800", badge: "bg-orange-500" },
  { bg: "bg-teal-50", border: "border-teal-500", text: "text-teal-800", badge: "bg-teal-500" },
  { bg: "bg-indigo-50", border: "border-indigo-500", text: "text-indigo-800", badge: "bg-indigo-500" },
  { bg: "bg-rose-50", border: "border-rose-500", text: "text-rose-800", badge: "bg-rose-500" },
  { bg: "bg-cyan-50", border: "border-cyan-500", text: "text-cyan-800", badge: "bg-cyan-500" }
];

function Dashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", supervisor: "", image_file: null });
  const [addForm, setAddForm] = useState({ name: "", phone: "", supervisor: "", image_file: null });
  const qrPrintRef = useRef();

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data);
      
      // Extract unique supervisors
      const uniqueSupervisors = [...new Set(response.data.map(s => s.supervisor).filter(Boolean))];
      setSupervisors(uniqueSupervisors);
    } catch (error) {
      console.error("Error fetching students:", error);
      showMessage("حدث خطأ في جلب البيانات");
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const addStudent = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;

    setLoading(true);
    try {
      const studentData = {
        name: addForm.name,
        phone: addForm.phone || null,
        supervisor: addForm.supervisor || null,
        image_url: null
      };
      
      const response = await axios.post(`${API}/students`, studentData, {
        headers: getAuthHeader()
      });
      const newStudent = response.data;
      
      if (addForm.image_file) {
        const formData = new FormData();
        formData.append('file', addForm.image_file);
        await axios.post(`${API}/students/${newStudent.id}/upload-image`, formData, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setAddForm({ name: "", phone: "", supervisor: "", image_file: null });
      setShowAddModal(false);
      showMessage("تمت إضافة الطالب بنجاح!");
      await fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
      if (error.response?.status === 401) {
        showMessage("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
        onLogout?.();
      } else {
        showMessage("حدث خطأ في إضافة الطالب");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const updateData = {
        name: editForm.name,
        phone: editForm.phone || null,
        supervisor: editForm.supervisor || null
      };
      
      await axios.put(`${API}/students/${selectedStudent.id}`, updateData, {
        headers: getAuthHeader()
      });
      
      if (editForm.image_file) {
        const formData = new FormData();
        formData.append('file', editForm.image_file);
        await axios.post(`${API}/students/${selectedStudent.id}/upload-image`, formData, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowEditModal(false);
      setSelectedStudent(null);
      showMessage("تم تحديث بيانات الطالب بنجاح!");
      await fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      if (error.response?.status === 401) {
        showMessage("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
        onLogout?.();
      } else {
        showMessage("حدث خطأ في تحديث البيانات");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;

    setLoading(true);
    try {
      await axios.delete(`${API}/students/${studentId}`, {
        headers: getAuthHeader()
      });
      showMessage("تم حذف الطالب بنجاح!");
      await fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      if (error.response?.status === 401) {
        showMessage("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
        onLogout?.();
      } else {
        showMessage("حدث خطأ في حذف الطالب");
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePoints = async (studentId, points, reason) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/points`, { points, reason }, {
        headers: getAuthHeader()
      });
      const sign = points > 0 ? "+" : "";
      showMessage(`تم ${reason}! ${sign}${points} نقطة`);
      setShowPointsModal(false);
      setSelectedStudent(null);
      await fetchStudents();
    } catch (error) {
      console.error("Error updating points:", error);
      if (error.response?.status === 401) {
        showMessage("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
        onLogout?.();
      } else {
        showMessage("حدث خطأ في تحديث النقاط");
      }
    } finally {
      setLoading(false);
    }
  };

  const openPointsModal = (student) => {
    setSelectedStudent(student);
    setShowPointsModal(true);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      phone: student.phone || "",
      supervisor: student.supervisor || "",
      image_file: null
    });
    setShowEditModal(true);
  };

  const printAllQRCodes = () => {
    const printWindow = window.open("", "_blank");
    const qrContent = document.getElementById("all-qr-codes").innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>باركودات الطلاب - نادي غِراس</title>
        <style>
          body { font-family: 'Cairo', Arial; direction: rtl; padding: 20px; }
          .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
          .qr-item { text-align: center; page-break-inside: avoid; border: 2px solid #16a34a; padding: 20px; border-radius: 10px; }
          .qr-item h3 { color: #16a34a; margin: 10px 0; }
          .qr-item p { color: #666; font-size: 14px; }
          @media print {
            @page { margin: 1cm; }
            .qr-grid { gap: 20px; }
          }
        </style>
      </head>
      <body>
        <h1 style="text-align: center; color: #16a34a;">🌱 باركودات طلاب نادي غِراس</h1>
        <div class="qr-grid">${qrContent}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group students by supervisor
  const groupedStudents = {};
  const noSupervisorStudents = [];
  
  students.forEach(student => {
    if (student.supervisor) {
      if (!groupedStudents[student.supervisor]) {
        groupedStudents[student.supervisor] = [];
      }
      groupedStudents[student.supervisor].push(student);
    } else {
      noSupervisorStudents.push(student);
    }
  });

  // Sort students within each group by points
  Object.keys(groupedStudents).forEach(supervisor => {
    groupedStudents[supervisor].sort((a, b) => b.points - a.points);
  });
  noSupervisorStudents.sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
              data-testid="logout-btn"
            >
              <span>تسجيل الخروج</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">نادي غِراس</h1>
              <img src="/logo.png" alt="شعار النادي" className="w-14 h-14 rounded-full bg-white p-1" />
            </div>
          </div>
          <p className="text-center text-green-100 text-base">لوحة تحكم المسؤول - إدارة نقاط الطلاب</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Message Alert */}
        {message && (
          <div className="mb-6 bg-white border-r-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md animate-fadeIn">
            <p className="font-semibold text-center">{message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
            data-testid="add-student-btn"
          >
            ➕ إضافة طالب جديد
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
            data-testid="leaderboard-btn"
          >
            🏆 ترتيب الطلاب
          </button>
          <Link
            to="/challenges"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all inline-block"
            data-testid="challenges-link"
          >
            🎯 إدارة المنافسات
          </Link>
          <button
            onClick={() => setShowQRModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
            data-testid="qr-codes-btn"
          >
            📱 باركودات الطلاب
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-blue-500">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-gray-800">{students.length}</div>
            <div className="text-gray-600">إجمالي الطلاب</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-green-500">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-gray-800">
              {students.reduce((sum, s) => sum + s.points, 0)}
            </div>
            <div className="text-gray-600">إجمالي النقاط</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-purple-500">
            <div className="text-3xl mb-2">👨‍🏫</div>
            <div className="text-3xl font-bold text-gray-800">{supervisors.length}</div>
            <div className="text-gray-600">عدد المشرفين</div>
          </div>
        </div>

        {/* Students by Supervisor */}
        {Object.keys(groupedStudents).map((supervisor, idx) => {
          const color = SUPERVISOR_COLORS[idx % SUPERVISOR_COLORS.length];
          const supervisorStudents = groupedStudents[supervisor];
          
          return (
            <div key={supervisor} className={`mb-8 ${color.bg} rounded-2xl shadow-xl overflow-hidden border-4 ${color.border}`}>
              {/* Supervisor Header */}
              <div className={`${color.badge} text-white py-4 px-6`}>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span>👨‍🏫</span>
                  <span>المشرف: {supervisor}</span>
                  <span className="mr-auto bg-white ${color.text} px-4 py-1 rounded-full text-sm">
                    {supervisorStudents.length} طالب
                  </span>
                </h2>
              </div>

              {/* Students Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supervisorStudents.map((student, studentIdx) => (
                  <div key={student.id} className="bg-white rounded-xl shadow-lg p-4 border-2 ${color.border}">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">
                        {studentIdx === 0 && "🥇"}
                        {studentIdx === 1 && "🥈"}
                        {studentIdx === 2 && "🥉"}
                        {studentIdx > 2 && <span className={`${color.text} font-bold`}>#{studentIdx + 1}</span>}
                      </div>
                      <div className={`${color.badge} text-white px-3 py-1 rounded-full font-bold text-sm`}>
                        {student.points} نقطة
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {student.image_url ? (
                        <img src={student.image_url} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 ${color.border}" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full ${color.badge} flex items-center justify-center text-white text-xl font-bold`}>
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <Link
                          to={`/public/${student.id}`}
                          className={`font-bold text-lg ${color.text} hover:underline`}
                        >
                          {student.name}
                        </Link>
                        {student.phone && (
                          <div className="text-xs text-gray-600" dir="ltr">{student.phone}</div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Simplified with Points Modal */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openPointsModal(student)} 
                        className={`flex-1 ${color.badge} hover:opacity-90 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all`}
                        data-testid={`points-btn-${student.id}`}
                      >
                        تعديل النقاط
                      </button>
                      <button 
                        onClick={() => openEditModal(student)} 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                        data-testid={`edit-btn-${student.id}`}
                      >
                        ⚙️
                      </button>
                      <button 
                        onClick={() => deleteStudent(student.id)} 
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
                        data-testid={`delete-btn-${student.id}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Students without supervisor */}
        {noSupervisorStudents.length > 0 && (
          <div className="mb-8 bg-gray-50 rounded-2xl shadow-xl overflow-hidden border-4 border-gray-400">
            <div className="bg-gray-500 text-white py-4 px-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span>📋</span>
                <span>طلاب بدون مشرف</span>
                <span className="mr-auto bg-white text-gray-800 px-4 py-1 rounded-full text-sm">
                  {noSupervisorStudents.length} طالب
                </span>
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {noSupervisorStudents.map((student, idx) => (
                <div key={student.id} className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-gray-600 font-bold">#{idx + 1}</div>
                    <div className="bg-gray-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                      {student.points} نقطة
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {student.image_url ? (
                      <img src={student.image_url} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white text-xl font-bold">
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <Link to={`/public/${student.id}`} className="font-bold text-lg text-gray-800 hover:underline">
                        {student.name}
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openPointsModal(student)} 
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                    >
                      تعديل النقاط
                    </button>
                    <button onClick={() => openEditModal(student)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">⚙️</button>
                    <button onClick={() => deleteStudent(student.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {students.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl text-gray-600">لا يوجد طلاب بعد. ابدأ بإضافة طالب جديد!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-4 text-center">
        <p className="text-sm">تطوير: <span className="font-bold text-green-400">Aboughaith97</span></p>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المشرف</label>
                  <input
                    type="text"
                    list="supervisors-list"
                    value={addForm.supervisor}
                    onChange={(e) => setAddForm({ ...addForm, supervisor: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="اختر أو أدخل اسم المشرف"
                  />
                  <datalist id="supervisors-list">
                    {supervisors.map(sup => (
                      <option key={sup} value={sup} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الطالب</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAddForm({ ...addForm, image_file: e.target.files[0] })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
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
                >
                  {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
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
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">جوال ولي الأمر</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المشرف</label>
                  <input
                    type="text"
                    list="supervisors-list-edit"
                    value={editForm.supervisor}
                    onChange={(e) => setEditForm({ ...editForm, supervisor: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                  <datalist id="supervisors-list-edit">
                    {supervisors.map(sup => (
                      <option key={sup} value={sup} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تغيير الصورة</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditForm({ ...editForm, image_file: e.target.files[0] })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
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
                >
                  {loading ? "جاري التحديث..." : "تحديث"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Points Modal */}
      {showPointsModal && selectedStudent && (
        <PointsModal
          student={selectedStudent}
          onClose={() => {
            setShowPointsModal(false);
            setSelectedStudent(null);
          }}
          onUpdatePoints={updatePoints}
          loading={loading}
        />
      )}

      {/* QR Codes Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📱 باركودات الطلاب</h3>
              <div className="flex gap-2">
                <button
                  onClick={printAllQRCodes}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
                >
                  🖨️ طباعة الكل
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
            
            <div id="all-qr-codes" className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {students.map(student => (
                <div key={student.id} className="text-center p-4 border-2 border-green-500 rounded-lg">
                  <h4 className="font-bold text-lg mb-2 text-gray-800">{student.name}</h4>
                  {student.supervisor && (
                    <p className="text-sm text-gray-600 mb-2">المشرف: {student.supervisor}</p>
                  )}
                  <div className="bg-white p-3 inline-block">
                    <QRCodeSVG
                      value={`${window.location.origin}/public/${student.id}`}
                      size={150}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">امسح للوصول إلى الملف</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Drawer */}
      <LeaderboardDrawer
        students={students}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}

export default Dashboard;

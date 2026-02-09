import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [students, setStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setMessage("حدث خطأ في جلب البيانات");
    }
  };

  // Add new student
  const addStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${API}/students`, { name: newStudentName });
      setNewStudentName("");
      setMessage("تمت إضافة الطالب بنجاح! 🎉");
      await fetchStudents();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error adding student:", error);
      setMessage("حدث خطأ في إضافة الطالب");
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance
  const markAttendance = async (studentId) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/attendance`);
      setMessage("تم تسجيل الحضور! +10 نقاط 🌟");
      await fetchStudents();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error marking attendance:", error);
      setMessage("حدث خطأ في تسجيل الحضور");
    } finally {
      setLoading(false);
    }
  };

  // Mark notebook
  const markNotebook = async (studentId) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/notebook`);
      setMessage("تم تسجيل الدفتر! +120 نقطة 📚");
      await fetchStudents();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error marking notebook:", error);
      if (error.response?.status === 400) {
        setMessage("الدفتر منجز مسبقاً ✓");
      } else {
        setMessage("حدث خطأ في تسجيل الدفتر");
      }
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
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

        {/* Add Student Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border-t-4 border-green-500" data-testid="add-student-form">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2" data-testid="form-title">
            <span className="text-3xl">➕</span>
            <span>إضافة طالب جديد</span>
          </h2>
          <form onSubmit={addStudent} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="اسم الطالب"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-lg"
              disabled={loading}
              required
              data-testid="student-name-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              data-testid="add-student-button"
            >
              {loading ? "جاري الإضافة..." : "إضافة طالب"}
            </button>
          </form>
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
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700" data-testid="header-rank">الترتيب</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700" data-testid="header-name">الاسم</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700" data-testid="header-points">النقاط</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700" data-testid="header-notebook">الدفتر</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700" data-testid="header-actions">الإجراءات</th>
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
                      <td className="px-6 py-4 text-right" data-testid={`student-rank-${student.id}`}>
                        <span className="text-2xl font-bold">
                          {index === 0 && "🥇"}
                          {index === 1 && "🥈"}
                          {index === 2 && "🥉"}
                          {index > 2 && <span className="text-gray-600">{index + 1}</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" data-testid={`student-name-${student.id}`}>
                        <span className="font-semibold text-gray-800 text-lg">{student.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center" data-testid={`student-points-${student.id}`}>
                        <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg">
                          {student.points} 🌟
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" data-testid={`student-notebook-${student.id}`}>
                        {student.notebook === 1 ? (
                          <span className="text-2xl" title="منجز">✅</span>
                        ) : (
                          <span className="text-2xl" title="غير منجز">❌</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => markAttendance(student.id)}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg text-sm"
                            data-testid={`attendance-button-${student.id}`}
                          >
                            حضور +10
                          </button>
                          <button
                            onClick={() => markNotebook(student.id)}
                            disabled={loading || student.notebook === 1}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg text-sm"
                            data-testid={`notebook-button-${student.id}`}
                          >
                            دفتر +120
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
    </div>
  );
}

export default App;
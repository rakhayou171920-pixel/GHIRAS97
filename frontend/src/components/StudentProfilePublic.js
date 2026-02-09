import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function StudentProfilePublic() {
  const { studentId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student profile
        const profileRes = await axios.get(`${API}/students/${studentId}/profile`);
        setProfileData(profileRes.data);

        // Fetch all students to get top 10
        const studentsRes = await axios.get(`${API}/students`);
        const sorted = studentsRes.data.sort((a, b) => b.points - a.points);
        setTopStudents(sorted.slice(0, 10));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <img src="/logo.png" alt="شعار النادي" className="w-20 h-20 mx-auto mb-4 rounded-full bg-white p-2" />
          <h1 className="text-4xl md:text-5xl font-bold">🌱 نادي غِراس</h1>
          <p className="text-green-100 text-lg mt-2">ملف الطالب الشخصي</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-green-500 sticky top-4">
                <div className="p-8">
                  {/* Image */}
                  <div className="flex justify-center mb-6">
                    {student.image_url ? (
                      <img
                        src={student.image_url}
                        alt={student.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-green-500">
                        {student.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    {student.name}
                  </h2>

                  {/* Rank Badge */}
                  <div className="flex justify-center mb-8">
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
                  <div className="bg-green-50 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-green-600 mb-2">{student.points}</div>
                      <div className="text-gray-600 text-lg">نقطة 🌟</div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  {(student.group_name || student.phone) && (
                    <div className="space-y-3 mb-6">
                      {student.group_name && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">المجموعة</div>
                          <div className="text-lg font-semibold text-gray-800">{student.group_name}</div>
                        </div>
                      )}
                      {student.phone && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">جوال ولي الأمر</div>
                          <div className="text-lg font-semibold text-gray-800" dir="ltr">{student.phone}</div>
                        </div>
                      )}
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">حالة الدفتر</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {student.notebook === 1 ? "✅ منجز" : "❌ غير منجز"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top 10 Leaderboard */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-yellow-500">
                <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="text-4xl">🏆</span>
                    <span>أفضل 10 طلاب</span>
                  </h2>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {topStudents.map((topStudent, index) => {
                      const isCurrentStudent = topStudent.id === studentId;
                      return (
                        <div
                          key={topStudent.id}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            isCurrentStudent
                              ? "bg-green-100 border-2 border-green-500 shadow-lg scale-105"
                              : index === 0
                              ? "bg-yellow-50"
                              : index === 1
                              ? "bg-gray-50"
                              : index === 2
                              ? "bg-orange-50"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0 w-16 text-center">
                            <div className="text-4xl">
                              {index === 0 && "🥇"}
                              {index === 1 && "🥈"}
                              {index === 2 && "🥉"}
                              {index > 2 && <span className="text-2xl font-bold text-gray-600">{index + 1}</span>}
                            </div>
                          </div>

                          {/* Image */}
                          <div className="flex-shrink-0">
                            {topStudent.image_url ? (
                              <img
                                src={topStudent.image_url}
                                alt={topStudent.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-green-500">
                                {topStudent.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Name and Group */}
                          <div className="flex-grow">
                            <div className="font-bold text-xl text-gray-800 mb-1">
                              {topStudent.name}
                              {isCurrentStudent && (
                                <span className="mr-2 text-green-600 text-sm">(أنت)</span>
                              )}
                            </div>
                            {topStudent.group_name && (
                              <div className="text-sm text-gray-600">{topStudent.group_name}</div>
                            )}
                          </div>

                          {/* Points */}
                          <div className="flex-shrink-0 text-left">
                            <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-md">
                              {topStudent.points} 🌟
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message if not in top 10 */}
                  {rank > 10 && (
                    <div className="mt-6 p-6 bg-blue-50 rounded-xl text-center">
                      <p className="text-lg text-gray-700">
                        💪 أنت في المرتبة <span className="font-bold text-blue-600">#{rank}</span>
                      </p>
                      <p className="text-gray-600 mt-2">
                        تحتاج إلى <span className="font-bold">{topStudents[9]?.points - student.points + 1}</span> نقطة للدخول إلى قائمة العشرة الأوائل!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">شارك رابطك الشخصي</h3>
              <div className="flex gap-2 max-w-2xl mx-auto">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("تم نسخ الرابط!");
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
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

export default StudentProfilePublic;
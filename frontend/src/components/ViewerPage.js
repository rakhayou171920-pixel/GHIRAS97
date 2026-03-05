import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ViewerPage({ token }) {
  const [viewerName, setViewerName] = useState("");
  const [students, setStudents] = useState([]);
  const [leagueStar, setLeagueStar] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [viewerRes, studentsRes, starRes, standingsRes] = await Promise.all([
          axios.get(`${API}/viewer/${token}`),
          axios.get(`${API}/students?lite=true`),
          axios.get(`${API}/league-star`),
          axios.get(`${API}/league-standings`)
        ]);
        setViewerName(viewerRes.data.name);
        setStudents(studentsRes.data);
        setLeagueStar(starRes.data);
        setStandings(standingsRes.data);
      } catch {
        setError("رابط غير صالح");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">جاري التحميل...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-xl text-red-600">{error}</div>;

  const supervisors = [...new Set(students.map(s => s.supervisor).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">نادي غِراس</h1>
          <p className="text-green-100 mt-1">مرحباً {viewerName} - وضع المشاهدة</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* League Star */}
        {leagueStar && (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 text-center text-white shadow-lg" data-testid="viewer-league-star">
            <div className="text-3xl mb-1">&#9733;</div>
            <h2 className="text-xl font-bold">نجم الدوري</h2>
            <p className="text-2xl font-bold mt-1">{leagueStar.student_name}</p>
            <p className="text-yellow-100 text-sm">{leagueStar.reason}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-green-600">{students.length}</div>
            <div className="text-sm text-gray-600">طالب</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-blue-600">{supervisors.length}</div>
            <div className="text-sm text-gray-600">مجموعة</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <div className="text-2xl font-bold text-purple-600">{students.reduce((a, s) => a + s.points, 0)}</div>
            <div className="text-sm text-gray-600">نقطة</div>
          </div>
        </div>

        {/* League Standings */}
        {standings.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
              <h2 className="text-lg font-bold text-center">جدول الدوري الكروي</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3 text-right">الفريق</th>
                    <th className="p-3">لعب</th>
                    <th className="p-3">فاز</th>
                    <th className="p-3">تعادل</th>
                    <th className="p-3">خسر</th>
                    <th className="p-3">له</th>
                    <th className="p-3">عليه</th>
                    <th className="p-3 font-bold">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr key={t.team} className={i < 1 ? "bg-yellow-50 font-bold" : i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="p-3 text-center">{i + 1}</td>
                      <td className="p-3 font-semibold">{t.team}</td>
                      <td className="p-3 text-center">{t.played}</td>
                      <td className="p-3 text-center">{t.won}</td>
                      <td className="p-3 text-center">{t.drawn}</td>
                      <td className="p-3 text-center">{t.lost}</td>
                      <td className="p-3 text-center">{t.gf}</td>
                      <td className="p-3 text-center">{t.ga}</td>
                      <td className="p-3 text-center font-bold text-green-600">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students by Group */}
        {supervisors.map(sup => (
          <div key={sup} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3">
              <h3 className="font-bold">{sup}</h3>
            </div>
            <div className="p-4 space-y-2">
              {students.filter(s => s.supervisor === sup).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-6">{i + 1}</span>
                    <Link to={`/public/${s.id}`} className="font-semibold text-gray-800 hover:text-green-600">{s.name}</Link>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">{s.points}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewerPage;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ViewerPage({ token }) {
  const [viewerName, setViewerName] = useState("");
  const [students, setStudents] = useState([]);
  const [leagueStar, setLeagueStar] = useState(null);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [viewerRes, studentsRes, starRes, standingsRes, matchesRes, tasksRes] = await Promise.all([
          axios.get(`${API}/viewer/${token}`),
          axios.get(`${API}/students?lite=true`),
          axios.get(`${API}/league-star`),
          axios.get(`${API}/league-standings`),
          axios.get(`${API}/matches`),
          axios.get(`${API}/tasks`)
        ]);
        setViewerName(viewerRes.data.name);
        setStudents(studentsRes.data);
        setLeagueStar(starRes.data);
        setStandings(standingsRes.data);
        setMatches(matchesRes.data);
        setTasks(tasksRes.data);
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

  const top10 = [...students].sort((a, b) => b.points - a.points).slice(0, 10);
  const pendingMatches = matches.filter(m => !m.played);
  const pendingTasks = tasks.filter(t => !t.completed);
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

      <div className="container mx-auto px-4 py-6 space-y-5 max-w-2xl">
        {/* League Star */}
        {leagueStar && (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 text-center text-white shadow-lg">
            <div className="text-3xl">&#9733;</div>
            <p className="text-sm opacity-80">نجم الدوري</p>
            {leagueStar.image_url ? (
              <img src={leagueStar.image_url} alt="" className="w-16 h-16 rounded-full object-cover border-4 border-white/40 mx-auto mt-1" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mx-auto mt-1">{leagueStar.student_name?.charAt(0)}</div>
            )}
            <p className="text-xl font-bold mt-1">{leagueStar.student_name}</p>
            <p className="text-yellow-100 text-xs">{leagueStar.reason}</p>
          </div>
        )}

        {/* Top 10 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-3">
            <h2 className="font-bold text-center text-sm">أفضل 10 طلاب</h2>
          </div>
          <div className="divide-y">
            {top10.map((s, i) => (
              <div key={s.id} className={`flex items-center justify-between p-3 ${i < 3 ? "bg-yellow-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600"}`}>{i + 1}</span>
                  <Link to={`/public/${s.id}`} className="font-semibold text-gray-800 hover:text-green-600 text-sm">{s.name}</Link>
                </div>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-sm font-bold">{s.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* League Standings */}
        {standings.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3">
              <h2 className="font-bold text-center text-sm">جدول الدوري الكروي</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2 text-right">الفريق</th>
                    <th className="p-2">لعب</th>
                    <th className="p-2">فاز</th>
                    <th className="p-2">تعادل</th>
                    <th className="p-2">خسر</th>
                    <th className="p-2">له</th>
                    <th className="p-2">عليه</th>
                    <th className="p-2 font-bold">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr key={t.team} className={i === 0 ? "bg-yellow-50 font-bold" : i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="p-2 text-center">{i + 1}</td>
                      <td className="p-2 font-semibold">{t.team}</td>
                      <td className="p-2 text-center">{t.played}</td>
                      <td className="p-2 text-center">{t.won}</td>
                      <td className="p-2 text-center">{t.drawn}</td>
                      <td className="p-2 text-center">{t.lost}</td>
                      <td className="p-2 text-center">{t.gf}</td>
                      <td className="p-2 text-center">{t.ga}</td>
                      <td className="p-2 text-center font-bold text-green-600">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Matches */}
        {pendingMatches.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3">
              <h2 className="font-bold text-center text-sm">المباريات القادمة</h2>
            </div>
            <div className="divide-y">
              {pendingMatches.map(m => (
                <div key={m.id} className="flex items-center justify-center gap-3 p-3">
                  <span className="font-bold text-gray-800 text-sm">{m.team1}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-xs">VS</span>
                  <span className="font-bold text-gray-800 text-sm">{m.team2}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Tasks */}
        {pendingTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3">
              <h2 className="font-bold text-center text-sm">المهام الأسبوعية</h2>
            </div>
            <div className="p-3 space-y-2">
              {supervisors.map(sup => {
                const groupTasks = pendingTasks.filter(t => t.group === sup);
                if (groupTasks.length === 0) return null;
                return (
                  <div key={sup}>
                    <p className="text-xs font-bold text-gray-500 mb-1">{sup}</p>
                    {groupTasks.map(task => (
                      <div key={task.id} className={`p-2 rounded-lg mb-1 border text-sm ${task.claimed_by ? "border-yellow-300 bg-yellow-50" : "border-blue-200 bg-blue-50"}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{task.description}</span>
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">{task.points} نقطة</span>
                        </div>
                        {task.claimed_by_name && <p className="text-xs text-yellow-600 mt-1">حجزها: {task.claimed_by_name}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Students by Group */}
        {supervisors.map(sup => (
          <div key={sup} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-3">
              <h3 className="font-bold text-sm">{sup} ({students.filter(s => s.supervisor === sup).length} طالب)</h3>
            </div>
            <div className="divide-y">
              {students.filter(s => s.supervisor === sup).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-5">{i + 1}</span>
                    <Link to={`/public/${s.id}`} className="font-semibold text-gray-800 hover:text-green-600 text-sm">{s.name}</Link>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{s.points}</span>
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

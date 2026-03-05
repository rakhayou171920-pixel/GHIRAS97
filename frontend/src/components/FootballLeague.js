import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function FootballLeague({ supervisors }) {
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const headers = {};

  const fetchData = async () => {
    try {
      const [matchRes, standRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-standings`)
      ]);
      setMatches(matchRes.data);
      setStandings(standRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addMatch = async (e) => {
    e.preventDefault();
    if (team1 === team2) { setMessage("لا يمكن اختيار نفس الفريق"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/matches`, { team1, team2, score1, score2 }, { headers });
      setShowAddMatch(false);
      setTeam1(""); setTeam2(""); setScore1(0); setScore2(0);
      setMessage("تمت إضافة المباراة");
      await fetchData();
    } catch (err) {
      setMessage("خطأ في إضافة المباراة");
    } finally { setLoading(false); }
  };

  const deleteMatch = async (id) => {
    if (!window.confirm("حذف هذه المباراة؟")) return;
    try {
      await axios.delete(`${API}/matches/${id}`, { headers });
      await fetchData();
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  return (
    <div className="space-y-6">
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-semibold">{message}</div>}

      {/* Standings */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">جدول الدوري</h2>
          <button onClick={() => setShowAddMatch(true)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold" data-testid="add-match-btn">
            + إضافة مباراة
          </button>
        </div>
        {standings.length > 0 ? (
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
                  <th className="p-3">+/-</th>
                  <th className="p-3 font-bold">النقاط</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((t, i) => (
                  <tr key={t.team} className={i === 0 ? "bg-yellow-50 font-bold" : i % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="p-3 text-center">{i + 1}</td>
                    <td className="p-3 font-semibold">{t.team}</td>
                    <td className="p-3 text-center">{t.played}</td>
                    <td className="p-3 text-center text-green-600">{t.won}</td>
                    <td className="p-3 text-center text-yellow-600">{t.drawn}</td>
                    <td className="p-3 text-center text-red-600">{t.lost}</td>
                    <td className="p-3 text-center">{t.gf}</td>
                    <td className="p-3 text-center">{t.ga}</td>
                    <td className="p-3 text-center">{t.gd > 0 ? '+' : ''}{t.gd}</td>
                    <td className="p-3 text-center font-bold text-green-600 text-lg">{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">لا توجد مباريات بعد</div>
        )}
      </div>

      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-100 p-3">
            <h3 className="font-bold text-gray-700">آخر المباريات</h3>
          </div>
          <div className="divide-y">
            {matches.slice(0, 10).map(m => (
              <div key={m.id} className="flex items-center p-3 hover:bg-gray-50">
                <div className="flex-1 flex items-center justify-center gap-4">
                  <span className="font-bold text-gray-800 flex-1 text-left">{m.team1}</span>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold min-w-[80px] text-center">
                    {m.score1} - {m.score2}
                  </span>
                  <span className="font-bold text-gray-800 flex-1 text-right">{m.team2}</span>
                </div>
                <button onClick={() => deleteMatch(m.id)} className="mr-3 text-red-400 hover:text-red-600 text-lg">&#10005;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Match Modal */}
      {showAddMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddMatch(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">إضافة مباراة جديدة</h3>
            <form onSubmit={addMatch} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">الفريق الأول</label>
                <select value={team1} onChange={e => setTeam1(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required data-testid="match-team1">
                  <option value="">اختر الفريق</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">الفريق الثاني</label>
                <select value={team2} onChange={e => setTeam2(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required data-testid="match-team2">
                  <option value="">اختر الفريق</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">أهداف الأول</label>
                  <input type="number" min="0" value={score1} onChange={e => setScore1(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 text-center text-xl" data-testid="match-score1" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">أهداف الثاني</label>
                  <input type="number" min="0" value={score2} onChange={e => setScore2(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 text-center text-xl" data-testid="match-score2" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-match">
                  {loading ? "جاري الحفظ..." : "حفظ المباراة"}
                </button>
                <button type="button" onClick={() => setShowAddMatch(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FootballLeague;

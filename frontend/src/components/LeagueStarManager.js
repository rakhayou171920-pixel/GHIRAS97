import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function LeagueStarManager({ token }) {
  const [stars, setStars] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStars = async () => {
    try {
      const res = await axios.get(`${API}/league-stars`);
      setStars(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStars(); }, []);

  const addStar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/league-star`, { student_name: studentName, reason }, { headers });
      setShowAdd(false);
      setStudentName(""); setReason("");
      setMessage("تم تحديث نجم الدوري");
      await fetchStars();
    } catch (err) {
      setMessage("خطأ في الإضافة");
    } finally { setLoading(false); }
  };

  const deleteStar = async (id) => {
    try {
      await axios.delete(`${API}/league-star/${id}`, { headers });
      await fetchStars();
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  const currentStar = stars[0];

  return (
    <div className="space-y-4">
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-semibold">{message}</div>}

      {/* Current Star */}
      {currentStar ? (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-5 text-center text-white shadow-lg">
          <div className="text-4xl mb-2">&#9733;</div>
          <h3 className="text-sm opacity-80">نجم الدوري الحالي</h3>
          <p className="text-2xl font-bold mt-1">{currentStar.student_name}</p>
          <p className="text-yellow-100 text-sm mt-1">{currentStar.reason}</p>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-xl p-5 text-center text-gray-500">
          لم يتم اختيار نجم الدوري بعد
        </div>
      )}

      <button onClick={() => setShowAdd(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-bold" data-testid="add-star-btn">
        + تعيين نجم جديد
      </button>

      {/* History */}
      {stars.length > 1 && (
        <div className="space-y-2">
          <h4 className="font-bold text-gray-700 text-sm">السجل:</h4>
          {stars.slice(1).map(s => (
            <div key={s.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <span className="font-semibold text-gray-700">{s.student_name}</span>
                <span className="text-gray-400 text-sm mr-2">- {s.reason}</span>
              </div>
              <button onClick={() => deleteStar(s.id)} className="text-red-400 hover:text-red-600 text-sm">&#10005;</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">تعيين نجم الدوري</h3>
            <form onSubmit={addStar} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم الطالب</label>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-amber-500" placeholder="اسم نجم الدوري" required data-testid="star-name" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">السبب</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-amber-500" placeholder="سبب الاختيار" required data-testid="star-reason" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-star">
                  {loading ? "جاري الحفظ..." : "تعيين"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeagueStarManager;

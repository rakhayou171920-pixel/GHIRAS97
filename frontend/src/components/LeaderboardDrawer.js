function LeaderboardDrawer({ students, isOpen, onClose }) {
  // Sort students by points descending
  const sortedStudents = [...students].sort((a, b) => b.points - a.points);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <h2 className="text-2xl font-bold">ترتيب الطلاب</h2>
                <p className="text-yellow-100 text-sm">{sortedStudents.length} طالب</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none p-2"
              data-testid="close-leaderboard"
            >
              ×
            </button>
          </div>
        </div>

        {/* Students List */}
        <div className="overflow-y-auto h-[calc(100%-120px)] p-4">
          {sortedStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-5xl block mb-4">📋</span>
              <p>لا يوجد طلاب بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStudents.map((student, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                
                let bgColor = "bg-white";
                let borderColor = "border-gray-200";
                let rankDisplay = `#${rank}`;
                
                if (rank === 1) {
                  bgColor = "bg-yellow-50";
                  borderColor = "border-yellow-400";
                  rankDisplay = "🥇";
                } else if (rank === 2) {
                  bgColor = "bg-gray-100";
                  borderColor = "border-gray-400";
                  rankDisplay = "🥈";
                } else if (rank === 3) {
                  bgColor = "bg-orange-50";
                  borderColor = "border-orange-400";
                  rankDisplay = "🥉";
                }

                return (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${bgColor} ${borderColor} transition-all hover:shadow-md`}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 text-center">
                      {isTop3 ? (
                        <span className="text-3xl">{rankDisplay}</span>
                      ) : (
                        <span className="text-xl font-bold text-gray-500">{rankDisplay}</span>
                      )}
                    </div>

                    {/* Image */}
                    <div className="flex-shrink-0">
                      {student.image_url ? (
                        <img
                          src={student.image_url}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-400"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                          {student.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="font-bold text-gray-800 truncate">{student.name}</div>
                      {student.supervisor && (
                        <div className="text-xs text-gray-500 truncate">
                          المشرف: {student.supervisor}
                        </div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="flex-shrink-0">
                      <div className={`px-4 py-2 rounded-full font-bold text-white ${
                        isTop3 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-green-500"
                      }`}>
                        {student.points}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-100 p-4 border-t">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sortedStudents.reduce((sum, s) => sum + s.points, 0)}
              </div>
              <div className="text-xs text-gray-500">إجمالي النقاط</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {sortedStudents.length > 0 ? Math.round(sortedStudents.reduce((sum, s) => sum + s.points, 0) / sortedStudents.length) : 0}
              </div>
              <div className="text-xs text-gray-500">متوسط النقاط</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {sortedStudents.length > 0 ? sortedStudents[0]?.points : 0}
              </div>
              <div className="text-xs text-gray-500">أعلى نقاط</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LeaderboardDrawer;

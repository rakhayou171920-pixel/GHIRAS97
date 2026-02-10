import { useEffect, useRef } from "react";

function LeaderboardTicker({ students }) {
  const tickerRef = useRef(null);
  
  // Sort students by points descending
  const sortedStudents = [...students].sort((a, b) => b.points - a.points);
  const top3 = sortedStudents.slice(0, 3);
  const restStudents = sortedStudents.slice(3);

  // Duplicate for seamless loop
  const tickerStudents = [...restStudents, ...restStudents];

  if (students.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-2xl shadow-xl overflow-hidden mb-8" dir="rtl">
      {/* Top 3 Podium in Center */}
      <div className="bg-gradient-to-b from-yellow-600 to-orange-600 py-4 px-6">
        <h3 className="text-center text-white font-bold text-xl mb-4 flex items-center justify-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>المتصدرون</span>
          <span className="text-2xl">🏆</span>
        </h3>
        
        <div className="flex items-end justify-center gap-4">
          {/* Second Place */}
          {top3[1] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform">
              <div className="relative">
                {top3[1].image_url ? (
                  <img
                    src={top3[1].image_url}
                    alt={top3[1].name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-gray-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-2xl font-bold border-4 border-gray-400">
                    {top3[1].name.charAt(0)}
                  </div>
                )}
                <span className="absolute -top-2 -right-2 text-3xl">🥈</span>
              </div>
              <div className="bg-gray-300 text-gray-800 px-3 py-1 rounded-full mt-2 font-bold text-sm">
                {top3[1].points}
              </div>
              <div className="text-white text-sm font-semibold mt-1 max-w-20 truncate text-center">
                {top3[1].name.split(' ')[0]}
              </div>
              <div className="bg-gray-400 w-20 h-16 rounded-t-lg mt-2 flex items-center justify-center text-white font-bold text-2xl">
                2
              </div>
            </div>
          )}

          {/* First Place */}
          {top3[0] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform -mt-4">
              <div className="relative">
                {top3[0].image_url ? (
                  <img
                    src={top3[0].image_url}
                    alt={top3[0].name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 text-3xl font-bold border-4 border-yellow-500">
                    {top3[0].name.charAt(0)}
                  </div>
                )}
                <span className="absolute -top-3 -right-3 text-4xl">🥇</span>
              </div>
              <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full mt-2 font-bold">
                {top3[0].points}
              </div>
              <div className="text-white font-bold mt-1 max-w-24 truncate text-center">
                {top3[0].name.split(' ')[0]}
              </div>
              <div className="bg-yellow-500 w-24 h-20 rounded-t-lg mt-2 flex items-center justify-center text-white font-bold text-3xl">
                1
              </div>
            </div>
          )}

          {/* Third Place */}
          {top3[2] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform">
              <div className="relative">
                {top3[2].image_url ? (
                  <img
                    src={top3[2].image_url}
                    alt={top3[2].name}
                    className="w-14 h-14 rounded-full object-cover border-4 border-orange-400"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-400 flex items-center justify-center text-orange-900 text-xl font-bold border-4 border-orange-500">
                    {top3[2].name.charAt(0)}
                  </div>
                )}
                <span className="absolute -top-2 -right-2 text-2xl">🥉</span>
              </div>
              <div className="bg-orange-400 text-orange-900 px-3 py-1 rounded-full mt-2 font-bold text-sm">
                {top3[2].points}
              </div>
              <div className="text-white text-sm font-semibold mt-1 max-w-20 truncate text-center">
                {top3[2].name.split(' ')[0]}
              </div>
              <div className="bg-orange-500 w-20 h-12 rounded-t-lg mt-2 flex items-center justify-center text-white font-bold text-2xl">
                3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrolling Ticker */}
      {restStudents.length > 0 && (
        <div className="bg-white/10 backdrop-blur py-3 overflow-hidden">
          <div 
            ref={tickerRef}
            className="flex gap-6 animate-marquee whitespace-nowrap"
            style={{
              animation: `marquee ${Math.max(restStudents.length * 3, 20)}s linear infinite`
            }}
          >
            {tickerStudents.map((student, index) => (
              <div 
                key={`${student.id}-${index}`}
                className="flex items-center gap-3 bg-white/20 rounded-full px-4 py-2 flex-shrink-0"
              >
                <span className="text-white font-bold text-sm">#{sortedStudents.indexOf(student) + 1}</span>
                {student.image_url ? (
                  <img
                    src={student.image_url}
                    alt={student.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-sm">
                    {student.name.charAt(0)}
                  </div>
                )}
                <span className="text-white font-semibold">{student.name.split(' ').slice(0, 2).join(' ')}</span>
                <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full font-bold text-sm">
                  {student.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS for marquee animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(50%);
          }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default LeaderboardTicker;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentProfilePublic from "@/components/StudentProfilePublic";
import ChallengesManager from "@/components/ChallengesManager";
import Dashboard from "@/components/DashboardNew";
import "@/App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/public/:studentId" element={<StudentProfilePublic />} />
          <Route path="/challenges" element={<ChallengesManager />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

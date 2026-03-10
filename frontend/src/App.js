import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Dashboard from "./components/DashboardNew";
import StudentProfilePublic from "./components/StudentProfilePublic";
import ChallengesManager from "./components/ChallengesManager";
import ViewerPage from "./components/ViewerPage";
import LoginPage from "./components/LoginPage";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("ghiras_token"));

  const isAuthed = useMemo(() => Boolean(token), [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={(t) => setToken(t)} />} />
        <Route path="/" element={isAuthed ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/public/:studentId" element={<StudentProfilePublic />} />
        <Route path="/challenges" element={isAuthed ? <ChallengesManager /> : <Navigate to="/login" replace />} />
        <Route path="/view/:viewerToken" element={<ViewerRoute />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function ViewerRoute() {
  const viewerToken = window.location.pathname.split("/view/")[1];
  return <ViewerPage token={viewerToken} />;
}

export default App;

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Dashboard from "./components/DashboardNew";
import StudentProfilePublic from "./components/StudentProfilePublic";
import ChallengesManager from "./components/ChallengesManager";
import LoginPage from "./components/LoginPage";
import ViewerPage from "./components/ViewerPage";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function App() {
  const [token, setToken] = useState(localStorage.getItem("ghiras_token"));
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!token) { setChecking(false); return; }
      try {
        await axios.get(`${API}/auth/verify`, { headers: { Authorization: `Bearer ${token}` } });
        setIsAuth(true);
      } catch {
        localStorage.removeItem("ghiras_token");
        setToken(null);
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    setIsAuth(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("ghiras_token");
    setToken(null);
    setIsAuth(false);
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl text-gray-500">جاري التحميل...</div></div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/public/:studentId" element={<StudentProfilePublic />} />
        <Route path="/view/:viewerToken" element={<ViewerRoute />} />

        {/* Auth routes */}
        <Route path="/login" element={isAuth ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />

        {/* Protected routes */}
        <Route path="/" element={isAuth ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/challenges" element={isAuth ? <ChallengesManager token={token} /> : <Navigate to="/login" />} />

        {/* Catch all */}
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

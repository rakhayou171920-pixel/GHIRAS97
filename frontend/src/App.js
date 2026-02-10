import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentProfilePublic from "@/components/StudentProfilePublic";
import ChallengesManager from "@/components/ChallengesManager";
import Dashboard from "@/components/DashboardNew";
import LoginPage from "@/components/LoginPage";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("ghiras_token");
      const expiry = localStorage.getItem("ghiras_token_expiry");

      if (!token || !expiry || Date.now() > parseInt(expiry)) {
        // Token doesn't exist or expired
        localStorage.removeItem("ghiras_token");
        localStorage.removeItem("ghiras_token_expiry");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verify token with backend
      try {
        const response = await fetch(`${API}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("ghiras_token");
          localStorage.removeItem("ghiras_token_expiry");
          setIsAuthenticated(false);
        }
      } catch {
        // Network error - assume valid if not expired
        setIsAuthenticated(true);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("ghiras_token");
    localStorage.removeItem("ghiras_token_expiry");
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/public/:studentId" element={<StudentProfilePublic />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/challenges"
            element={
              isAuthenticated ? (
                <ChallengesManager onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

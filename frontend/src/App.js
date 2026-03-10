import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardNew from "./components/DashboardNew";
import StudentProfilePublic from "./components/StudentProfilePublic";
import ViewerPage from "./components/ViewerPage";
import ChallengesManager from "./components/ChallengesManager";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardNew />} />
        <Route path="/public/:studentId" element={<StudentProfilePublic />} />
        <Route path="/view/:viewerToken" element={<ViewerPage />} />
        <Route path="/challenges" element={<ChallengesManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import PPTGenerator from "./pages/PPTGenerator";
import { StrictMode } from "react";

function App() {
  return (
    <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/ppt" element={<PPTGenerator />} />
      </Routes>
    </Router>
    </StrictMode>
  );
}

export default App;

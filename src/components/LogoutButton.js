import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config/api";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get(`${BASE_URL}/api/auth/logout`);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <button
        onClick={() => navigate('/ppt')}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Create PPT
      </button>
      <button
        onClick={handleLogout}
        className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Logout
      </button>
    </div>
  );
};

export default LogoutButton;

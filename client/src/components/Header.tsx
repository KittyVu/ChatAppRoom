// Header.tsx
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface HeaderProps {
  username: string | null;
  onLogout: () => void;
}

export default function Header({ username, onLogout }: HeaderProps) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axios.post("http://localhost:5000/api/logout", { withCredentials: true });
      onLogout(); 
      navigate("/login");
    } catch {
      alert("Logout failed");
    }
  };

  return (
    <div className="header">
      <p>Welcome, {username}</p>
      <button onClick={logout} className="logout-btn">Logout</button>
    </div>
  );
}

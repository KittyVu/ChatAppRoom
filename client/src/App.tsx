import { useEffect, useState } from "react";
import axios from "axios";
import Login from "./components/Login";
import Header from "./components/Header";
import Room from "./components/Room";
import Chat from "./components/Chat";
import "./App.css";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/check-auth", {
          withCredentials: true,
        });
        setAuthenticated(!!res.data.authenticated);
        setUser(res.data.user);
      } catch {
        setAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (!authenticated) return <Login />;

  return (
    <div className="homepage">
      <Header username={user?.username || ""} onLogout={() => setAuthenticated(false)} />
      <div className="room-chat">
        <Room onSelectRoom={setSelectedRoom} />
        {selectedRoom && <Chat room={selectedRoom} />}
      </div>
    </div>
  );
}

export default App;

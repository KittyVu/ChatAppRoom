import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface RoomType {
    id: number;
    roomname: string;
}

interface RoomProps {
    onSelectRoom: (roomId: number) => void;
}

export default function Room({ onSelectRoom }: RoomProps) {
    const [auth, setAuth] = useState<{ id: number; username: string } | null>(null);
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [newroom, setNewroom] = useState("");
    const navigate = useNavigate();

     useEffect(() => {
        axios.get("http://localhost:5000/api/check-auth", { withCredentials: true })
            .then(res => setAuth(res.data.authenticated))   
            .catch(() => navigate("/login"));      
    }, [navigate]);

    useEffect(() => {
        if (!auth) return;

        // Fetch all rooms
        axios.get("http://localhost:5000/api/rooms", { withCredentials: true }).then((res) => {
            setRooms(res.data);
        });
    }, [auth]);

    if (!auth) return <div>Loading...</div>;

    const createNewRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newroom.trim()) return;

        try {
            const res = await axios.post("http://localhost:5000/api/rooms", { roomname: newroom }, { withCredentials: true });

            // Add the new room to the list and select it
            setRooms((prev) => [...prev, res.data]);
            onSelectRoom(res.data.id);
            setNewroom("");
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        }
    }

    return (
        <div className='room'>
            <h1>Channels</h1>
            <ul className="room-list">
                {rooms.map((r) => (
                    <li
                        className="room-element"
                        key={r.id}
                        onClick={() => onSelectRoom(r.id)}
                    >
                        {r.roomname}
                    </li>
                ))}
            </ul>

            <form onSubmit={createNewRoom} className="newroom-form">
                <input
                    className="input-newroom"
                    type="text"
                    name="roomname"
                    value={newroom}
                    onChange={(e) => setNewroom(e.target.value)}
                    placeholder="New room name"
                />
                <button className="create-btn" type="submit">Create</button>
            </form>
        </div>
    )
}

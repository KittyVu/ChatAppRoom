import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface MessageType {
    id: number;
    content: string;
    senderId: number;
    senderUsername: string;
    createdAt: string;
    roomId: string;
}

interface ChatProps {
    room: number;
}

let socket: Socket;

export default function Chat({ room }: ChatProps) {
    const [user, setUser] = useState<{ id: number; username: string } | null>(null);
    const username = user?.username;
    const userId = user?.id;
    const [roomName, setRoomName] = useState("");
    const navigate = useNavigate();
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // check Authentication
    useEffect(() => {
        axios.get("http://localhost:5000/api/check-auth", { withCredentials: true })
            .then(res => setUser(res.data.user))
            .catch(() => navigate("/login"));
    }, [navigate]);

    // Initialize socket
    useEffect(() => {
        if (!user) return;

        if (!socket) {
            socket = io("http://localhost:5000", {
                withCredentials: true,
            });
        }
        
        socket.emit("joinRoom", room);

        const handleNewMessage = (msg: MessageType) => {
            if (Number(msg.roomId) === room) setMessages((prev) => [...prev, msg]);

        };

        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.emit("leaveRoom", room);
            socket.off("newMessage", handleNewMessage);
        };
    }, [user, room, userId]);

    // fetch chat history  
    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            const res = await axios.get(`http://localhost:5000/api/messages/${room}`, { withCredentials: true });
            setMessages(res.data.msgs);
            setRoomName(res.data.roomName)
        };
        fetchHistory();
    }, [user, room]);

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // Send message
    const sendMessage = async () => {
        if (!input.trim() || !userId || !username) return;
        console.log(room)
        try {
            await axios.post("http://localhost:5000/api/messages", {
                content: input,
                senderId: Number(userId),
                senderUsername: username,
                roomId: Number(room)
            }, { withCredentials: true });
            setInput("");
        } catch (err: any) {
            alert(err.response?.data?.error || "Message rejected");
        }
    };

    return (
        <div className="chat">
            <h2>Room: {roomName}</h2>
            <div ref={scrollRef} className="messages">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`message-row ${m.senderId === Number(userId) ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`message-bubble ${m.senderId === Number(userId) ? "sent" : "received"}`}>
                            <div className="message-username">{m.senderUsername}</div>
                            <div className="message-content">{m.content}</div>
                            <div className="message-time">{new Date(m.createdAt).toLocaleTimeString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="input-container">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>

    );
}

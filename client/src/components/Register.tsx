import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/register", { username, password });
        
            alert("Account created. Please login.");
            navigate("/login");
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        }
    };

    return (
        <div className="login">
            <form onSubmit={submit} className="login-form">
                <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" required />
                <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
                <button className="login-btn">Register</button>
            </form>
            <p>Already have an account? <span onClick={() => navigate("/login")} className="letter">Login</span></p>
        </div>
    )
}

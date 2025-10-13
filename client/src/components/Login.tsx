import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/api/login",
        { username, password },
        { withCredentials: true }
      );
      navigate("/");
    } catch (err: any) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login"> 
      <form onSubmit={submit} className="login-form"> 
        <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" required /> 
        <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required /> 
        <button type="submit" className="login-btn"> Login </button> 
      </form> <p> Don't have an account?{" "} <span onClick={() => navigate("/register")} className="letter"> Register here </span> </p> 
    </div>
  );
}


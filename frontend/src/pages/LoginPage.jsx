import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    // stop the browser from doing a full page reload on submit
    e.preventDefault();
    // clear any error from a previous attempt
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    // show the server's error message instead of logging in
    if (!res.ok) {
      setError(data.error);
      return;
    }

    // tell App.jsx who's logged in now
    // this will update the nav bar and allow access to protected routes
    onLogin(data); // data is the user object returned from the server

    // navigate the user to the dashboard after successful login
    navigate("/");
  }

  return (
    <div className="login-page">
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Log in</button>
      </form>
    </div>
  );
}

// describes the shape of the props this component expects
LoginPage.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default LoginPage;

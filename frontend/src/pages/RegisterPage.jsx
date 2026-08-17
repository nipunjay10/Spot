import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import styles from "./RegisterPage.module.css";

function RegisterPage({ onRegister }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    // stop the browser from doing a full page reload on submit
    e.preventDefault();
    // clear any error from a previous attempt
    setError("");

    // check the password length before hitting the server
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, displayName }),
    });

    const data = await res.json();

    // show the server's error message (e.g. username/email already taken)
    if (!res.ok) {
      setError(data.error);
      return;
    }

    // server auto-logs-in on register, so tell App.jsx who's logged in now
    onRegister(data);
    // send the user to the home page
    navigate("/");
  }

  return (
    <div className={styles.registerPage}>
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          {/*  You don't do any trimming/cleaning it appears, so 'username' and 'username ' can both exist? */}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* always rendered so a screen reader announces the message when it appears */}
        <p className={styles.registerError} role="alert" aria-live="polite">
          {error}
        </p>

        <button type="submit" className="btnApprove">
          Register
        </button>
      </form>
    </div>
  );
}

// describes the shape of the props this component expects
RegisterPage.propTypes = {
  onRegister: PropTypes.func.isRequired,
};

export default RegisterPage;

import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";

function NavBar({ currentUser, loading, onLogout }) {
  const navigate = useNavigate();

  async function handleLogoutClick() {
    // run the parent's logout logic (clears currentUser in App)
    await onLogout();
    // send the user back to the login page
    navigate("/login");
  }

  // while we're still checking for a logged-in session, show nothing yet
  if (loading) {
    return null;
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Spot
      </Link>

      <div className="navbar-links">
        {currentUser ? (
          <>
            <Link to="/">Dashboard</Link>
            <Link to="/search">Find a Partner</Link>
            <Link to="/profile">Profile</Link>
            <button type="button" onClick={handleLogoutClick}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;

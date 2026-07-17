import PropTypes from "prop-types";
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
            {/* greet with the friendly name, plus the login handle */}
            <span className="navbar-user">
              Hi, {currentUser.displayName} (@{currentUser.username})
            </span>
            <span className="navbar-separator">|</span>
            <Link to="/profile">Profile</Link>
            <Link to="/">Dashboard</Link>
            <Link to="/search">Find a Partner</Link>
            <Link to="/log">Log Workout</Link>
            <Link to="/history">History</Link>
            <Link to="/challenges">Challenges</Link>
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

// currentUser is null when nobody is logged in, so it isn't required
NavBar.propTypes = {
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    displayName: PropTypes.string,
  }),
  loading: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default NavBar;

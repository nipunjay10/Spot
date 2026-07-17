/**
 * Layout Component
 *
 * Main layout wrapper component that provides the application structure.
 * Displays the navigation bar and renders the current route's component
 * through the Outlet placeholder.
 */

import PropTypes from "prop-types";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import "./Layout.css";

function Layout({ currentUser, loading, onLogout }) {
  return (
    <div className="layout">
      <NavBar currentUser={currentUser} loading={loading} onLogout={onLogout} />
      <main className="layout-content">
        {/* Outlet is a placeholder for the rendered route component. */}
        <Outlet />
      </main>
    </div>
  );
}

// currentUser is null when nobody is logged in, so it isn't required
Layout.propTypes = {
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    displayName: PropTypes.string,
  }),
  loading: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Layout;

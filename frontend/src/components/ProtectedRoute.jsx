import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

/*
 * ProtectedRoute component that guards routes based on user authentication status.
 * Prevents unauthorized access by redirecting unauthenticated users to the login page.
 */

function ProtectedRoute({ currentUser, loading, children }) {
  // still checking /api/auth/me — don't redirect yet, just show nothing
  if (loading) {
    return null;
  }

  // no logged-in user — send them to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // logged in — render the actual page
  return children;
}

// currentUser is null when nobody is logged in, so it isn't required
ProtectedRoute.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
  }),
  loading: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;

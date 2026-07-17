import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import ProfileForm from "../components/ProfileForm";
import "./ProfilePage.css";

function ProfilePage({ currentUser, onUserChange }) {
  const navigate = useNavigate();

  async function handleDeleteAccount() {
    // ask for confirmation since deleting an account can't be undone
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone.",
    );
    if (!confirmed) return;

    await fetch(`/api/users/${currentUser._id}`, { method: "DELETE" });
    // clear the app-wide user, then move to the login page
    onUserChange(null);
    navigate("/login");
  }

  // safety check in case this renders while the user is being cleared
  if (!currentUser) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <ProfileForm user={currentUser} onSave={onUserChange} />

      <button
        type="button"
        className="delete-account-button"
        onClick={handleDeleteAccount}
      >
        Delete account
      </button>
    </div>
  );
}

// currentUser is null for a moment while the account is being cleared
ProfilePage.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }),
  onUserChange: PropTypes.func.isRequired,
};

export default ProfilePage;

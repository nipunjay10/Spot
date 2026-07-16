import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileForm from "../components/ProfileForm";
import "./ProfilePage.css";

function ProfilePage({ onAccountDeleted }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // load the logged-in user's own profile when the page mounts
  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    }

    loadUser();
  }, []);

  async function handleDeleteAccount() {
    // ask for confirmation since deleting an account can't be undone
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone.",
    );
    if (!confirmed) return;

    await fetch(`/api/users/${user._id}`, { method: "DELETE" });
    // tell App.jsx to clear currentUser, then move to the login page
    onAccountDeleted();
    navigate("/login");
  }

  // still waiting on the initial fetch
  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <ProfileForm user={user} onSave={setUser} />

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

export default ProfilePage;

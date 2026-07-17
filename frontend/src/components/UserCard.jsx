import PropTypes from "prop-types";
import { memberSince } from "../lib/formatDate";
import "./UserCard.css";

function UserCard({ user, onPropose }) {
  return (
    <div className="user-card">
      <h2>{user.displayName}</h2>
      <p className="user-card-username">@{user.username}</p>

      {/* bio, gym and join date are all optional, so only show what's filled in */}
      {user.bio && (
        <p className="user-card-bio">
          <b>Bio:</b> {user.bio}
        </p>
      )}
      {user.favoriteGym && (
        <p>
          {" "}
          <b>Favorite Gym</b> {user.favoriteGym}
        </p>
      )}
      {user.createdAt && (
        <p className="user-card-since">
          Member since {memberSince(user.createdAt)}
        </p>
      )}

      <button type="button" onClick={() => onPropose(user)}>
        Propose pact
      </button>
    </div>
  );
}

// describes the shape of the props this component expects
UserCard.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    bio: PropTypes.string,
    favoriteGym: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onPropose: PropTypes.func.isRequired,
};

export default UserCard;

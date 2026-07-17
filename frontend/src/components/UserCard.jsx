import PropTypes from "prop-types";
import "./UserCard.css";

function UserCard({ user, onPropose }) {
  return (
    <div className="user-card">
      <h2>{user.displayName}</h2>
      <p>@{user.username}</p>
      {user.favoriteGym && <p>Gym: {user.favoriteGym}</p>}

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
    favoriteGym: PropTypes.string,
  }).isRequired,
  onPropose: PropTypes.func.isRequired,
};

export default UserCard;

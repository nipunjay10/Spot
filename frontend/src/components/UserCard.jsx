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

export default UserCard;

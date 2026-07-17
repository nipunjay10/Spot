import { useState } from "react";
import PropTypes from "prop-types";
import "./ChallengeCard.css";

// today as YYYY-MM-DD, built from local parts so the date can't slip a day
function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ChallengeCard({ challenge, currentUser, onChanged }) {
  // proof-entry form state (only used when the challenge is accepted)
  const [proofDate, setProofDate] = useState(todayString);
  const [completed, setCompleted] = useState(false);
  const [proofNotes, setProofNotes] = useState("");
  const [error, setError] = useState("");

  // the creator can delete their own challenge, but can't accept it
  const isCreator = challenge.creatorId === currentUser._id;
  const isAccepter = challenge.accepterId === currentUser._id;
  // plenty of challenges are between two other people, so only claim a role we actually have
  const showRole = challenge.status !== "open" && (isCreator || isAccepter);

  // pull the server's message off a failed response so the user sees why
  async function readError(res, fallback) {
    const data = await res.json().catch(() => ({}));
    return data.error || fallback;
  }

  async function handleAccept() {
    setError("");
    // no accepterId — the server reads it from the session
    const res = await fetch(`/api/challenges/${challenge._id}/accept`, {
      method: "PUT",
    });
    if (!res.ok) {
      setError(await readError(res, "Could not accept challenge"));
      return;
    }
    onChanged();
  }

  async function handleLogProof(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/challenges/${challenge._id}/proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: proofDate,
        completed,
        notes: proofNotes,
      }),
    });
    if (!res.ok) {
      setError(await readError(res, "Could not log proof"));
      return;
    }
    // back to a fresh entry for today
    setProofDate(todayString());
    setProofNotes("");
    setCompleted(false);
    onChanged();
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this challenge?");
    if (!confirmed) return;
    setError("");
    const res = await fetch(`/api/challenges/${challenge._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(await readError(res, "Could not delete challenge"));
      return;
    }
    onChanged();
  }

  return (
    <div className="challenge-card">
      <div className="challenge-card-header">
        <strong>{challenge.description}</strong>
        {showRole && (
          <span className="challenge-role">
            {isCreator ? "Posted by you" : "You accepted"}
          </span>
        )}
        <span className={`challenge-status status-${challenge.status}`}>
          {challenge.status}
        </span>
      </div>

      <p className="challenge-window">
        {challenge.startDate} → {challenge.endDate}
      </p>

      {/* OPEN: anyone but the creator can accept */}
      {challenge.status === "open" && !isCreator && (
        <button type="button" onClick={handleAccept}>
          Accept challenge
        </button>
      )}
      {challenge.status === "open" && isCreator && (
        <p className="challenge-note">Waiting for someone to accept</p>
      )}

      {/* ACCEPTED: only the accepter logs proof */}
      {challenge.status === "accepted" && isAccepter && (
        <form className="proof-form" onSubmit={handleLogProof}>
          <label htmlFor={`proofDate-${challenge._id}`}>Log a day</label>
          <input
            id={`proofDate-${challenge._id}`}
            type="date"
            value={proofDate}
            onChange={(e) => setProofDate(e.target.value)}
            required
          />
          <label className="proof-completed">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
            />
            Completed today
          </label>
          <input
            type="text"
            placeholder="notes (optional)"
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
          />
          <button type="submit">Log proof</button>
        </form>
      )}
      {/* the creator waits — only the accepter can log proof */}
      {challenge.status === "accepted" && isCreator && (
        <p className="challenge-note">Waiting on your partner to log proof</p>
      )}

      {/* show proof entries if any exist */}
      {challenge.proofEntries.length > 0 && (
        <ul className="proof-list">
          {challenge.proofEntries.map((entry, i) => (
            <li key={i}>
              {entry.date}: {entry.completed ? "✓" : "✗"}
              {entry.notes && ` — ${entry.notes}`}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="challenge-card-error">{error}</p>}

      {/* only the creator deletes, and only while nobody has accepted yet */}
      {isCreator && challenge.status === "open" && (
        <button
          type="button"
          className="challenge-delete"
          onClick={handleDelete}
        >
          Delete
        </button>
      )}
    </div>
  );
}

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    creatorId: PropTypes.string.isRequired,
    accepterId: PropTypes.string,
    description: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    proofEntries: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
        completed: PropTypes.bool,
        notes: PropTypes.string,
      }),
    ).isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default ChallengeCard;

import { useState } from "react";
import PropTypes from "prop-types";
import "./ChallengeCard.css";

function ChallengeCard({ challenge, onChanged }) {
  // proof-entry form state (only used when the challenge is accepted)
  const [proofDate, setProofDate] = useState(() => {
    // default to today
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [completed, setCompleted] = useState(false);
  const [proofNotes, setProofNotes] = useState("");

  async function handleAccept() {
    // no accepterId — the server reads it from the session
    await fetch(`/api/challenges/${challenge._id}/accept`, { method: "PUT" });
    onChanged();
  }

  async function handleLogProof(e) {
    e.preventDefault();
    await fetch(`/api/challenges/${challenge._id}/proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: proofDate,
        completed,
        notes: proofNotes,
      }),
    });
    setProofDate("");
    setProofNotes("");
    setCompleted(true);
    onChanged();
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this challenge?");
    if (!confirmed) return;
    await fetch(`/api/challenges/${challenge._id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="challenge-card">
      <div className="challenge-card-header">
        <strong>{challenge.description}</strong>
        <span className={`challenge-status status-${challenge.status}`}>
          {challenge.status}
        </span>
      </div>

      <p className="challenge-window">
        {challenge.startDate} → {challenge.endDate}
      </p>

      {/* OPEN: can accept */}
      {challenge.status === "open" && (
        <button type="button" onClick={handleAccept}>
          Accept challenge
        </button>
      )}

      {/* ACCEPTED: can log proof */}
      {challenge.status === "accepted" && (
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

      <button type="button" className="challenge-delete" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
}

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    _id: PropTypes.string.isRequired,
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
  onChanged: PropTypes.func.isRequired,
};

export default ChallengeCard;

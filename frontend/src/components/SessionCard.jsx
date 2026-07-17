import { useState } from "react";
import PropTypes from "prop-types";
import "./SessionCard.css";

function SessionCard({ session, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(session.notes);
  const [error, setError] = useState("");

  // pull the server's message off a failed response so the user sees why
  async function readError(res, fallback) {
    const data = await res.json().catch(() => ({}));
    return data.error || fallback;
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this session?");
    if (!confirmed) return;
    setError("");
    const res = await fetch(`/api/sessions/${session._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(await readError(res, "Could not delete session"));
      return;
    }
    onChanged(); // tell the page to re-fetch
  }

  async function handleSaveEdit() {
    setError("");
    // keep the same date + exercises, just update notes (simple edit for now)
    const res = await fetch(`/api/sessions/${session._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: session.date,
        exercises: session.exercises,
        notes,
      }),
    });
    if (!res.ok) {
      setError(await readError(res, "Could not save changes"));
      return;
    }
    setEditing(false);
    onChanged();
  }

  // drop any typing that wasn't saved
  function handleCancel() {
    setNotes(session.notes);
    setError("");
    setEditing(false);
  }

  return (
    <div className="session-card">
      <div className="session-card-header">
        <strong>{session.date}</strong>
        <div className="session-card-actions">
          {editing ? (
            <>
              <button type="button" onClick={handleSaveEdit}>
                Save
              </button>
              <button type="button" onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button type="button" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <ul className="session-card-exercises">
        {session.exercises.map((ex, i) => (
          <li key={i} className={ex.isPR ? "pr-hit" : ""}>
            {ex.name}: {ex.sets}×{ex.reps} @ {ex.weight} lbs
            {ex.isPR && <span className="pr-badge">PR</span>}
          </li>
        ))}
      </ul>

      {editing ? (
        <textarea
          className="session-card-notes-edit"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      ) : (
        session.notes && <p className="session-card-notes">{session.notes}</p>
      )}

      {error && <p className="session-card-error">{error}</p>}
    </div>
  );
}

SessionCard.propTypes = {
  session: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    exercises: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sets: PropTypes.number,
        reps: PropTypes.number,
        weight: PropTypes.number,
        isPR: PropTypes.bool,
      }),
    ).isRequired,
    notes: PropTypes.string,
  }).isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default SessionCard;

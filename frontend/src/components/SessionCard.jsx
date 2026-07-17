import { useState } from "react";
import PropTypes from "prop-types";
import "./SessionCard.css";

function SessionCard({ session, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(session.notes);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this session?");
    if (!confirmed) return;
    await fetch(`/api/sessions/${session._id}`, { method: "DELETE" });
    onChanged(); // tell the page to re-fetch
  }

  async function handleSaveEdit() {
    // keep the same date + exercises, just update notes (simple edit for now)
    await fetch(`/api/sessions/${session._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: session.date,
        exercises: session.exercises,
        notes,
      }),
    });
    setEditing(false);
    onChanged();
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
              <button type="button" onClick={() => setEditing(false)}>
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

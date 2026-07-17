import { useState } from "react";
import PropTypes from "prop-types";
import "./SessionCard.css";

// one blank exercise row — the shape "Add exercise" appends
const blankExercise = { name: "", sets: "", reps: "", weight: "" };

function SessionCard({ session, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(session.notes);
  // exercises are edited in their own state, seeded from the saved session
  const [exercises, setExercises] = useState(session.exercises);
  const [error, setError] = useState("");

  // pull the server's message off a failed response so the user sees why
  async function readError(res, fallback) {
    const data = await res.json().catch(() => ({}));
    return data.error || fallback;
  }

  // update one field of one exercise row
  function updateExercise(index, field, value) {
    setExercises(
      exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    );
  }

  function addRow() {
    setExercises([...exercises, { ...blankExercise }]);
  }

  function removeRow(index) {
    setExercises(exercises.filter((_, i) => i !== index));
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
    // convert the string inputs to numbers before sending, like the log form
    const cleaned = exercises.map((ex) => ({
      name: ex.name,
      sets: Number(ex.sets),
      reps: Number(ex.reps),
      weight: Number(ex.weight),
    }));
    // date stays the same — only exercises and notes are editable here
    const res = await fetch(`/api/sessions/${session._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: session.date,
        exercises: cleaned,
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
    setExercises(session.exercises);
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

      {editing ? (
        <fieldset className="exercise-fieldset">
          <legend>Exercises</legend>
          {exercises.map((ex, index) => (
            <div className="exercise-row" key={index}>
              <input
                type="text"
                placeholder="Exercise"
                value={ex.name}
                onChange={(e) => updateExercise(index, "name", e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Sets"
                value={ex.sets}
                onChange={(e) => updateExercise(index, "sets", e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Reps"
                value={ex.reps}
                onChange={(e) => updateExercise(index, "reps", e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Weight"
                value={ex.weight}
                onChange={(e) =>
                  updateExercise(index, "weight", e.target.value)
                }
                required
              />
              {exercises.length > 1 && (
                <button
                  type="button"
                  className="remove-row"
                  onClick={() => removeRow(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-row" onClick={addRow}>
            Add exercise
          </button>
        </fieldset>
      ) : (
        <ul className="session-card-exercises">
          {session.exercises.map((ex, i) => (
            <li key={i} className={ex.isPR ? "pr-hit" : ""}>
              {ex.name}: {ex.sets}×{ex.reps} @ {ex.weight} lbs
              {ex.isPR && <span className="pr-badge">PR</span>}
            </li>
          ))}
        </ul>
      )}

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

import { useState } from "react";
import PropTypes from "prop-types";
import "./SessionForm.css";

// one blank exercise row — the starting shape and what "add" appends
const blankExercise = { name: "", sets: "", reps: "", weight: "" };

function SessionForm({ onLogged }) {
  const [date, setDate] = useState("");
  const [exercises, setExercises] = useState([{ ...blankExercise }]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // convert the string inputs to numbers before sending
    const cleaned = exercises.map((ex) => ({
      name: ex.name,
      sets: Number(ex.sets),
      reps: Number(ex.reps),
      weight: Number(ex.weight),
    }));

    // note: no userId — the server reads it from the session
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, exercises: cleaned, notes }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not log workout");
      return;
    }

    onLogged(data); // hand the saved session (with isPR flags) up to the page
    // reset the form
    setDate("");
    setExercises([{ ...blankExercise }]);
    setNotes("");
  }

  return (
    <form className="session-form" onSubmit={handleSubmit}>
      <label htmlFor="date">Date</label>
      <input
        id="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

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
              onChange={(e) => updateExercise(index, "weight", e.target.value)}
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
      </fieldset>

      <button type="button" className="add-row" onClick={addRow}>
        Add exercise
      </button>

      <label htmlFor="notes">Notes</label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="optional"
      />

      {error && <p className="session-form-error">{error}</p>}

      <button type="submit">Log workout</button>
    </form>
  );
}

SessionForm.propTypes = {
  onLogged: PropTypes.func.isRequired,
};

export default SessionForm;

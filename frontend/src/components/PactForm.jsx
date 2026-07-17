import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./PactForm.css";

function PactForm({ partner, onCancel }) {
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    // stop the browser from doing a full page reload on submit
    e.preventDefault();
    // clear any error from a previous attempt
    setError("");

    const res = await fetch("/api/pacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: partner._id,
        weeklyTarget: Number(weeklyTarget),
      }),
    });

    // show the server's error message (e.g. a pact already exists) instead of navigating
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    // pact created — go see it on the dashboard
    navigate("/");
  }

  return (
    <div className="pact-form">
      <h2>Propose a pact with {partner.displayName}</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="weeklyTarget">Weekly target (workouts per week)</label>
        <select
          id="weeklyTarget"
          name="weeklyTarget"
          value={weeklyTarget}
          onChange={(e) => setWeeklyTarget(e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        {error && <p className="pact-form-error">{error}</p>}

        <div className="pact-form-actions">
          <button type="submit">Create pact</button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// describes the shape of the props this component expects
PactForm.propTypes = {
  partner: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default PactForm;

import { useState } from "react";
import SessionForm from "../components/SessionForm";
import "./LogWorkoutPage.css";

function LogWorkoutPage() {
  // holds the session that was just logged, so we can show PR results
  const [lastLogged, setLastLogged] = useState(null);

  return (
    <div className="log-workout-page">
      <h1>Log a Workout</h1>

      <SessionForm onLogged={setLastLogged} />

      {lastLogged && (
        <div className="log-result">
          <h2>Logged — {lastLogged.date}</h2>
          <ul>
            {lastLogged.exercises.map((ex, i) => (
              <li key={i} className={ex.isPR ? "pr-hit" : ""}>
                {ex.name}: {ex.sets}×{ex.reps} @ {ex.weight} lbs
                {ex.isPR && <span className="pr-badge">New PR</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LogWorkoutPage;
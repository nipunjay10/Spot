import PropTypes from "prop-types";
import "./PRList.css";

/*
  PRList shows a "records board" derived from the user's sessions: one row per
  exercise, showing the heaviest weight ever flagged as a PR and the date it was
  first hit. It reuses the History page's exercise search box — an empty filter
  shows every record, and typing narrows by exercise name (same substring match
  the session list uses).
*/

// build one best-PR row per exercise name from every PR-flagged set in history
function bestPRsByExercise(sessions) {
  const bestByName = {};
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (!ex.isPR) continue;
      const current = bestByName[ex.name];
      // keep the heaviest; on a tie, keep the earliest date it was hit
      if (
        !current ||
        ex.weight > current.weight ||
        (ex.weight === current.weight && session.date < current.date)
      ) {
        bestByName[ex.name] = {
          name: ex.name,
          weight: ex.weight,
          date: session.date,
        };
      }
    }
  }
  // heaviest records first
  return Object.values(bestByName).sort((a, b) => b.weight - a.weight);
}

function PRList({ sessions, exerciseFilter }) {
  const records = bestPRsByExercise(sessions).filter(
    (pr) =>
      exerciseFilter === "" ||
      pr.name.toLowerCase().includes(exerciseFilter.toLowerCase()),
  );

  return (
    <section className="pr-list">
      <h2 className="pr-list-title">🏆 Personal Records</h2>
      {records.length === 0 ? (
        <p className="pr-list-empty">
          {exerciseFilter === ""
            ? "No personal records yet. Log a heavier lift to set one."
            : "No personal records match."}
        </p>
      ) : (
        <ul className="pr-list-items">
          {records.map((pr) => (
            <li key={pr.name} className="pr-row">
              <span className="pr-name">{pr.name}</span>
              <span className="pr-weight">{pr.weight} lbs</span>
              <span className="pr-date">{pr.date}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

PRList.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      exercises: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          weight: PropTypes.number,
          isPR: PropTypes.bool,
        }),
      ).isRequired,
    }),
  ).isRequired,
  exerciseFilter: PropTypes.string.isRequired,
};

export default PRList;

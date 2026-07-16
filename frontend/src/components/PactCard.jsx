import { Link } from "react-router-dom";
import "./PactCard.css";

/*
  PactCard displays a single pact summary card for the dashboard.
  It shows the partner name, the weekly target for the pact, and the current streak.

  weeklyTarget is the number of agreed check-ins or goals the pact partner must hit each week.
  currentStreak is how many consecutive weeks the pact has met that weekly target.
*/

function PactCard({ pact, onReload }) {
  // ask the server to re-check this pact's streak for the current week
  async function handleCheckWeek() {
    // send request to server to evaluate the current week's streak
    await fetch(`/api/pacts/${pact._id}/evaluate`, { method: "POST" });
    // tell the dashboard to refetch pacts so the streak shown is up to date
    onReload();
  }

  return (
    <div className="pact-card">
      <h2>{pact.partner.displayName}</h2>
      <p>
        Weekly target (# of gym sessions) : <b>{pact.weeklyTarget}</b>
      </p>
      <p>
        Current streak(# of consecutive weeks hit target) :{" "}
        <b>{pact.currentStreak}</b>
      </p>

      <div className="pact-card-actions">
        <button type="button" onClick={handleCheckWeek}>
          Check this week
        </button>
        <Link to={`/pacts/${pact._id}`}>View details</Link>
      </div>
    </div>
  );
}

export default PactCard;

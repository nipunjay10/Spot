import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./PactCard.css";

/*
  PactCard displays a single pact summary card for the dashboard.

  A pact can be in one of three states from your point of view:
    - active: both partners agreed, so the streak and this week's progress show.
    - pending and proposed by you: waiting on the other person, with a Delete
      button and a link that also lets you edit the weekly target.
    - pending and proposed to you: Accept or Decline buttons, no progress yet.

  weeklyTarget is the number of gym sessions both partners commit to each week.
  currentStreak is how many finished weeks in a row both of you hit that target.
  The week in progress is not part of the streak yet, so it's shown on its own.
*/

function PactCard({ pact, onChanged }) {
  const [error, setError] = useState("");

  // work out how this pact relates to me so the card shows the right buttons
  const isActive = pact.status === "active";
  const iProposed = pact.role === "proposer";

  // pull the server's message off a failed response so the user sees why
  async function readError(res, fallback) {
    const data = await res.json().catch(() => ({}));
    return data.error || fallback;
  }

  async function handleAccept() {
    setError("");
    // no body — the server reads who I am from the session
    const res = await fetch(`/api/pacts/${pact._id}/accept`, { method: "PUT" });
    if (!res.ok) {
      setError(await readError(res, "Could not accept pact"));
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    // "Delete" for my own proposal, "Decline" for one sent to me — same call
    const question = iProposed
      ? "Delete this pact proposal?"
      : "Decline this pact?";
    const confirmed = window.confirm(question);
    if (!confirmed) return;
    setError("");
    const res = await fetch(`/api/pacts/${pact._id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(await readError(res, "Could not remove pact"));
      return;
    }
    onChanged();
  }

  return (
    <div className="pact-card">
      <div className="pact-card-header">
        <h2>{pact.partner.displayName}</h2>
        <span className={`pact-status status-${pact.status}`}>
          {pact.status}
        </span>
      </div>

      <p>
        Weekly target (# of gym sessions) : <b>{pact.weeklyTarget}</b>
      </p>

      {/* streak and weekly progress only make sense once the pact is active */}
      {isActive && (
        <>
          <p>
            Current streak(# of consecutive weeks hit target) :{" "}
            <b>{pact.currentStreak}</b>
          </p>
          <p className="pact-week-progress">
            This week: you <b>{pact.thisWeek.you}</b> of {pact.thisWeek.target}{" "}
            · {pact.partner.displayName} <b>{pact.thisWeek.partner}</b> of{" "}
            {pact.thisWeek.target}
          </p>
        </>
      )}

      {/* pending and proposed by me: waiting on the other person */}
      {!isActive && iProposed && (
        <p className="pact-note">Waiting to be accepted</p>
      )}

      {/* pending and proposed to me: I decide whether to accept it */}
      {!isActive && !iProposed && (
        <div className="pact-card-actions">
          <button type="button" onClick={handleAccept}>
            Accept
          </button>
          <button type="button" className="pact-decline" onClick={handleDelete}>
            Decline
          </button>
        </div>
      )}

      {error && <p className="pact-card-error">{error}</p>}

      <div className="pact-card-actions">
        {/* only the proposer of a pending pact can still edit the target */}
        <Link to={`/pacts/${pact._id}`}>
          {!isActive && iProposed
            ? "View details / Edit weekly target"
            : "View details"}
        </Link>
        {/* the proposer can delete their own proposal while it's still pending */}
        {!isActive && iProposed && (
          <button type="button" className="pact-delete" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// describes the shape of the props this component expects.
// currentStreak and thisWeek are only present on active pacts.
PactCard.propTypes = {
  pact: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    weeklyTarget: PropTypes.number.isRequired,
    currentStreak: PropTypes.number,
    thisWeek: PropTypes.shape({
      you: PropTypes.number.isRequired,
      partner: PropTypes.number.isRequired,
      target: PropTypes.number.isRequired,
    }),
    partner: PropTypes.shape({
      displayName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default PactCard;

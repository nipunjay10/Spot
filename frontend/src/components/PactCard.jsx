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

// renders one pact card and picks which sections/buttons to show
function PactCard({ pact, onChanged }) {
  // holds a message from a failed accept/delete call, if any
  const [error, setError] = useState("");

  // work out how this pact relates to me so the card shows the right buttons
  const isActive = pact.status === "active";
  const iProposed = pact.role === "proposer";

  // pull the server's message off a failed response so the user sees why
  async function readError(res, fallback) {
    const data = await res.json().catch(() => ({}));
    return data.error || fallback;
  }

  // accepts a pact that was proposed to me, then refreshes the dashboard
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

  // removes a pending pact — same call, but the confirm wording depends on my role
  async function handleDelete() {
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

  // shows streak and this week's progress — only shown once the pact is active
  function renderActiveDetails() {
    return (
      <>
        <p>
          Current streak(# of consecutive weeks hit target) :{" "}
          <b>{pact.currentStreak}</b>
        </p>
        <p className="pact-week-progress">
          This week: you <b>{pact.thisWeek.you}</b> of {pact.thisWeek.target} ·{" "}
          {pact.partner.displayName} <b>{pact.thisWeek.partner}</b> of{" "}
          {pact.thisWeek.target}
        </p>
      </>
    );
  }

  // tells me I'm waiting on the other person, shown only for my own pending proposal
  function renderPendingNote() {
    if (isActive || !iProposed) return null;
    return <p className="pact-note">Waiting to be accepted</p>;
  }

  // accept/decline buttons, shown only for a pact someone else proposed to me
  function renderPendingRespondActions() {
    if (isActive || iProposed) return null;
    return (
      <div className="pact-card-actions">
        <button type="button" onClick={handleAccept}>
          Accept
        </button>
        <button type="button" className="pact-decline" onClick={handleDelete}>
          Decline
        </button>
      </div>
    );
  }

  // link to the pact details, plus a delete button while my own proposal is still pending
  function renderFooterActions() {
    return (
      <div className="pact-card-actions">
        <Link to={`/pacts/${pact._id}`}>
          {!isActive && iProposed
            ? "View details / Edit weekly target"
            : "View details"}
        </Link>
        {!isActive && iProposed && (
          <button type="button" className="pact-delete" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pact-card">
      <div className="pact-card-header">
        <h2>
          {pact.partner.displayName} (@{pact.partner.username})
        </h2>
        <span className={`pact-status status-${pact.status}`}>
          {pact.status}
        </span>
      </div>

      <p>
        Weekly target (# of gym sessions) : <b>{pact.weeklyTarget}</b>
      </p>

      {isActive && renderActiveDetails()}
      {renderPendingNote()}
      {renderPendingRespondActions()}
      {error && <p className="pact-card-error">{error}</p>}
      {renderFooterActions()}
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
      username: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default PactCard;

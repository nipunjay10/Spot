import { useState } from "react";
import PropTypes from "prop-types";
import "./ChallengeCard.css";

// today as YYYY-MM-DD, built from local parts so the date can't slip a day
function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ChallengeCard({ challenge, currentUser, onChanged }) {
  // which day the accepter is marking done (defaults to today)
  const [dayToLog, setDayToLog] = useState(todayString);
  const [error, setError] = useState("");

  // the creator can delete their own challenge, but can't accept it
  const isCreator = challenge.creatorId === currentUser._id;
  // myAcceptance is this user's own record for the challenge, or null
  const acceptance = challenge.myAcceptance;
  const isAccepter = Boolean(acceptance);

  // an accepter's card carries a status; an untouched open challenge shows "open"
  const status = acceptance ? acceptance.status : "open";
  // days marked done so far, against the challenge's target
  const doneCount = acceptance ? acceptance.completedDays.length : 0;
  // the mark button toggles, so its label depends on whether the picked day
  // is already marked — clicking a marked day unmarks it
  const dayAlreadyMarked =
    acceptance && acceptance.completedDays.includes(dayToLog);

  // pull the server's message off a failed response so the user sees why
  async function readError(res, fallback) {
    const data = await res.json().catch(() => ({}));
    return data.error || fallback;
  }

  async function handleAccept() {
    setError("");
    // no accepterId — the server reads it from the session
    const res = await fetch(`/api/challenges/${challenge._id}/accept`, {
      method: "PUT",
    });
    if (!res.ok) {
      setError(await readError(res, "Could not accept challenge"));
      return;
    }
    onChanged();
  }

  async function handleMarkDay(e) {
    e.preventDefault();
    setError("");
    // the server toggles the day on/off in the accepter's completedDays
    const res = await fetch(`/api/challenges/${challenge._id}/day`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dayToLog }),
    });
    if (!res.ok) {
      setError(await readError(res, "Could not log day"));
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this challenge?");
    if (!confirmed) return;
    setError("");
    const res = await fetch(`/api/challenges/${challenge._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(await readError(res, "Could not delete challenge"));
      return;
    }
    onChanged();
  }

  return (
    <div className="challenge-card">
      <div className="challenge-card-header">
        <strong>{challenge.description}</strong>
        {isCreator && <span className="challenge-role">Posted by you</span>}
        <span className={`challenge-status status-${status}`}>{status}</span>
      </div>

      {/* who created the challenge, shown as DisplayName (@username) */}
      {challenge.creator && (
        <p className="challenge-creator">
          by {challenge.creator.displayName} (@{challenge.creator.username})
        </p>
      )}

      <p className="challenge-window">
        {challenge.startDate} → {challenge.endDate}
      </p>
      <p className="challenge-target">
        Goal: complete on {challenge.targetDays} day
        {challenge.targetDays === 1 ? "" : "s"}
        {isAccepter && ` — ${doneCount} / ${challenge.targetDays} done`}
      </p>

      {/* OPEN to you: anyone but the creator can accept, even if others have */}
      {!isAccepter && !isCreator && (
        <button type="button" onClick={handleAccept}>
          Accept challenge
        </button>
      )}
      {!isAccepter && isCreator && (
        <p className="challenge-note">Open for others to accept</p>
      )}

      {/* ACCEPTED by you: mark any day in the window done */}
      {isAccepter && status === "accepted" && (
        <form className="proof-form" onSubmit={handleMarkDay}>
          <label htmlFor={`dayToLog-${challenge._id}`}>Mark a day done</label>
          <input
            id={`dayToLog-${challenge._id}`}
            type="date"
            min={challenge.startDate}
            max={challenge.endDate}
            value={dayToLog}
            onChange={(e) => setDayToLog(e.target.value)}
            required
          />
          <button type="submit">
            {dayAlreadyMarked ? "Unmark this day" : "Mark this day done"}
          </button>
        </form>
      )}

      {/* list the days marked done so far */}
      {isAccepter && acceptance.completedDays.length > 0 && (
        <ul className="proof-list">
          {acceptance.completedDays.map((date) => (
            <li key={date}>{date}: ✓</li>
          ))}
        </ul>
      )}

      {error && <p className="challenge-card-error">{error}</p>}

      {/* only the creator deletes, and only while nobody has accepted yet */}
      {isCreator && (
        <button
          type="button"
          className="challenge-delete"
          onClick={handleDelete}
        >
          Delete
        </button>
      )}
    </div>
  );
}

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    creatorId: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    targetDays: PropTypes.number.isRequired,
    creator: PropTypes.shape({
      username: PropTypes.string,
      displayName: PropTypes.string,
    }),
    myAcceptance: PropTypes.shape({
      status: PropTypes.string.isRequired,
      completedDays: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  }).isRequired,
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default ChallengeCard;

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import ChallengeSection from "../components/ChallengeSection";
import "./ChallengesPage.css";

// how many days a start→end window covers, counting both ends.
// returns 0 until both dates are set (or if end is before start).
function daysInRange(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const start = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

// today as YYYY-MM-DD, from local parts so the date can't slip a day.
// used to stop a challenge from being posted in the past.
function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ChallengesPage({ currentUser }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // create-form state
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetDays, setTargetDays] = useState(3);
  const [error, setError] = useState("");

  // only the Open section filters — Accepted and Done are always just yours
  const [openFilter, setOpenFilter] = useState("all");

  useEffect(() => {
    loadChallenges();
  }, []);

  async function loadChallenges() {
    // no status filter — we fetch all and split into sections client-side
    const res = await fetch("/api/challenges");
    if (res.ok) {
      const data = await res.json();
      setChallenges(data);
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    // the target can't exceed the window, so clamp it to the day count in case
    // the range shrank after the target was chosen
    const window = daysInRange(startDate, endDate);
    const clampedTarget = Math.min(targetDays, window);
    // no creatorId — the server reads it from the session
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        startDate,
        endDate,
        targetDays: clampedTarget,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create challenge");
      return;
    }
    // reset form and refresh the feed
    setDescription("");
    setStartDate("");
    setEndDate("");
    setTargetDays(3);
    loadChallenges();
  }

  if (loading) {
    return null;
  }

  // a challenge can't start in the past, and can't end before it starts
  const today = todayString();

  // the target can be anywhere from 1 up to the number of days in the window,
  // so build that list of options from whatever dates are currently picked
  const windowLength = daysInRange(startDate, endDate);
  const targetOptions = [];
  for (let n = 1; n <= windowLength; n++) {
    targetOptions.push(n);
  }

  // your relationship to a challenge comes from the creator id and your own
  // acceptance record (the server attaches myAcceptance for the logged-in user)
  const isCreator = (c) => c.creatorId === currentUser._id;

  // "all" keeps the list as-is, so the section only shrinks once you pick a side
  function applyOpenFilter(list, filter) {
    if (filter === "mine") {
      return list.filter(isCreator);
    }
    // you can accept any open challenge that isn't your own
    if (filter === "theirs") {
      return list.filter((c) => !isCreator(c));
    }
    return list;
  }

  // Open = anything you haven't accepted (the server already hides expired ones).
  // It stays a shared pool, so you see it whether or not others have accepted.
  const open = applyOpenFilter(
    challenges.filter((c) => !c.myAcceptance),
    openFilter,
  );
  // Accepted and Done read straight off your own acceptance status
  const accepted = challenges.filter(
    (c) => c.myAcceptance && c.myAcceptance.status === "accepted",
  );
  const done = challenges.filter(
    (c) =>
      c.myAcceptance &&
      (c.myAcceptance.status === "completed" ||
        c.myAcceptance.status === "failed"),
  );

  return (
    <div className="challenges-page">
      <h1>Challenges</h1>

      <form className="challenge-create-form" onSubmit={handleCreate}>
        <h2>Post a challenge</h2>
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          placeholder="e.g. 100 push-ups a day"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <div className="challenge-create-dates">
          <div>
            <label htmlFor="startDate">Start</label>
            <input
              id="startDate"
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="endDate">End</label>
            <input
              id="endDate"
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <label htmlFor="targetDays">Complete on how many days?</label>
        <select
          id="targetDays"
          // the options only exist once a valid date range is picked
          value={windowLength === 0 ? "" : Math.min(targetDays, windowLength)}
          onChange={(e) => setTargetDays(Number(e.target.value))}
          disabled={windowLength === 0}
          required
        >
          {windowLength === 0 && (
            // two different empty states: no dates yet vs. an end before start
            <option value="">
              {!startDate || !endDate
                ? "Pick start and end dates first"
                : "End date must be on or after the start date"}
            </option>
          )}
          {targetOptions.map((n) => (
            <option key={n} value={n}>
              {n} day{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        {error && <p className="challenge-error">{error}</p>}
        <button type="submit">Post challenge</button>
      </form>

      <ChallengeSection
        title="Open"
        filterId="openFilter"
        filterValue={openFilter}
        onFilterChange={setOpenFilter}
        filterOptions={[
          { value: "all", label: "All" },
          { value: "mine", label: "Posted by me" },
          { value: "theirs", label: "I could accept" },
        ]}
        challenges={open}
        emptyMessage="No open challenges."
        currentUser={currentUser}
        onChanged={loadChallenges}
      />

      <ChallengeSection
        title="Accepted"
        challenges={accepted}
        emptyMessage="Nothing accepted yet."
        currentUser={currentUser}
        onChanged={loadChallenges}
      />

      <ChallengeSection
        title="Done"
        challenges={done}
        emptyMessage="No finished challenges."
        currentUser={currentUser}
        onChanged={loadChallenges}
      />
    </div>
  );
}

ChallengesPage.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
};

export default ChallengesPage;

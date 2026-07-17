import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import ChallengeCard from "../components/ChallengeCard";
import "./ChallengesPage.css";

function ChallengesPage({ currentUser }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // create-form state
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  // each section filters on its own, and starts out showing everything
  const [openFilter, setOpenFilter] = useState("all");
  const [acceptedFilter, setAcceptedFilter] = useState("all");
  const [doneFilter, setDoneFilter] = useState("all");

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
    // no creatorId — the server reads it from the session
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, startDate, endDate }),
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
    loadChallenges();
  }

  if (loading) {
    return null;
  }

  // the two roles a challenge can have relative to you
  const isCreator = (c) => c.creatorId === currentUser._id;
  const isAccepter = (c) => c.accepterId === currentUser._id;
  // most challenges are between two other people — these are the ones you're in
  const isMine = (c) => isCreator(c) || isAccepter(c);

  // "all" keeps the list as-is, so a section only shrinks once you pick a side
  function applyFilter(list, filter) {
    if (filter === "mine") {
      return list.filter(isCreator);
    }
    // an open challenge has no accepter yet, so "could accept" is everyone else's
    if (filter === "theirs") {
      return list.filter((c) => !isCreator(c));
    }
    if (filter === "accepted-by-me") {
      return list.filter(isAccepter);
    }
    return list;
  }

  // split into the three lifecycle sections
  // open stays the whole feed, since that's where you find someone to match with
  const open = applyFilter(
    challenges.filter((c) => c.status === "open"),
    openFilter,
  );
  // accepted and done are about you, so they only show challenges you're in
  const accepted = applyFilter(
    challenges.filter((c) => c.status === "accepted" && isMine(c)),
    acceptedFilter,
  );
  const done = applyFilter(
    challenges.filter(
      (c) => (c.status === "completed" || c.status === "failed") && isMine(c),
    ),
    doneFilter,
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
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        {error && <p className="challenge-error">{error}</p>}
        <button type="submit">Post challenge</button>
      </form>

      <section className="challenge-section">
        <div className="challenge-section-head">
          <h2>Open</h2>
          <label htmlFor="openFilter">Show</label>
          <select
            id="openFilter"
            value={openFilter}
            onChange={(e) => setOpenFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="mine">Posted by me</option>
            <option value="theirs">I could accept</option>
          </select>
        </div>
        {open.length === 0 ? (
          // an active filter is a different kind of empty than an empty feed
          <p>
            {openFilter === "all"
              ? "No open challenges."
              : "None match this filter."}
          </p>
        ) : (
          <div className="challenge-scroll">
            {open.map((c) => (
              <ChallengeCard
                key={c._id}
                challenge={c}
                currentUser={currentUser}
                onChanged={loadChallenges}
              />
            ))}
          </div>
        )}
      </section>

      <section className="challenge-section">
        <div className="challenge-section-head">
          <h2>Accepted</h2>
          <label htmlFor="acceptedFilter">Show</label>
          <select
            id="acceptedFilter"
            value={acceptedFilter}
            onChange={(e) => setAcceptedFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="mine">Posted by me</option>
            <option value="accepted-by-me">Accepted by me</option>
          </select>
        </div>
        {accepted.length === 0 ? (
          <p>
            {acceptedFilter === "all"
              ? "Nothing accepted yet."
              : "None match this filter."}
          </p>
        ) : (
          <div className="challenge-scroll">
            {accepted.map((c) => (
              <ChallengeCard
                key={c._id}
                challenge={c}
                currentUser={currentUser}
                onChanged={loadChallenges}
              />
            ))}
          </div>
        )}
      </section>

      <section className="challenge-section">
        <div className="challenge-section-head">
          <h2>Done</h2>
          <label htmlFor="doneFilter">Show</label>
          <select
            id="doneFilter"
            value={doneFilter}
            onChange={(e) => setDoneFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="mine">Posted by me</option>
            <option value="accepted-by-me">Accepted by me</option>
          </select>
        </div>
        {done.length === 0 ? (
          <p>
            {doneFilter === "all"
              ? "No finished challenges."
              : "None match this filter."}
          </p>
        ) : (
          <div className="challenge-scroll">
            {done.map((c) => (
              <ChallengeCard
                key={c._id}
                challenge={c}
                currentUser={currentUser}
                onChanged={loadChallenges}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

ChallengesPage.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
};

export default ChallengesPage;

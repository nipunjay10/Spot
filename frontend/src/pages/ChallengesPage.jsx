import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import ChallengeSection from "../components/ChallengeSection";
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
        filterId="acceptedFilter"
        filterValue={acceptedFilter}
        onFilterChange={setAcceptedFilter}
        filterOptions={[
          { value: "all", label: "All" },
          { value: "mine", label: "Posted by me" },
          { value: "accepted-by-me", label: "Accepted by me" },
        ]}
        challenges={accepted}
        emptyMessage="Nothing accepted yet."
        currentUser={currentUser}
        onChanged={loadChallenges}
      />

      <ChallengeSection
        title="Done"
        filterId="doneFilter"
        filterValue={doneFilter}
        onFilterChange={setDoneFilter}
        filterOptions={[
          { value: "all", label: "All" },
          { value: "mine", label: "Posted by me" },
          { value: "accepted-by-me", label: "Accepted by me" },
        ]}
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

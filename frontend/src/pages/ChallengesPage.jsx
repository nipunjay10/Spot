import { useEffect, useState } from "react";
import ChallengeCard from "../components/ChallengeCard";
import "./ChallengesPage.css";

function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // create-form state
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

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

  // split into the three lifecycle sections
  const open = challenges.filter((c) => c.status === "open");
  const accepted = challenges.filter((c) => c.status === "accepted");
  const done = challenges.filter(
    (c) => c.status === "completed" || c.status === "failed",
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
        <h2>Open</h2>
        {open.length === 0 ? (
          <p>No open challenges.</p>
        ) : (
          <div className="challenge-scroll">
            {open.map((c) => (
              <ChallengeCard
                key={c._id}
                challenge={c}
                onChanged={loadChallenges}
              />
            ))}
          </div>
        )}
      </section>

      <section className="challenge-section">
        <h2>Accepted</h2>
        {accepted.length === 0 ? (
          <p>Nothing accepted yet.</p>
        ) : (
          <div className="challenge-scroll">
            {accepted.map((c) => (
              <ChallengeCard
                key={c._id}
                challenge={c}
                onChanged={loadChallenges}
              />
            ))}
          </div>
        )}
      </section>

      <section className="challenge-section">
        <h2>Done</h2>
        {done.length === 0 ? (
          <p>No finished challenges.</p>
        ) : (
          <div className="challenge-scroll">
            {done.map((c) => (
              <ChallengeCard
                key={c._id}
                challenge={c}
                onChanged={loadChallenges}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ChallengesPage;
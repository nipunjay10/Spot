import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./PactDetailPage.css";

function PactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pact, setPact] = useState(null);
  const [weeklyTarget, setWeeklyTarget] = useState(1);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  // fetches this pact (with both partners' profiles) from the server.
  // useCallback keeps the same function between renders unless the id
  // changes, so the useEffect below can safely depend on it.
  const loadPact = useCallback(async () => {
    const res = await fetch(`/api/pacts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setPact(data);
      setWeeklyTarget(data.weeklyTarget);
      return;
    }
    // without this the page would sit on "Loading pact..." forever
    const data = await res.json();
    setLoadError(data.error || "Could not load this pact");
  }, [id]);

  // load the pact when the page mounts, and again if the id in the url changes
  useEffect(() => {
    loadPact();
  }, [loadPact]);

  async function handleSaveTarget(e) {
    // stop the browser from doing a full page reload on submit
    e.preventDefault();
    setError("");

    const res = await fetch(`/api/pacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyTarget: Number(weeklyTarget) }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    // refresh the pact so the displayed target matches what was saved
    loadPact();
  }

  async function handleDissolve() {
    // ask for confirmation since dissolving a pact can't be undone
    const confirmed = window.confirm(
      "Are you sure you want to dissolve this pact?",
    );
    if (!confirmed) return;

    await fetch(`/api/pacts/${id}`, { method: "DELETE" });
    // go back to the dashboard now that the pact is gone
    navigate("/");
  }

  // the pact couldn't be loaded at all — say so instead of hanging
  if (loadError) {
    return (
      <div className="pact-detail-page">
        <p className="pact-detail-error">{loadError}</p>
        <Link to="/">Back to dashboard</Link>
      </div>
    );
  }

  // still waiting on the initial fetch
  if (!pact) {
    return <p>Loading pact...</p>;
  }

  return (
    <div className="pact-detail-page">
      <Link to="/">← Back to dashboard</Link>
      <h1>Pact Detail</h1>

      {/* only the two partners can load this page, so it's safe to show emails here */}
      <p>
        Partner A: {pact.partnerA.displayName} ({pact.partnerA.email})
      </p>
      <p>
        Partner B: {pact.partnerB.displayName} ({pact.partnerB.email})
      </p>
      <p>Current streak: {pact.currentStreak}</p>
      <p>
        This week: {pact.partnerA.displayName} {pact.thisWeek.partnerA} of{" "}
        {pact.thisWeek.target} · {pact.partnerB.displayName}{" "}
        {pact.thisWeek.partnerB} of {pact.thisWeek.target}
      </p>

      <form onSubmit={handleSaveTarget}>
        <label htmlFor="weeklyTarget">Weekly target</label>
        <select
          id="weeklyTarget"
          name="weeklyTarget"
          value={weeklyTarget}
          onChange={(e) => setWeeklyTarget(e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="submit">Save</button>
      </form>

      {error && <p className="pact-detail-error">{error}</p>}

      <button
        type="button"
        className="dissolve-button"
        onClick={handleDissolve}
      >
        Dissolve pact
      </button>
    </div>
  );
}

export default PactDetailPage;

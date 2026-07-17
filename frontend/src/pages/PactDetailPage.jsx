import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./PactDetailPage.css";

function PactDetailPage({ currentUser }) {
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

    // head back to the dashboard now that the new target is saved
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

  // work out which side of the pact is me, so the "this week" tile can label
  // my own count as "You" and show the other person by name
  const iAmPartnerA = pact.partnerA._id === currentUser._id;
  const partner = iAmPartnerA ? pact.partnerB : pact.partnerA;
  const canEdit = pact.status === "pending" && pact.role === "proposer";

  return (
    <div className="pact-detail-page">
      <Link to="/">← Back to dashboard</Link>

      <div className="pact-detail-card">
        {/* names lead, with the status pill on the right */}
        <div className="pact-detail-header">
          <h1>
            You &amp; {partner.displayName} (@{partner.username})
          </h1>
          <span className={`pact-status status-${pact.status}`}>
            {pact.status}
          </span>
        </div>

        <div className="stat-tiles">
          {/* weekly target is the anchor — first and, when pending, editable */}
          <div className="stat-tile stat-tile-target">
            {canEdit ? (
              <form onSubmit={handleSaveTarget}>
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
            ) : (
              <span className="stat-number">{pact.weeklyTarget}</span>
            )}
            <span className="stat-label">Weekly target</span>
          </div>

          {/* streak and this week only exist once both partners are active */}
          {pact.status === "active" && (
            <>
              <div className="stat-tile">
                <span className="stat-number">🔥 {pact.currentStreak}</span>
                <span className="stat-label">Current streak (weeks)</span>
              </div>

              <div className="stat-tile stat-tile-week">
                <span className="stat-week-line">
                  You{" "}
                  <b>
                    {iAmPartnerA
                      ? pact.thisWeek.partnerA
                      : pact.thisWeek.partnerB}
                  </b>{" "}
                  / {pact.thisWeek.target}
                </span>
                <span className="stat-week-line">
                  {partner.displayName}{" "}
                  <b>
                    {iAmPartnerA
                      ? pact.thisWeek.partnerB
                      : pact.thisWeek.partnerA}
                  </b>{" "}
                  / {pact.thisWeek.target}
                </span>
                <span className="stat-label">This week</span>
              </div>
            </>
          )}
        </div>

        {/* a pact you proposed is still waiting on the other person */}
        {pact.status === "pending" && pact.role === "proposer" && (
          <p className="pact-note">Waiting to be accepted</p>
        )}

        {error && <p className="pact-detail-error">{error}</p>}

        {/* emails are demoted to a quiet footer — still here, just not shouting */}
        <p className="pact-detail-footer">
          {pact.partnerA.displayName} ({pact.partnerA.email}) ·{" "}
          {pact.partnerB.displayName} ({pact.partnerB.email})
        </p>
      </div>
    </div>
  );
}

PactDetailPage.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
};

export default PactDetailPage;

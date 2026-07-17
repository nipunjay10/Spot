import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import PactCard from "../components/PactCard";
import "./DashboardPage.css";

function DashboardPage({ currentUser }) {
  const [pacts, setPacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // load all of the logged-in user's pacts when the page first mounts
  useEffect(() => {
    loadPacts();
  }, []);

  async function loadPacts() {
    // fetch pacts for the current user, each one already includes the partner's profile
    const res = await fetch("/api/pacts");
    if (res.ok) {
      const data = await res.json();
      setPacts(data);
    }
    setLoading(false);
  }

  // still waiting on the initial fetch — don't flash the empty state
  if (loading) {
    return <p>Loading pacts...</p>;
  }

  // split the pacts into the three lifecycle groups the dashboard shows
  // active: both partners agreed, so the streak and weekly progress are live
  const active = pacts.filter((pact) => pact.status === "active");
  // proposed by me and still waiting for the other person to accept
  const outgoing = pacts.filter(
    (pact) => pact.status === "pending" && pact.role === "proposer",
  );
  // proposed to me — I can accept or decline these
  const incoming = pacts.filter(
    (pact) => pact.status === "pending" && pact.role === "invited",
  );

  return (
    <div className="dashboard-page">
      <h1>Pacts</h1>

      {pacts.length === 0 ? (
        <p>
          No pacts yet. <Link to="/search">Make a pact</Link> with a partner to
          get started.
        </p>
      ) : (
        <>
          <section className="pact-section">
            <h2>Active</h2>
            {active.length === 0 ? (
              <p>No active pacts yet.</p>
            ) : (
              <div className="pact-list">
                {active.map((pact) => (
                  <PactCard
                    key={pact._id}
                    pact={pact}
                    currentUser={currentUser}
                    onChanged={loadPacts}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="pact-section">
            <h2>Proposed by you</h2>
            {outgoing.length === 0 ? (
              <p>You haven&apos;t proposed any pacts.</p>
            ) : (
              <div className="pact-list">
                {outgoing.map((pact) => (
                  <PactCard
                    key={pact._id}
                    pact={pact}
                    currentUser={currentUser}
                    onChanged={loadPacts}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="pact-section">
            <h2>Proposed to you</h2>
            {incoming.length === 0 ? (
              <p>No one has proposed a pact to you.</p>
            ) : (
              <div className="pact-list">
                {incoming.map((pact) => (
                  <PactCard
                    key={pact._id}
                    pact={pact}
                    currentUser={currentUser}
                    onChanged={loadPacts}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// describes the shape of the props this page expects
DashboardPage.propTypes = {
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
};

export default DashboardPage;

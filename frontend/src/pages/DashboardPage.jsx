import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PactCard from "../components/PactCard";
import "./DashboardPage.css";

function DashboardPage() {
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

  function PactSection({ title, pacts, emptyMessage }) {
    return (
      <section className="pact-section">
        <h2>{title}</h2>
        {pacts.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <div className="pact-list">
            {pacts.map((pact) => (
              <PactCard key={pact._id} pact={pact} onChanged={loadPacts} />
            ))}
          </div>
        )}
      </section>
    );
  }

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
          <PactSection
            title="Active"
            pacts={active}
            emptyMessage="No active pacts yet."
          />

          <PactSection
            title="Proposed by you"
            pacts={outgoing}
            emptyMessage="You haven't proposed any pacts."
          />

          <PactSection
            title="Proposed to you"
            pacts={incoming}
            emptyMessage="No one has proposed a pact to you."
          />
        </>
      )}
    </div>
  );
}

export default DashboardPage;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PactSection from "../components/PactSection";
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
            onChanged={loadPacts}
          />

          <PactSection
            title="Proposed by you"
            pacts={outgoing}
            emptyMessage="You haven't proposed any pacts."
            onChanged={loadPacts}
          />

          <PactSection
            title="Proposed to you"
            pacts={incoming}
            emptyMessage="No one has proposed a pact to you."
            onChanged={loadPacts}
          />
        </>
      )}
    </div>
  );
}

export default DashboardPage;

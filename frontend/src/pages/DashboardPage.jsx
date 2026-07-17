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

  return (
    <div className="dashboard-page">
      <h1>Pacts</h1>

      {pacts.length === 0 ? (
        <p>
          No pacts yet. <Link to="/search">Find a partner</Link> to start a
          pact.
        </p>
      ) : (
        <div className="pact-list">
          {pacts.map((pact) => (
            <PactCard key={pact._id} pact={pact} onReload={loadPacts} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;

import { useEffect, useState } from "react";
import SessionCard from "../components/SessionCard";
import "./HistoryPage.css";

function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // load the logged-in user's sessions once on mount
  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    // no userId — the server reads it from the session
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
    setLoading(false);
  }

  // derive the filtered list from state (client-side filtering)
  const filtered = sessions.filter((session) => {
    // exercise name match: keep the session if any exercise name contains the filter text
    const matchesExercise =
      exerciseFilter === "" ||
      session.exercises.some((ex) =>
        ex.name.toLowerCase().includes(exerciseFilter.toLowerCase()),
      );
    // date range match (dates are "YYYY-MM-DD" strings, which compare correctly)
    const matchesFrom = fromDate === "" || session.date >= fromDate;
    const matchesTo = toDate === "" || session.date <= toDate;
    return matchesExercise && matchesFrom && matchesTo;
  });

  if (loading) {
    return null;
  }

  return (
    <div className="history-page">
      <h1>Session History</h1>

      <div className="history-filters">
        <label htmlFor="exerciseFilter">Exercise</label>
        <input
          id="exerciseFilter"
          type="text"
          placeholder="e.g. Bench Press"
          value={exerciseFilter}
          onChange={(e) => setExerciseFilter(e.target.value)}
        />

        <label htmlFor="fromDate">From</label>
        <input
          id="fromDate"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <label htmlFor="toDate">To</label>
        <input
          id="toDate"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p>No sessions match. Log a workout to get started.</p>
      ) : (
        <div className="session-list">
          {filtered.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              onChanged={loadSessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;

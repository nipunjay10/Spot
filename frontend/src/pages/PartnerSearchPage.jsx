import { useState } from "react";
import UserCard from "../components/UserCard";
import PactForm from "../components/PactForm";
import "./PartnerSearchPage.css";

function PartnerSearchPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);

  async function handleSearch(e) {
    // stop the browser from doing a full page reload on submit
    e.preventDefault();

    // ask the server for users whose username/displayName match the search term
    const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    }
  }

  return (
    <div className="partner-search-page">
      <div className="search-header">
        <h1>Make a Pact</h1>

        <form onSubmit={handleSearch}>
          <label htmlFor="search">Search by username or display name</label>
          <input
            id="search"
            name="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="search-columns">
        <div className="search-column">
          {results.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onPropose={setSelectedPartner}
            />
          ))}
        </div>

        <div className="search-column">
          {selectedPartner && (
            <PactForm
              partner={selectedPartner}
              onCancel={() => setSelectedPartner(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PartnerSearchPage;

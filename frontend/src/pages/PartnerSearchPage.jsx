import { useRef, useState } from "react";
import UserCard from "../components/UserCard";
import PactForm from "../components/PactForm";
import styles from "./PartnerSearchPage.module.css";

function PartnerSearchPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  // remembers the "Propose pact" button that opened the form, so cancelling
  // can put the keyboard back where it was instead of dropping it to the top
  const proposeButtonRef = useRef(null);

  // the click event tells us which button was pressed, so we don't need a ref
  // on every card in the results list
  function handlePropose(user, event) {
    proposeButtonRef.current = event.currentTarget;
    setSelectedPartner(user);
  }

  function handleCancel() {
    setSelectedPartner(null);
    // isConnected is false if a new search replaced that card, in which case
    // there's nothing sensible to focus and we leave the keyboard alone
    if (proposeButtonRef.current && proposeButtonRef.current.isConnected) {
      proposeButtonRef.current.focus();
    }
  }

  async function handleSearch(e) {
    // stop the browser from doing a full page reload on submit
    e.preventDefault();

    // ask the server for users whose username/displayName match the search term
    const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    }
    // I would recommend adding an else {} here to display text if there are no users found, so that way users don't think there is an error if there's
    // no results.
  }

  return (
    <div className={styles.partnerSearchPage}>
      <div className={styles.searchHeader}>
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
          <button type="submit" className="btnNeutral">
            Search
          </button>
        </form>
      </div>

      <div className={styles.searchColumns}>
        <div className={styles.searchColumn}>
          {results.map((user) => (
            <UserCard key={user._id} user={user} onPropose={handlePropose} />
          ))}
        </div>

        <div className={styles.searchColumn}>
          {selectedPartner && (
            <PactForm partner={selectedPartner} onCancel={handleCancel} />
          )}
        </div>
      </div>
    </div>
  );
}

export default PartnerSearchPage;

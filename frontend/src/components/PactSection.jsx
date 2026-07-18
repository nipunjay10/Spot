import PropTypes from "prop-types";
import PactCard from "./PactCard";
import "./PactSection.css";

// one lifecycle group on the dashboard (Active, Proposed by you, Proposed to
// you): a heading, then either the pact cards or an empty message
function PactSection({ title, pacts, emptyMessage, onChanged }) {
  return (
    <section className="pact-section">
      <h2>{title}</h2>
      {pacts.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div className="pact-list">
          {pacts.map((pact) => (
            <PactCard key={pact._id} pact={pact} onChanged={onChanged} />
          ))}
        </div>
      )}
    </section>
  );
}

PactSection.propTypes = {
  title: PropTypes.string.isRequired,
  pacts: PropTypes.array.isRequired,
  emptyMessage: PropTypes.string.isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default PactSection;

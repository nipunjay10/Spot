import PropTypes from "prop-types";
import ChallengeCard from "./ChallengeCard";

function ChallengeSection({
  title,
  filterId,
  filterValue,
  onFilterChange,
  filterOptions,
  challenges,
  emptyMessage,
  currentUser,
  onChanged,
}) {
  return (
    <section className="challenge-section">
      <div className="challenge-section-head">
        <h2>{title}</h2>
        <label htmlFor={filterId}>Show</label>
        <select
          id={filterId}
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {challenges.length === 0 ? (
        // an active filter is a different kind of empty than an empty feed
        <p>
          {filterValue === "all" ? emptyMessage : "None match this filter."}
        </p>
      ) : (
        <div className="challenge-scroll">
          {challenges.map((c) => (
            <ChallengeCard
              key={c._id}
              challenge={c}
              currentUser={currentUser}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </section>
  );
}

ChallengeSection.propTypes = {
  title: PropTypes.string.isRequired,
  filterId: PropTypes.string.isRequired,
  filterValue: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  challenges: PropTypes.array.isRequired,
  emptyMessage: PropTypes.string.isRequired,
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default ChallengeSection;

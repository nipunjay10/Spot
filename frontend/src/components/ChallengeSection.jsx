import PropTypes from "prop-types";
import ChallengeCard from "./ChallengeCard";
import "./ChallengeSection.css";

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
  // Accepted and Done only ever show challenges you accepted, so they pass no
  // filter options — the dropdown only appears for sections that have them.
  const hasFilter = filterOptions && filterOptions.length > 0;

  return (
    <section className="challenge-section">
      <div className="challenge-section-head">
        <h2>{title}</h2>
        {hasFilter && (
          <>
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
          </>
        )}
      </div>
      {challenges.length === 0 ? (
        // an active filter is a different kind of empty than an empty feed
        <p>
          {!hasFilter || filterValue === "all"
            ? emptyMessage
            : "None match this filter."}
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
  // filter props are only needed by sections that actually show a dropdown
  filterId: PropTypes.string,
  filterValue: PropTypes.string,
  onFilterChange: PropTypes.func,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  challenges: PropTypes.array.isRequired,
  emptyMessage: PropTypes.string.isRequired,
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
  onChanged: PropTypes.func.isRequired,
};

export default ChallengeSection;

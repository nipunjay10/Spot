import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./PactCard.css";

/*
  PactCard displays a single pact summary card for the dashboard.
  It shows the partner name, the weekly target, the current streak, and how
  both of you are doing in the week that's still in progress.

  weeklyTarget is the number of gym sessions both partners commit to each week.
  currentStreak is how many finished weeks in a row both of you hit that target.
  The week in progress is not part of the streak yet, so it's shown on its own.
*/

function PactCard({ pact }) {
  const { thisWeek } = pact;

  return (
    <div className="pact-card">
      <h2>  {pact.partner.displayName}</h2>
      <p>
        Weekly target (# of gym sessions) : <b>{pact.weeklyTarget}</b>
      </p>
      <p>
        Current streak(# of consecutive weeks hit target) :{" "}
        <b>{pact.currentStreak}</b>
      </p>
      <p className="pact-week-progress">
        This week: you <b>{thisWeek.you}</b> of {thisWeek.target} ·{" "}
        {pact.partner.displayName} <b>{thisWeek.partner}</b> of{" "}
        {thisWeek.target}
      </p>

      <div className="pact-card-actions">
        <Link to={`/pacts/${pact._id}`}>View details / Edit Weekly Target</Link>
      </div>
    </div>
  );
}

// describes the shape of the props this component expects
PactCard.propTypes = {
  pact: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    weeklyTarget: PropTypes.number.isRequired,
    currentStreak: PropTypes.number.isRequired,
    thisWeek: PropTypes.shape({
      you: PropTypes.number.isRequired,
      partner: PropTypes.number.isRequired,
      target: PropTypes.number.isRequired,
    }).isRequired,
    partner: PropTypes.shape({
      displayName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default PactCard;

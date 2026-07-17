/*
  Streak math for pacts. Every function here takes "YYYY-MM-DD" strings and
  returns them, so nothing in this file needs to know about clocks or
  timezones. Sessions store their date as that same kind of string, which is
  what makes this possible.

  A streak is how many completed weeks in a row both partners hit their
  weekly target. It is never stored — it is recomputed from the sessions
  every time a pact is read.
*/

// Monday of the week that contains this date.
// Parsing at noon means no timezone can shift the day either way.
function mondayOf(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// Move a date string forward (or back, with a negative n) by whole days
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// The most recent week that has actually finished. The current week is left
// out on purpose: a week still in progress hasn't been failed, it just isn't
// over, so it can't count for or against a streak yet.
function lastCompletedWeek(todayStr) {
  return addDays(mondayOf(todayStr), -7);
}

// Walk backwards a week at a time while both partners hit the target,
// and stop at the first week either of them missed.
// weekCountsA/B map a week's Monday to that partner's session count.
function streakFrom(weekCountsA, weekCountsB, target, createdAtStr, todayStr) {
  // a pact can't have a streak from before it existed
  const firstWeek = mondayOf(createdAtStr);
  let week = lastCompletedWeek(todayStr);
  let streak = 0;

  while (week >= firstWeek) {
    const countA = weekCountsA[week] || 0;
    const countB = weekCountsB[week] || 0;
    if (countA < target || countB < target) break;
    streak++;
    week = addDays(week, -7);
  }

  return streak;
}

export { mondayOf, addDays, lastCompletedWeek, streakFrom };

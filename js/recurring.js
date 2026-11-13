// (Optional advanced recurring scheduler) - currently simplistic and integrated in main.js
// Here for extension: functions to compute next due dates or to list recurring rules.
export function nextOccurrence(rule){
  // rule: { day, amount, category, type, title }
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth();
  let candidate = new Date(year, month, rule.day || 1);
  if(candidate < now) candidate = new Date(year, month+1, rule.day || 1);
  return candidate.toISOString().slice(0,10);
}
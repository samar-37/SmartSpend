// Very small reminders module: checks for upcoming transactions in next N days and shows Notification or alert
export function startReminders(getUserFunc, daysAhead = 3){
  if(!('Notification' in window)) return;
  if(Notification.permission === 'default') Notification.requestPermission();
  setInterval(()=>checkAndNotify(getUserFunc(), daysAhead), 60*60*1000); // every hour
}
function checkAndNotify(user, days){
  if(!user) return;
  const now = new Date();
  const limit = new Date(now.getTime() + days * 24*60*60*1000);
  const upcoming = (user.transactions || []).filter(t=> {
    const d = new Date(t.date);
    return d >= now && d <= limit && t.type === 'expense';
  });
  if(upcoming.length > 0 && Notification.permission === 'granted'){
    const title = `Upcoming ${upcoming.length} bill(s)`;
    const body = upcoming.slice(0,3).map(u=>`${u.title} on ${u.date} → ₹${u.amount}`).join('\n');
    new Notification(title, { body });
  } else if(upcoming.length > 0){
    // fallback small in-app alert
    console.log('Upcoming bills', upcoming);
  }
}
export function uid() {
  return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}
export function emailKey(email){
  return 'user:' + email.toLowerCase();
}
export function readJSON(path){ return fetch(path).then(r=>r.json()).catch(()=>[]); }
export function formatCurrency(n){ return '₹' + Number(n || 0).toLocaleString(); }
export function todayISO(){ const d = new Date(); return d.toISOString().slice(0,10); }
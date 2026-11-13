import { emailKey } from './utils.js';

function saveUser(email, data){
  localStorage.setItem(emailKey(email), JSON.stringify(data));
}
function loadUser(email){
  try { return JSON.parse(localStorage.getItem(emailKey(email))) || null; } catch(e){ return null; }
}

function setCurrent(email){
  localStorage.setItem('set_current_user', email);
}

function clearCurrent(){ localStorage.removeItem('set_current_user'); }

function handleSignup(e){
  e.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const name = document.getElementById('name').value.trim();
  const password = document.getElementById('password').value;
  if(!email || !password){ alert('Fill required'); return; }
  if(loadUser(email)){ alert('Account already exists. Please login.'); return; }
  const template = {
    email, name, password,
    transactions: [],
    recurring: [],
    budget: { monthly: 0 },
    settings: { theme: localStorage.getItem('theme') || 'light' }
  };
  saveUser(email, template);
  setCurrent(email);
  location.href = 'dashboard.html';
}

function handleLogin(e){
  e.preventDefault();
  const email = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const user = loadUser(email);
  if(!user){ alert('User not found'); return; }
  if(user.password !== password){ alert('Wrong password'); return; }
  setCurrent(email);
  location.href = 'dashboard.html';
}

function handleDemo(){
  const demoEmail = 'demo@local';
  const demo = loadUser(demoEmail);
  if(!demo){
    const template = {
      email: demoEmail,
      name: 'Demo User',
      password: 'demo123',
      transactions: [],
      recurring: [],
      budget: { monthly: 50000 },
      settings: { theme: localStorage.getItem('theme') || 'light' }
    };
    saveUser(demoEmail, template);
  }
  setCurrent(demoEmail);
  location.href = 'dashboard.html';
}

// wire forms if present
document.addEventListener('DOMContentLoaded', ()=>{
  const sform = document.getElementById('signupForm');
  if(sform) sform.addEventListener('submit', handleSignup);

  const lform = document.getElementById('loginForm');
  if(lform) lform.addEventListener('submit', handleLogin);

  const demoBtn = document.getElementById('demoBtn');
  if(demoBtn) demoBtn.addEventListener('click', handleDemo);
});
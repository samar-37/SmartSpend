import { useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function save(event) {
    event.preventDefault();
    setError(''); setMessage('');
    try { const { data } = await api.patch('/users/profile', { name }); setUser(data.user); setMessage('Profile updated.'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update profile.'); }
  }
  async function changePassword(event) {
    event.preventDefault();
    setError(''); setMessage('');
    try {
      const { data } = await api.patch('/users/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setMessage(data.message);
      setUser(null);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to change password.'); }
  }
  return <div className="profile-grid">
    <Card><h3>Profile</h3><form className="profile-form" onSubmit={save}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email<input value={user.email} disabled /></label><Button type="submit">Save changes</Button>{message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}</form></Card>
    <Card><h3>Change password</h3><form className="profile-form" onSubmit={changePassword}><label>Current password<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} autoComplete="current-password" /></label><label>New password<input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} autoComplete="new-password" /></label><Button type="submit">Change password</Button></form></Card>
  </div>;
}

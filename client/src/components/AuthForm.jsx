import { useState } from 'react';
import Button from './ui/Button';

export default function AuthForm({ mode, onSubmit, error }) {
  const isLogin = mode === 'login';
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    if (!isLogin && values.name.trim().length < 2) return setFormError('Name must be at least 2 characters.');
    if (!values.email.includes('@')) return setFormError('Enter a valid email address.');
    if (values.password.length < (isLogin ? 1 : 8)) return setFormError(isLogin ? 'Enter your password.' : 'Password must be at least 8 characters.');
    setSubmitting(true);
    try { await onSubmit(values); } catch (requestError) {
      setFormError(requestError.response?.data?.message || 'Authentication failed. Please try again.');
    } finally { setSubmitting(false); }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {!isLogin && <label>Full name<input name="name" value={values.name} onChange={update} autoComplete="name" /></label>}
      <label>Email address<input name="email" type="email" value={values.email} onChange={update} autoComplete="email" /></label>
      <label>Password<input name="password" type="password" value={values.password} onChange={update} autoComplete={isLogin ? 'current-password' : 'new-password'} /></label>
      {(formError || error) && <p className="form-error" role="alert">{formError || error}</p>}
      <Button type="submit" disabled={submitting}>{submitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}</Button>
    </form>
  );
}

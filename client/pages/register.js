import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { register } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { const form = event.currentTarget; const { data } = await register({ name: form.name.value, email: form.email.value, password: form.password.value }); setSession(data); await router.push('/dashboard'); } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to create your account right now.'); } finally { setLoading(false); } };
  return <main className="auth-page"><Link className="back-link" href="/"><ArrowLeft size={16} /> Agentflow</Link><div className="auth-panel"><p className="eyebrow">Start operating</p><h1>Build your command center.</h1><p className="muted">Create an account and turn your first idea into a flow.</p><form onSubmit={submit}><label>Your name<input name="name" type="text" placeholder="Alex Morgan" required /></label><label>Work email<input name="email" type="email" placeholder="you@company.com" required /></label><label>Password<input name="password" type="password" placeholder="At least 8 characters" minLength="8" required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit" disabled={loading}>{loading ? 'Creating workspace...' : 'Create workspace'} <ArrowRight size={17} /></button></form><p className="switch">Already have access? <Link href="/login">Sign in</Link></p></div></main>;
}

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { login } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { const { data } = await login({ email: event.currentTarget.email.value, password: event.currentTarget.password.value }); setSession(data); await router.push('/dashboard'); } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to sign in right now.'); } finally { setLoading(false); } };
  return <main className="auth-page"><Link className="back-link" href="/"><ArrowLeft size={16} /> Agentflow</Link><div className="auth-panel"><p className="eyebrow">Operator access</p><h1>Welcome back.</h1><p className="muted">Sign in to continue to your operations console.</p><form onSubmit={submit}><label>Email address<input name="email" type="email" placeholder="you@company.com" required /></label><label>Password<input name="password" type="password" placeholder="••••••••" required /></label><div className="form-meta"><label className="check"><input type="checkbox" /> Remember me</label><a href="#">Forgot password?</a></div>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Enter console'} <ArrowRight size={17} /></button></form><p className="switch">New to Agentflow? <Link href="/register">Create an account</Link></p></div></main>;
}

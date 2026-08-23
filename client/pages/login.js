import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Login() {
  return <main className="auth-page"><Link className="back-link" href="/"><ArrowLeft size={16} /> Agentflow</Link><div className="auth-panel"><p className="eyebrow">Operator access</p><h1>Welcome back.</h1><p className="muted">Sign in to continue to your operations console.</p><form><label>Email address<input type="email" placeholder="you@company.com" required /></label><label>Password<input type="password" placeholder="••••••••" required /></label><div className="form-meta"><label className="check"><input type="checkbox" /> Remember me</label><a href="#">Forgot password?</a></div><button className="primary-button" type="submit">Enter console <ArrowRight size={17} /></button></form><p className="switch">New to Agentflow? <Link href="/register">Create an account</Link></p></div></main>;
}

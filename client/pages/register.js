import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Register() {
  return <main className="auth-page"><Link className="back-link" href="/"><ArrowLeft size={16} /> Agentflow</Link><div className="auth-panel"><p className="eyebrow">Start operating</p><h1>Build your command center.</h1><p className="muted">Create an account and turn your first idea into a flow.</p><form><label>Your name<input type="text" placeholder="Alex Morgan" required /></label><label>Work email<input type="email" placeholder="you@company.com" required /></label><label>Password<input type="password" placeholder="At least 8 characters" minLength="8" required /></label><button className="primary-button" type="submit">Create workspace <ArrowRight size={17} /></button></form><p className="switch">Already have access? <Link href="/login">Sign in</Link></p></div></main>;
}

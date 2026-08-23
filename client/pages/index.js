import Link from 'next/link';
import { ArrowUpRight, Bot, GitBranch, Play, ShieldCheck, Sparkles } from 'lucide-react';

const signals = [
  ['01', 'Describe', 'Tell Agentflow what should happen in plain language.'],
  ['02', 'Compose', 'Watch an executable workflow take shape on the canvas.'],
  ['03', 'Operate', 'Run it with a transparent trail of every agent decision.']
];

export default function Home() {
  return (
    <main className="landing">
      <nav className="topbar">
        <Link className="brand" href="/">AGENTFLOW<span>.AI</span></Link>
        <div className="nav-links"><Link href="/login">Sign in</Link><Link className="nav-cta" href="/register">Open console <ArrowUpRight size={16} /></Link></div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="pulse" /> Autonomous operations, visibly controlled</p>
          <h1>Make work<br /><em>flow</em> itself.</h1>
          <p className="hero-text">Turn a sentence into a living automation. Agentflow coordinates planning, execution, validation, and recovery while your team stays in command.</p>
          <div className="hero-actions"><Link className="primary-button" href="/register">Build your first flow <ArrowUpRight size={18} /></Link><Link className="text-link" href="/login">View the console <span>→</span></Link></div>
        </div>
        <div className="hero-visual" aria-label="Multi-agent workflow preview">
          <div className="visual-label">LIVE ORCHESTRATION <span>●</span></div>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="core"><Bot size={27} /><strong>Agentflow</strong><small>orchestrator</small></div>
          <div className="agent agent-a"><span><Sparkles size={14} /></span><b>Planner</b><small>mapping intent</small></div>
          <div className="agent agent-b"><span><Play size={14} /></span><b>Executor</b><small>running actions</small></div>
          <div className="agent agent-c"><span><ShieldCheck size={14} /></span><b>Validator</b><small>checking output</small></div>
          <div className="visual-footer"><GitBranch size={15} /> 4 agents collaborating <span>● connected</span></div>
        </div>
      </section>
      <section className="signals">{signals.map(([number, title, copy]) => <div className="signal" key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></div>)}</section>
    </main>
  );
}

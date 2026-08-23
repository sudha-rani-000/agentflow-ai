import Link from 'next/link';
import { Activity, Bell, Boxes, ChevronDown, LayoutDashboard, Settings, Workflow } from 'lucide-react';

export default function AppShell({ children, active = 'dashboard' }) {
  const links = [['dashboard', 'Dashboard', LayoutDashboard, '/dashboard'], ['workflows', 'Workflows', Workflow, '/workflows'], ['executions', 'Executions', Activity, '/executions'], ['integrations', 'Integrations', Boxes, '/integrations']];
  return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/">AGENTFLOW<span>.AI</span></Link><p className="side-label">Workspace</p><nav>{links.map(([id, label, Icon, href]) => <Link className={active === id ? 'side-link active' : 'side-link'} href={href} key={id}><Icon size={17} />{label}</Link>)}</nav><div className="side-bottom"><Link className="side-link" href="/settings"><Settings size={17} />Settings</Link><button className="profile"><span>AM</span><div><b>Alex Morgan</b><small>Operator</small></div><ChevronDown size={14} /></button></div></aside><section className="main-shell"><header className="app-header"><div><span className="crumb">Workspace /</span><strong>{active[0].toUpperCase() + active.slice(1)}</strong></div><button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button></header>{children}</section></div>;
}

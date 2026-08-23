import Link from 'next/link';
import { ArrowUpRight, Plus, Search, Workflow } from 'lucide-react';
import AppShell from '../../components/AppShell';
import { useWorkflowStore } from '../../store/workflowStore';

export default function Workflows() {
  const workflows = useWorkflowStore((state) => state.workflows);
  return <AppShell active="workflows"><main className="dashboard-page"><div className="page-heading"><div><p className="eyebrow">Automation library</p><h1>Your workflows.</h1><p className="muted">Design, monitor, and improve every operation from one place.</p></div><Link className="primary-button" href="/workflows/builder"><Plus size={17} /> Create workflow</Link></div><div className="list-toolbar"><div className="search"><Search size={16} /><input placeholder="Search workflows" /></div><span>{workflows.length} workflows</span></div><div className="workflow-list">{workflows.map((workflow) => <Link className="workflow-row" href={`/workflows/${workflow.id}`} key={workflow.id}><span className="workflow-icon"><Workflow size={18} /></span><div className="workflow-name"><strong>{workflow.name}</strong><small>{workflow.description}</small></div><span className={`status ${workflow.status}`}>{workflow.status}</span><span className="row-stat">{workflow.nodes} nodes</span><span className="row-stat">{workflow.runs} runs</span><span className="updated">Edited {workflow.updated}</span><ArrowUpRight size={16} /></Link>)}</div></main></AppShell>;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const starterWorkflows = [
  { id: 'invoice-routing', name: 'Invoice routing', description: 'Classify invoices and route them to the right team.', status: 'active', nodes: 6, runs: 128, success: 96, updated: '12 min ago' },
  { id: 'support-digest', name: 'Support digest', description: 'Summarize priority tickets into a daily Slack brief.', status: 'draft', nodes: 4, runs: 0, success: 0, updated: 'Yesterday' },
  { id: 'new-lead-alert', name: 'New lead alert', description: 'Notify the sales room when a qualified lead arrives.', status: 'active', nodes: 5, runs: 84, success: 99, updated: '2 days ago' }
];

export const useWorkflowStore = create(persist((set) => ({
  workflows: starterWorkflows,
  addWorkflow: (workflow) => set((state) => ({ workflows: [workflow, ...state.workflows] })),
  deleteWorkflow: (id) => set((state) => ({ workflows: state.workflows.filter((workflow) => workflow.id !== id) }))
}), { name: 'agentflow-workflows' }));

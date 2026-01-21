'use client';

import KanbanBoard from '@/components/ui/kanban-board';

export default function KanbanDemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-6">
      <KanbanBoard />
    </div>
  );
}

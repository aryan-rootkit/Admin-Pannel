'use client';

import IncidentReportCard from '@/components/ui/area-chart-1';

export default function AreaChartDemoPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-300">
      <IncidentReportCard />
    </div>
  );
}

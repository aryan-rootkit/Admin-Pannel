import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Light Mode Stat Card Component
 * Readable colors, proper contrast
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  iconBg?: 'blue' | 'green' | 'orange' | 'slate';
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle,
  iconBg = 'blue'
}: StatCardProps) {
  const iconBgClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    slate: 'bg-slate-700',
  };

  return (
    <div className="card-premium card-premium-hover p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${iconBgClasses[iconBg]} rounded-xl shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}

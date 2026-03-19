'use client';

import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Globe2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface HolidayItem {
  id: string;
  name: string;
  description?: string;
  date: string;
  country: string;
  type: string;
}

interface ApiResponse {
  country: string;
  year: number;
  count: number;
  holidays: HolidayItem[];
}

const COUNTRY_OPTIONS = [
  { code: 'IN', label: 'India' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
];

export default function HolidaysWidget() {
  const currentYear = new Date().getFullYear();
  const [country, setCountry] = useState('IN');
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = async (c: string, y: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/holidays?country=${encodeURIComponent(c)}&year=${y}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load holidays');
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err: any) {
      console.error('HolidaysWidget error:', err);
      setError(err.message || 'Failed to load holidays');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(country, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCountry(value);
    fetchHolidays(value, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setYear(value);
    fetchHolidays(country, value);
  };

  const holidays = data?.holidays ?? [];
  const topHolidays = holidays.slice(0, 5);

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <CalendarIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Public Holidays</h3>
            <p className="text-xs text-slate-500">
              Synced via Calendarific ({country}-{year})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
            <Globe2 className="w-3 h-3 text-slate-500" />
            <select
              value={country}
              onChange={handleCountryChange}
              className="bg-transparent text-xs text-slate-700 focus:outline-none"
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={year}
            onChange={handleYearChange}
            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-2.5 bg-slate-100 rounded" />
          <div className="h-2.5 bg-slate-100 rounded w-10/12" />
          <div className="h-2.5 bg-slate-100 rounded w-8/12" />
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && holidays.length === 0 && (
        <p className="text-xs text-slate-500">
          No holidays found for this selection.
        </p>
      )}

      {!loading && !error && holidays.length > 0 && (
        <ul className="space-y-1.5">
          {topHolidays.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{h.name}</p>
                {h.description && (
                  <p className="text-[11px] text-slate-500 truncate">{h.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] font-medium text-slate-700">
                  {formatDate(h.date)}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {h.type}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


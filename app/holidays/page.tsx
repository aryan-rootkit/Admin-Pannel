'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Calendar as CalendarIcon } from 'lucide-react';
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

export default function HolidaysPage() {
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
      console.error('HolidaysPage error:', err);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl py-4 px-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Public Holidays</h1>
              <p className="text-xs text-slate-500">
                Synced from Calendarific. Filter by country and year.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={country}
              onChange={handleCountryChange}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={handleYearChange}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {loading && (
            <div className="p-6 space-y-2">
              <div className="h-3 bg-slate-100 rounded" />
              <div className="h-3 bg-slate-100 rounded w-11/12" />
              <div className="h-3 bg-slate-100 rounded w-9/12" />
            </div>
          )}

          {!loading && error && (
            <div className="p-6">
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && holidays.length === 0 && (
            <div className="p-6">
              <p className="text-sm text-slate-500">
                No holidays found for this selection.
              </p>
            </div>
          )}

          {!loading && !error && holidays.length > 0 && (
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h) => (
                    <tr key={h.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 text-slate-800 whitespace-nowrap">
                        {formatDate(h.date)}
                      </td>
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {h.name}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {h.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {h.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, AlertCircle, Database, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { localStorageUtils } from '@/lib/localStorage';

interface MigrationResults {
  clients: { created: number; skipped: number; errors: any[] };
  projects: { created: number; skipped: number; errors: any[] };
  team: { created: number; skipped: number; errors: any[] };
  revenue: { created: number; skipped: number; errors: any[] };
  events: { created: number; skipped: number; errors: any[] };
}

export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [dataSummary, setDataSummary] = useState<{
    clients: number;
    projects: number;
    team: number;
    revenue: number;
    events: number;
  } | null>(null);

  // Check localStorage data
  const checkLocalStorageData = () => {
    if (typeof window === 'undefined') return;

    const clients = localStorageUtils.getClients();
    const projects = localStorageUtils.getProjects();
    const team = localStorageUtils.getTeam();
    const revenue = localStorageUtils.getRevenue();
    const events = localStorageUtils.getEvents();

    // Also check for expenses in localStorage
    let expenses: any[] = [];
    try {
      const expensesData = localStorage.getItem('rootkit_expenses');
      if (expensesData) {
        expenses = JSON.parse(expensesData);
      }
    } catch (e) {
      console.error('Error parsing expenses:', e);
    }

    // Merge expenses into revenue (as type 'expense')
    const allRevenue = [
      ...revenue,
      ...expenses.map((exp: any) => ({
        ...exp,
        type: 'expense',
      })),
    ];

    setDataSummary({
      clients: clients.length,
      projects: projects.length,
      team: team.length,
      revenue: allRevenue.length,
      events: events.length,
    });

    return {
      clients,
      projects,
      team,
      revenue: allRevenue,
      events,
    };
  };

  const handleMigrate = async () => {
    setLoading(true);
    setResults(null);

    try {
      // Get data from localStorage
      const data = checkLocalStorageData();
      if (!data) {
        toast('No data found in localStorage', 'error');
        setLoading(false);
        return;
      }

      // Check if there's any data to migrate
      const totalItems =
        data.clients.length +
        data.projects.length +
        data.team.length +
        data.revenue.length +
        data.events.length;

      if (totalItems === 0) {
        toast('No data found to migrate', 'error');
        setLoading(false);
        return;
      }

      // Send to migration API
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.results);
        toast('Migration completed successfully!', 'success');

        // Optionally clear localStorage after successful migration
        // Uncomment if you want to clear localStorage after migration
        // localStorage.removeItem('rootkit_clients');
        // localStorage.removeItem('rootkit_projects');
        // localStorage.removeItem('rootkit_team');
        // localStorage.removeItem('rootkit_revenue');
        // localStorage.removeItem('rootkit_events');
        // localStorage.removeItem('rootkit_expenses');
      } else {
        toast(result.error || 'Migration failed', 'error');
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast(error.message || 'An error occurred during migration', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check data on component mount
  useEffect(() => {
    checkLocalStorageData();
  }, []);

  const totalCreated =
    results &&
    results.clients.created +
      results.projects.created +
      results.team.created +
      results.revenue.created +
      results.events.created;

  const totalSkipped =
    results &&
    results.clients.skipped +
      results.projects.skipped +
      results.team.skipped +
      results.revenue.skipped +
      results.events.skipped;

  const totalErrors =
    results &&
    results.clients.errors.length +
      results.projects.errors.length +
      results.team.errors.length +
      results.revenue.errors.length +
      results.events.errors.length;

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="bg-white rounded-xl py-4 px-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Data Migration</h1>
              <p className="text-sm text-slate-600 mt-1">
                Migrate your localStorage data to MongoDB
              </p>
            </div>
            <Database className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        {/* Data Summary */}
        {dataSummary && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">LocalStorage Data Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{dataSummary.clients}</div>
                <div className="text-sm text-slate-600">Clients</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{dataSummary.projects}</div>
                <div className="text-sm text-slate-600">Projects</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{dataSummary.team}</div>
                <div className="text-sm text-slate-600">Team Members</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{dataSummary.revenue}</div>
                <div className="text-sm text-slate-600">Revenue/Expenses</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{dataSummary.events}</div>
                <div className="text-sm text-slate-600">Events</div>
              </div>
            </div>
          </Card>
        )}

        {/* Migration Button */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Start Migration</h2>
              <p className="text-sm text-slate-600">
                This will transfer all your localStorage data to MongoDB. Duplicate entries will be
                skipped.
              </p>
            </div>
            <Button
              onClick={handleMigrate}
              disabled={loading || !dataSummary || (dataSummary && Object.values(dataSummary).every(v => v === 0))}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Start Migration
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {results && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Migration Results</h2>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{totalCreated}</div>
                <div className="text-sm text-green-600">Created</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{totalSkipped}</div>
                <div className="text-sm text-yellow-600">Skipped (Duplicates)</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{totalErrors}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              {/* Clients */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Clients</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      {results.clients.created} created
                    </span>
                    <span className="text-yellow-600">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {results.clients.skipped} skipped
                    </span>
                    {results.clients.errors.length > 0 && (
                      <span className="text-red-600">
                        <XCircle className="h-4 w-4 inline mr-1" />
                        {results.clients.errors.length} errors
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Projects</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      {results.projects.created} created
                    </span>
                    <span className="text-yellow-600">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {results.projects.skipped} skipped
                    </span>
                    {results.projects.errors.length > 0 && (
                      <span className="text-red-600">
                        <XCircle className="h-4 w-4 inline mr-1" />
                        {results.projects.errors.length} errors
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Team Members</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      {results.team.created} created
                    </span>
                    <span className="text-yellow-600">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {results.team.skipped} skipped
                    </span>
                    {results.team.errors.length > 0 && (
                      <span className="text-red-600">
                        <XCircle className="h-4 w-4 inline mr-1" />
                        {results.team.errors.length} errors
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Revenue & Expenses</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      {results.revenue.created} created
                    </span>
                    <span className="text-yellow-600">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {results.revenue.skipped} skipped
                    </span>
                    {results.revenue.errors.length > 0 && (
                      <span className="text-red-600">
                        <XCircle className="h-4 w-4 inline mr-1" />
                        {results.revenue.errors.length} errors
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Events</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      {results.events.created} created
                    </span>
                    <span className="text-yellow-600">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {results.events.skipped} skipped
                    </span>
                    {results.events.errors.length > 0 && (
                      <span className="text-red-600">
                        <XCircle className="h-4 w-4 inline mr-1" />
                        {results.events.errors.length} errors
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

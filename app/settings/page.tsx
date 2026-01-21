'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';

/**
 * Settings Page
 * Configurable agency details, tax rates, invoice settings, and team structure
 */

const settingsSchema = z.object({
  agencyName: z.string().min(1, 'Agency name is required'),
  emailSignature: z.string().min(1, 'Email signature is required'),
  taxRate: z.number().min(0).max(100),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  invoiceNextNumber: z.number().min(1),
  paymentTerms: z.number().min(0),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        reset({
          agencyName: data.agencyName || '',
          emailSignature: data.emailSignature || '',
          taxRate: data.taxRate || 0,
          invoicePrefix: data.invoiceSettings?.prefix || 'INV',
          invoiceNextNumber: data.invoiceSettings?.nextNumber || 1,
          paymentTerms: data.invoiceSettings?.paymentTerms || 30,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: data.agencyName,
          emailSignature: data.emailSignature,
          taxRate: data.taxRate,
          invoiceSettings: {
            prefix: data.invoicePrefix,
            nextNumber: data.invoiceNextNumber,
            paymentTerms: data.paymentTerms,
          },
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="bg-white rounded-xl py-4 px-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Save className="w-5 h-5 text-slate-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-display leading-tight">Settings</h1>
          </div>
          <p className="text-xs text-slate-500 leading-tight">Configure your agency settings and preferences</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Agency Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Agency Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                <input
                  {...register('agencyName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.agencyName && <p className="text-red-600 text-sm mt-1">{errors.agencyName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Signature</label>
                <textarea
                  {...register('emailSignature')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Best regards,&#10;Rootkit Development Team"
                />
                {errors.emailSignature && <p className="text-red-600 text-sm mt-1">{errors.emailSignature.message}</p>}
              </div>
            </div>
          </div>

          {/* Tax & Invoice Settings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax & Invoice Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('taxRate', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.taxRate && <p className="text-red-600 text-sm mt-1">{errors.taxRate.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                  <input
                    {...register('invoicePrefix')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.invoicePrefix && <p className="text-red-600 text-sm mt-1">{errors.invoicePrefix.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Invoice Number</label>
                  <input
                    type="number"
                    {...register('invoiceNextNumber', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.invoiceNextNumber && <p className="text-red-600 text-sm mt-1">{errors.invoiceNextNumber.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
                <input
                  type="number"
                  {...register('paymentTerms', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.paymentTerms && <p className="text-red-600 text-sm mt-1">{errors.paymentTerms.message}</p>}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

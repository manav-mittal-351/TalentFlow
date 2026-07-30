// ─── pages/recruiter/CompanyProfilePage.jsx ──────────────────────────────────
// Recruiter company profile management interface.
// Fetches and updates platform company record via GET/PATCH /api/v1/company.

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Save,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();

  // Initial state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    location: '',
    headcount: '',
    description: '',
  });

  // 1. Fetch Company details
  const {
    data: companyData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: async () => {
      const response = await api.get('/company');
      return response.data?.data;
    },
  });

  // Populate state on load
  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        industry: companyData.industry || '',
        website: companyData.website || '',
        location: companyData.location || '',
        headcount: companyData.headcount || '',
        description: companyData.description || '',
      });
    }
  }, [companyData]);

  // 2. Mutation: Calls PATCH /api/v1/company
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch('/company', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Company details saved.');
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save company details.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Company Profile"
        description="Manage organization details displayed on job postings and public pages."
      />

      {isLoading ? (
        <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 space-y-4 max-w-2xl">
          <Skeleton variant="text" width="200px" height="24px" />
          <Skeleton variant="text" width="100%" height="150px" />
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto my-8">
          <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            We couldn&apos;t load company details
          </h3>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-sm focus-ring"
            type="button"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-3xl my-6 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Organization Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Technology / SaaS"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Website URL</span>
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Headquarters Location</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA / Global"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>

              {/* Headcount */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company Headcount / Size</span>
                </label>
                <input
                  type="text"
                  value={formData.headcount}
                  onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                  placeholder="e.g. 50-200 employees"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Company Overview & Mission
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your company culture, technology stack, and values..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-transform hover:scale-[1.01] focus-ring"
              >
                <Save className="w-4 h-4" />
                <span>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </PageContainer>
  );
}

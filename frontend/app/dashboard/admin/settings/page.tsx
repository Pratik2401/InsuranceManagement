'use client';

import React from 'react';
import { Loader2, RefreshCcw, Save, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

type AdminSetting = {
  id: number;
  settingKey: string;
  settingValue: string;
  category: string;
  description?: string;
  updatedAt?: string;
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<AdminSetting[]>([]);

  const isAdmin = user?.role === 'admin';

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings');
      setSettings((response.data || []) as AdminSetting[]);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Unable to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin, loadSettings]);

  const updateSetting = (id: number, field: keyof AdminSetting, value: string) => {
    setSettings((prev) => prev.map((setting) => (setting.id === id ? { ...setting, [field]: value } : setting)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        settings: settings.map((setting) => ({
          settingKey: setting.settingKey,
          settingValue: setting.settingValue,
          category: setting.category,
          description: setting.description || '',
        })),
      });
      toast.success('Settings saved successfully.');
      await loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="dash-card" style={{ maxWidth: 720, margin: '2rem auto' }}>
        <p className="fs-4 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Admin access required</p>
        <p className="text-muted-custom mb-0">You do not have permission to edit settings.</p>
      </div>
    );
  }

  const grouped = settings.reduce<Record<string, AdminSetting[]>>((acc, setting) => {
    const key = setting.category || 'general';
    acc[key] = acc[key] || [];
    acc[key].push(setting);
    return acc;
  }, {});

  return (
    <div className="container-fluid px-0">
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>System Settings</h1>
          <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Update operational defaults and system behavior.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm d-inline-flex align-items-center gap-2"
            style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff', border: '1px solid rgba(79, 70, 229, 0.2)', fontWeight: 600 }}
            onClick={loadSettings}
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-sm d-inline-flex align-items-center gap-2"
            style={{ background: '#4F46E5', color: '#fff', fontWeight: 600 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={14} className="auth-spinner" /> : <Save size={14} />}
            Save all
          </button>
        </div>
      </div>

      <div className="dash-card mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff' }}>
            <Settings2 size={18} />
          </div>
          <div>
            <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Editable defaults</p>
            <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>These values are stored in the database and tracked by the audit log.</p>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4">
        {loading ? (
          <div className="col-12">
            <div className="dash-card text-center py-5 text-muted-custom">
              <Loader2 size={18} className="auth-spinner me-2" /> Loading settings...
            </div>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="col-12">
            <div className="dash-card text-center py-5 text-muted-custom">No settings found.</div>
          </div>
        ) : Object.entries(grouped).map(([category, rows]) => (
          <div key={category} className="col-12 col-xl-6">
            <div className="dash-card h-100">
              <p className="fw-bold text-white mb-3" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>{category}</p>
              <div className="d-grid gap-3">
                {rows.map((setting) => (
                  <div key={setting.id} className="dash-card dash-card-elevated">
                    <div className="d-flex flex-column gap-2">
                      <label className="text-muted-custom" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                        {setting.settingKey}
                      </label>
                      <input
                        className="form-control"
                        value={setting.settingValue}
                        onChange={(e) => updateSetting(setting.id, 'settingValue', e.target.value)}
                      />
                      <input
                        className="form-control"
                        value={setting.description || ''}
                        onChange={(e) => updateSetting(setting.id, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

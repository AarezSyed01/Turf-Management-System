import React, { useState } from 'react';
import { FacilitySettings } from '../../types.ts';
import { updateFacilitySettings, seedSampleData } from '../../lib/db.ts';
import {
  getSMSConfig,
  saveSMSConfig,
  getSMSLogs,
  sendBookingConfirmationSMS,
  SMSConfig,
  SMSLogEntry,
} from '../../lib/sms.ts';
import {
  Settings,
  Building,
  CheckCircle2,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  IndianRupee,
  Save,
  MessageSquare,
  Send,
  Radio,
  History,
} from 'lucide-react';

interface SettingsViewProps {
  settings: FacilitySettings;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings }) => {
  // Facility Form State
  const [facilityName, setFacilityName] = useState(settings.facilityName);
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [openingHour, setOpeningHour] = useState(settings.openingHour || 6);
  const [closingHour, setClosingHour] = useState(settings.closingHour || 23);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // SMS Configuration State
  const [smsConfig, setSmsConfig] = useState<SMSConfig>(getSMSConfig());
  const [smsSaveSuccess, setSmsSaveSuccess] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [smsLogs, setSmsLogs] = useState<SMSLogEntry[]>(getSMSLogs());

  // Sample data seeder
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSaveSMSConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSMSConfig(smsConfig);
    setSmsSaveSuccess(true);
    setTimeout(() => setSmsSaveSuccess(false), 3000);
  };

  const handleSendTestSMS = async () => {
    if (!testPhone.trim()) {
      alert('Please enter a phone number to test SMS confirmation.');
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const mockBooking = {
        id: `TEST_${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: 'Test Player',
        customerPhone: testPhone.trim(),
        turfName: 'Main Turf Arena',
        date: new Date().toISOString().split('T')[0],
        startTime: '07:00 PM',
        endTime: '08:00 PM',
        totalAmount: 1000,
        paidAmount: 500,
        pendingAmount: 500,
      };

      const result = await sendBookingConfirmationSMS(mockBooking, settings, smsConfig);
      if (result.success) {
        setTestResult(`✓ Confirmation SMS dispatched! Delivered to ${testPhone.trim()}`);
      } else {
        setTestResult(`⚠️ Dispatch note: ${result.error || 'Failed'}`);
      }
      setSmsLogs(getSMSLogs());
    } catch (err: any) {
      setTestResult(`Failed to send test: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateFacilitySettings({
        facilityName: facilityName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        currencySymbol: currencySymbol.trim() || '₹',
        openingHour: Number(openingHour),
        closingHour: Number(closingHour),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    if (
      !confirm(
        'This will populate sample turfs, slots for today/tomorrow, bookings, and payments. Continue?'
      )
    ) {
      return;
    }
    setIsSeeding(true);
    try {
      await seedSampleData();
      alert('Sample turf facility loaded successfully! Check Dashboard and Slots.');
    } catch (error) {
      console.error(error);
      alert('Failed to seed sample data.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-600" />
          Facility & Operations Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure turf facility metadata, operating hours, currency format, and data setup.
        </p>
      </div>

      {/* Facility Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              Turf Facility Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details appear on dashboard headers and booking receipts.
            </p>
          </div>

          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveFacility} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Facility / Arena Name *
              </label>
              <input
                type="text"
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Owner / Manager Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Aarez Ali"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Facility Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Address & Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Sports Complex, Ring Road, Mumbai"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Opening Hour
              </label>
              <select
                value={openingHour}
                onChange={(e) => setOpeningHour(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const p = i >= 12 ? 'PM' : 'AM';
                  const h = i % 12 === 0 ? 12 : i % 12;
                  return (
                    <option key={i} value={i}>
                      {h}:00 {p}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Closing Hour
              </label>
              <select
                value={closingHour}
                onChange={(e) => setClosingHour(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const p = i >= 12 ? 'PM' : 'AM';
                  const h = i % 12 === 0 ? 12 : i % 12;
                  return (
                    <option key={i} value={i}>
                      {h}:00 {p}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Facility Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SMS Gateway & Booking Notification Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Customer SMS Booking Notifications
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically dispatches SMS confirmations to players when reservations are created.
            </p>
          </div>

          {smsSaveSuccess && (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSMSConfig} className="space-y-4">
          {/* Automatic Send Checkbox */}
          <div className="flex items-start gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
            <input
              type="checkbox"
              id="autoSendOnBooking"
              checked={smsConfig.autoSendOnBooking !== false}
              onChange={(e) =>
                setSmsConfig({ ...smsConfig, autoSendOnBooking: e.target.checked })
              }
              className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="autoSendOnBooking" className="text-xs text-emerald-950 font-medium cursor-pointer">
              <strong className="font-bold text-emerald-900">Auto-Send SMS on New Booking:</strong> When the owner books a slot with the customer's phone number, automatically send a detailed booking confirmation SMS to that phone number.
            </label>
          </div>

          {/* SMS Dispatch Provider Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                SMS Delivery Gateway
              </label>
              <select
                value={smsConfig.provider}
                onChange={(e) =>
                  setSmsConfig({
                    ...smsConfig,
                    provider: e.target.value as SMSConfig['provider'],
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="simulated">Cloud SMS Engine (Instant & Guaranteed)</option>
                <option value="fast2sms">Fast2SMS (Indian Gateway API)</option>
                <option value="custom_webhook">Custom Webhook / SMS API Endpoint</option>
              </select>
            </div>

            {smsConfig.provider === 'fast2sms' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fast2SMS API Key
                </label>
                <input
                  type="password"
                  value={smsConfig.apiKey || ''}
                  onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                  placeholder="Enter Fast2SMS Authorization Key"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            )}

            {smsConfig.provider === 'custom_webhook' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom Webhook URL
                </label>
                <input
                  type="url"
                  value={smsConfig.customEndpoint || ''}
                  onChange={(e) =>
                    setSmsConfig({ ...smsConfig, customEndpoint: e.target.value })
                  }
                  placeholder="https://your-sms-api.com/send"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save SMS Preferences</span>
            </button>
          </div>
        </form>

        {/* Live Test SMS Tool */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600" /> Test SMS Confirmation
            </span>
            <span className="text-[11px] text-slate-500">Live confirmation message preview</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Enter mobile number to test (e.g. 9876543210)"
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSendTestSMS}
              disabled={testSending || !testPhone.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px] shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testSending ? 'Dispatching...' : 'Send Test SMS'}</span>
            </button>
          </div>

          {testResult && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg font-medium">
              {testResult}
            </p>
          )}
        </div>

        {/* Recent SMS Notification History Log */}
        {smsLogs.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" /> Recent SMS Outbox ({smsLogs.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('turf_app_sms_logs_v1');
                  setSmsLogs([]);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {smsLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{log.recipientPhone}</span>
                      <span className="text-slate-500 font-medium">({log.recipientName})</span>
                    </div>
                    <p className="text-slate-600 line-clamp-1 text-[11px] font-mono">
                      {log.messageText.replace(/\n/g, ' • ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Demo Seed Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Seed Sample Data
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Load realistic turfs, slots, bookings with partial/full payments to test the system.
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={isSeeding}
          className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          {isSeeding ? 'Seeding Data...' : '⚡ Seed Demo Data'}
        </button>
      </div>
    </div>
  );
};

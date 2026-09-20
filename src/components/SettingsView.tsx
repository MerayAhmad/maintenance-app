import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SystemSettings } from '../types';
import {
  Settings,
  Building2,
  DollarSign,
  Mail,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Globe,
  Palette,
  Clock,
  Key,
  RotateCcw,
  Sliders,
  AlertTriangle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings, currentUser, updateUser } = useApp();

  const [formData, setFormData] = useState<SystemSettings>({
    companyName: systemSettings.companyName || 'شركة أكبيطرة لصناعة الأدوية البيطرية',
    logoUrl: systemSettings.logoUrl || '',
    themeColor: systemSettings.themeColor || 'emerald',
    language: systemSettings.language || 'ar',
    timezone: systemSettings.timezone || 'Asia/Damascus (GMT+3)',
    dateFormat: systemSettings.dateFormat || 'YYYY-MM-DD',
    pageSize: systemSettings.pageSize || 10,
    currency: systemSettings.currency || 'ليرة سورية (ل.س)',
    adminEmail: systemSettings.adminEmail || 'info@acpetra-pharma.com',
    enableEmailNotifications: systemSettings.enableEmailNotifications ?? true,
    autoBackupIntervalDays: systemSettings.autoBackupIntervalDays ?? 7
  });

  const [activeTab, setActiveTab] = useState<'general' | 'display' | 'notifications' | 'security'>('general');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    setFormData({
      companyName: systemSettings.companyName || 'شركة أكبيطرة لصناعة الأدوية البيطرية',
      logoUrl: systemSettings.logoUrl || '',
      themeColor: systemSettings.themeColor || 'emerald',
      language: systemSettings.language || 'ar',
      timezone: systemSettings.timezone || 'Asia/Damascus (GMT+3)',
      dateFormat: systemSettings.dateFormat || 'YYYY-MM-DD',
      pageSize: systemSettings.pageSize || 10,
      currency: systemSettings.currency || 'ليرة سورية (ل.س)',
      adminEmail: systemSettings.adminEmail || 'info@acpetra-pharma.com',
      enableEmailNotifications: systemSettings.enableEmailNotifications ?? true,
      autoBackupIntervalDays: systemSettings.autoBackupIntervalDays ?? 7
    });
  }, [systemSettings]);

  const handleSubmitAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(formData);
    setSuccessMsg('تمت معالجة وحفظ كافة إعدادات النظام العامة بنجاح وتطبيقها مباشرة.');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!newPass || newPass.length < 4) {
      setPassError('كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
      return;
    }

    if (currentUser) {
      updateUser(currentUser.id, { password: newPass });
      setPassSuccess('تم تغيير كلمة المرور لحسابك بنجاح');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassSuccess(''), 4500);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('هل أنت متأكد من إعادة ضبط الإعدادات العامة للقيم الافتراضية؟')) {
      const defaultSettings: SystemSettings = {
        companyName: 'شركة أكبيطرة لصناعة الأدوية البيطرية',
        logoUrl: '',
        themeColor: 'emerald',
        language: 'ar',
        timezone: 'Asia/Damascus (GMT+3)',
        dateFormat: 'YYYY-MM-DD',
        pageSize: 10,
        currency: 'ليرة سورية (ل.س)',
        adminEmail: 'info@acpetra-pharma.com',
        enableEmailNotifications: true,
        autoBackupIntervalDays: 7
      };
      setFormData(defaultSettings);
      updateSystemSettings(defaultSettings);
      setSuccessMsg('تمت إعادة ضبط إعدادات النظام للقيم الافتراضية');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            إعدادات النظام العامة (System Configuration)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            التحكم بهوية الشركة، العملات التجميعية، البريد التنبيهي، تفضيلات النظام، وتعديل كلمات المرور
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>إعادة التعيين للافتراضي</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-white p-2 rounded-2xl shadow-xs overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'general' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>هوية الشركة والبيانات العامة</span>
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'display' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>العرض والتوقيت واللغة</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>التنبيهات والنسخ الاحتياطي</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>تغيير كلمة المرور الشخصية</span>
        </button>
      </div>

      {/* Tab 1, 2, 3: System Settings Form */}
      {activeTab !== 'security' && (
        <form onSubmit={handleSubmitAllSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-6">
          
          {/* Section 1: General Identity */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  بيانات هوية المنشأة والتقارير
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  هذه البيانات تظهر في رأس التقارير، صفحة الدخول، وجداول النظام.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-medium">
                
                {/* اسم الشركة */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1.5">
                    اسم الشركة / المنشأة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* العملة المستخدمة */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    العملة المعتمدة في النظام والتقارير <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ليرة سورية (ل.س)، دولار ($)"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* البريد التنبيهي */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-amber-600" />
                    البريد الإلكتروني الرئيسي للإشعارات <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold dir-ltr text-right focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* رابط الشعار */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1.5">رابط الشعار أو الصورة (Logo URL)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold dir-ltr text-right focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

              </div>
            </div>
          )}

          {/* Section 2: Display & Timezone */}
          {activeTab === 'display' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  تفضيلات العرض، اللغة والمظاهر
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-medium">
                
                {/* اللون السائد */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">اللون السائد للتطبيق (Theme Color)</label>
                  <select
                    value={formData.themeColor}
                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
                  >
                    <option value="emerald">Emerald - أخضر زمردي دواء (افتراضي)</option>
                    <option value="blue">Blue - أزرق قياسي</option>
                    <option value="teal">Teal - تركوازي صناعي</option>
                    <option value="indigo">Indigo - نيلي فاخر</option>
                    <option value="amber">Amber - كهرومغناطيسي</option>
                  </select>
                </div>

                {/* لغة الواجهة */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    لغة واجهة النظام
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
                  >
                    <option value="ar">العربية (Arabic - RTL)</option>
                    <option value="en">English (الإنجليزية - LTR)</option>
                  </select>
                </div>

                {/* التوقيت المحلي */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    المنطقة الزمنية (Timezone)
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
                  >
                    <option value="Asia/Damascus (GMT+3)">Asia/Damascus (GMT+3 - دمشق)</option>
                    <option value="Asia/Riyadh (GMT+3)">Asia/Riyadh (GMT+3 - الرياض)</option>
                    <option value="Africa/Cairo (GMT+3)">Africa/Cairo (GMT+3 - القاهرة)</option>
                    <option value="UTC (GMT+0)">UTC (الوقت العالمي)</option>
                  </select>
                </div>

                {/* صيغة التاريخ */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">صيغة تنسيق التاريخ (Date Format)</label>
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-04)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (04/08/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (08/04/2026)</option>
                  </select>
                </div>

                {/* عدد العناصر بالجداول */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">عدد السجلات المعروضة في كل صفحة جدول</label>
                  <select
                    value={formData.pageSize}
                    onChange={(e) => setFormData({ ...formData, pageSize: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
                  >
                    <option value={5}>5 سجلات</option>
                    <option value={10}>10 سجلات</option>
                    <option value={20}>20 سجل</option>
                    <option value={50}>50 سجل</option>
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* Section 3: Notifications & Security options */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  إعدادات التنبيهات الذكية والأمان الدوري
                </h3>
              </div>

              <div className="space-y-4 text-xs font-medium">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableEmailNotifications}
                      onChange={(e) => setFormData({ ...formData, enableEmailNotifications: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-900 text-xs">
                      تفعيل إرسال إشعارات البريد التنبيهية فوراً عند حدوث أعطال طارئة أو نقص قطع الغيار
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 pr-7">
                    عند اختيار هذا الخيار يتم إرسال إشعار تلقائي للبريد المسجل ({formData.adminEmail}) فور نزول أي قطعة غيار تحت الحد الأدنى.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block font-bold text-slate-900 text-xs mb-1">
                    الفاصل الزمني للتذكير بالنسخ الاحتياطي الدوري:
                  </label>
                  <select
                    value={formData.autoBackupIntervalDays}
                    onChange={(e) => setFormData({ ...formData, autoBackupIntervalDays: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
                  >
                    <option value={1}>تذكير يومي بالنسخ الاحتياطي</option>
                    <option value={7}>تذكير أسبوعي (كل 7 أيام)</option>
                    <option value={30}>تذكير شهري (كل 30 يوم)</option>
                    <option value={0}>تعطيل التذكير التلقائي</option>
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              سيتم حفظ وتحديث الإعدادات مباشرة في ذاكرة النظام الحية.
            </span>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق الإعدادات الحالية</span>
            </button>
          </div>

        </form>
      )}

      {/* Tab 4: Change Personal Password */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-6 animate-in fade-in">
          
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              تعديل كلمة المرور للحساب الحالي
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              الحساب الحالي: <span className="font-bold text-slate-800">{currentUser?.name || 'مدير النظام'}</span> ({currentUser?.username || 'admin'})
            </p>
          </div>

          {passSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs font-medium">
            
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">كلمة المرور الجديدة <span className="text-rose-500">*</span></label>
              <input
                type="password"
                required
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">تأكيد كلمة المرور الجديدة <span className="text-rose-500">*</span></label>
              <input
                type="password"
                required
                placeholder="أعد إدخال كلمة المرور الجديدة"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>حفظ كلمة المرور الجديدة</span>
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
};

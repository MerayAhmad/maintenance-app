import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Download, Upload, RefreshCw, CheckCircle2, ShieldAlert, FileCode } from 'lucide-react';
import { generateSqlDump } from '../utils/sqlExporter';

export const BackupView: React.FC = () => {
  const {
    departments,
    users,
    assets,
    requests,
    technicians,
    deviceTypes,
    faultTypes,
    restoreBackupData,
    resetToInitialData
  } = useApp();

  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Download Backup JSON file
  const handleDownloadBackup = () => {
    const fullBackupObject = {
      app: 'CMMS Maintenance System',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        departments,
        users,
        assets,
        requests,
        technicians,
        deviceTypes,
        faultTypes
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackupObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cmms_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg('تم تصدير وتحميل ملف النسخة الاحتياطية JSON بنجاح');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Download SQL Script (.sql)
  const handleDownloadSqlDump = () => {
    const sqlContent = generateSqlDump({
      departments,
      users,
      assets,
      requests,
      technicians,
      deviceTypes,
      faultTypes
    });

    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `cmms_database_dump_${new Date().toISOString().slice(0, 10)}.sql`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    setSuccessMsg('تم توليد وتحميل ملف قاعدة البيانات SQL (.sql) بنجاح! جاهز للاستيراد في أي سيرفر قاعدة بيانات.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Upload JSON File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        if (event.target?.result) {
          setRestoreJsonText(event.target.result as string);
        }
      };
    }
  };

  // Restore JSON Data
  const handleExecuteRestore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const parsed = JSON.parse(restoreJsonText);
      const dataToRestore = parsed.data || parsed;

      if (!dataToRestore.departments || !dataToRestore.assets || !dataToRestore.requests) {
        throw new Error('الملف المرفوع لا يحوي البنية الصحيحة لبيانات النظام');
      }

      restoreBackupData(dataToRestore);
      setRestoreJsonText('');
      setSuccessMsg('تمت استعادة كافة بيانات النظام بنجاح من ملف النسخة الاحتياطية');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تحليل ملف النسخة الاحتياطية JSON');
    }
  };

  // Reset System to Factory Seed
  const handleFactoryReset = () => {
    if (confirm('تنبيه هام جداً: هل أنت متأكد من إعادة ضبط المصنع؟ سيتم مسح التغييرات وإعادة استعادة البيانات الأولية.')) {
      resetToInitialData();
      setSuccessMsg('تمت إعادة ضبط النظام للبيانات الأولية الافتراضية بنجاح');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          النسخ الاحتياطي واستعادة البيانات (Backup & Restore)
        </h2>
        <p className="text-xs text-slate-500">
          تصدير النسخة الاحتياطية الكاملة لجميع الأقسام، المستخدمين، الأصول، الطلبات، وسجلات الصيانة واستعادتها بضغطة زر
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1- Export Backup Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">1. تنزيل نسخة احتياطية كاملة (JSON Export)</h3>
              <p className="text-xs text-slate-500 mt-1">
                تنزيل ملف بصيغة JSON يشمل كافة بيانات قاعدة بيانات النظام الحالية للأمان وأخذ الأرشيف الاحتياطي
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 block">إحصائيات النسخة الحالية:</span>
            <ul className="grid grid-cols-2 gap-1 text-slate-600 font-medium">
              <li>• الأقسام: {departments.length}</li>
              <li>• الأصول والآلات: {assets.length}</li>
              <li>• المستخدمين: {users.length}</li>
              <li>• الفنيين: {technicians.length}</li>
              <li>• طلبات الصيانة: {requests.length}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleDownloadSqlDump}
              className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>تنزيل قاعدة البيانات SQL كاملة (.SQL Script)</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل نسخة احتياطية JSON (.JSON)</span>
            </button>
          </div>
        </div>

        {/* 2- Restore Backup Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">2. استعادة البيانات من ملف (JSON Restore)</h3>
              <p className="text-xs text-slate-500 mt-1">
                رفع ملف احتياطي سابق لاسترجاع كافة البيانات والسجلات للنظام
              </p>
            </div>
          </div>

          <form onSubmit={handleExecuteRestore} className="space-y-3 text-xs font-medium">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اختر ملف JSON من جهازك:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-700 bg-slate-50"
              />
            </div>

            {restoreJsonText && (
              <div>
                <label className="block text-slate-700 font-bold mb-1">معاينة محتوى الملف:</label>
                <textarea
                  rows={3}
                  readOnly
                  value={restoreJsonText.slice(0, 300) + '...'}
                  className="w-full border border-slate-200 rounded-xl p-2 font-mono text-[10px] bg-slate-100 text-slate-600 dir-ltr text-left"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!restoreJsonText}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>تنفيذ الاستعادة وإعادة تشغيل البيانات</span>
            </button>
          </form>
        </div>

      </div>

      {/* Factory Reset Danger Zone */}
      <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            منطقة الخطر: إعادة ضبط المصنع (Reset System Seed)
          </h3>
          <p className="text-xs text-rose-700 mt-0.5 font-medium">
            سيتم مسح كافة البيانات المضافة حالياً وإعادة النظام إلى البيانات النموذجية الأولى
          </p>
        </div>

        <button
          onClick={handleFactoryReset}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة ضبط المصنع</span>
        </button>
      </div>

    </div>
  );
};

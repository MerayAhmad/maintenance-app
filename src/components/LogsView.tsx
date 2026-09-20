import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, User, Clock, Filter, ShieldCheck, Database, FileText } from 'lucide-react';

export const LogsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const actionLabels: Record<string, { label: string; bg: string }> = {
    CREATE: { label: 'إضافة (Create)', bg: 'bg-emerald-100 text-emerald-800' },
    UPDATE: { label: 'تعديل (Update)', bg: 'bg-blue-100 text-blue-800' },
    DELETE: { label: 'حذف (Delete)', bg: 'bg-rose-100 text-rose-800' },
    WORKFLOW: { label: 'سير عمل (Workflow)', bg: 'bg-amber-100 text-amber-800' },
    AUTH: { label: 'دخول (Auth)', bg: 'bg-purple-100 text-purple-800' }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          سجل الحركات والأنشطة الأمني (Audit Log & Operations History)
        </h2>
        <p className="text-xs text-slate-500">
          تتبع دقيق لكافة عمليات الإضافة، التعديل، الحذف، وتغييرات أذونات النظام مع توقيع اسم المستخدم والزمن بالدقيقة
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="ابحث باسم المستخدم، الوحدة، أو التفاصيل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
          >
            <option value="">جميع أنواع الأنشطة</option>
            <option value="CREATE">إضافة جديد</option>
            <option value="UPDATE">تعديل بيانات</option>
            <option value="DELETE">حذف</option>
            <option value="WORKFLOW">تغيير حالة طلب صيانة</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-xs flex items-center justify-between">
          <span>سجلات الحركات المسجلة ({filteredLogs.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">يتم التوثيق الحقيقي التلقائي مع كل إجراء بالنظام</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pr-5">التاريخ والوقت</th>
                <th className="p-3.5">المستخدم</th>
                <th className="p-3.5">الدور</th>
                <th className="p-3.5">نوع العملية</th>
                <th className="p-3.5">الوحدة (Module)</th>
                <th className="p-3.5 pl-5">التفاصيل والتغييرات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 pr-5 font-mono text-slate-600 dir-ltr text-right text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{log.userName}</td>
                  <td className="p-3.5 text-slate-600 text-[11px]">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold">{log.userRole}</span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${actionLabels[log.action]?.bg || 'bg-slate-100 text-slate-700'}`}>
                      {actionLabels[log.action]?.label || log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-blue-700">{log.module}</td>
                  <td className="p-3.5 pl-5 text-slate-700 font-semibold">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

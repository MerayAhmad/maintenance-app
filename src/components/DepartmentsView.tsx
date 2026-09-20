import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Department } from '../types';
import { Building2, Plus, Edit2, Trash2, Calendar, Hash, Users, Box, CheckCircle2, UserCheck } from 'lucide-react';

export const DepartmentsView: React.FC = () => {
  const { departments, users, assets, addDepartment, updateDepartment, deleteDepartment, subView, setSubView } = useApp();

  const [deptName, setDeptName] = useState('');
  const [deptManager, setDeptManager] = useState('');
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Calculate live counts
  const getUserCount = (deptId: string, deptName: string) => {
    return users.filter(u => u.departmentId === deptId || u.departmentName === deptName).length;
  };

  const getAssetCount = (deptId: string, deptName: string) => {
    return assets.filter(a => a.departmentId === deptId || a.departmentName === deptName).length;
  };

  const totalUsersAcrossDepts = users.length;
  const totalAssetsAcrossDepts = assets.length;

  // Next Auto Department ID
  const nextAutoId = `DEPT-${departments.length + 101}`;
  const currentDate = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    const created = addDepartment(deptName.trim(), deptManager.trim());
    setDeptName('');
    setDeptManager('');
    setSuccessMsg(`تم إضافة القسم (${created.name}) بنجاح بالرقم ${created.id}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name.trim()) return;
    updateDepartment(editingDept.id, editingDept.name.trim(), editingDept.managerName?.trim() || '');
    setEditingDept(null);
    setSuccessMsg('تم تعديل بيانات القسم بنجاح');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            إدارة أقسام الشركة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة الأقسام الإدارية والإنتاجية، واستعراض تفاصيلها كاملة
          </p>
        </div>

        {/* Subview Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl text-sm sm:text-base font-bold gap-1">
          <button
            onClick={() => setSubView('add')}
            className={`px-4.5 py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'add' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            + إضافة قسم جديد
          </button>
          <button
            onClick={() => setSubView('view')}
            className={`px-4.5 py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'view' || !subView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            الأقسام الموجودة ({departments.length})
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي عدد الأقسام</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{departments.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي المستخدمين بالأقسام</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{totalUsersAcrossDepts}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي الأصول والآلات</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{totalAssetsAcrossDepts}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Box className="w-5 h-5" />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1- Subview: إضافة قسم جديد */}
      {subView === 'add' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              نموذج إضافة قسم جديد
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يتولد رقم القسم وتاريخ الإدخال أوتوماتيكياً عند الحفظ
            </p>
          </div>

          <form onSubmit={handleSubmitNew} className="space-y-4 text-sm font-semibold">
            
            {/* رقم القسم (يتولد بشكل أوتوماتيكي) */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 flex items-center gap-1.5 text-sm sm:text-base">
                <Hash className="w-4 h-4 text-slate-500" />
                رقم القسم (يتولد بشكل أوتوماتيكي)
              </label>
              <input
                type="text"
                value={nextAutoId}
                disabled
                className="w-full bg-slate-100 border-2 border-slate-300 rounded-xl px-4 py-2.5 font-mono text-slate-700 cursor-not-allowed font-bold text-base"
              />
            </div>

            {/* اسم القسم */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 text-sm sm:text-base">
                اسم القسم <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: قسم الجودة والتفتيش، قسم خطوط التعبئة..."
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-bold text-base bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* مدير القسم (غير إجباري - اختياري) */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 flex items-center justify-between text-sm sm:text-base">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  مدير القسم
                </span>
                <span className="text-xs font-normal text-slate-500">(اختياري - غير إجباري)</span>
              </label>
              <input
                type="text"
                placeholder="اسم مدير القسم (مثال: الأستاذ محمد زغموت، علاء بطحيش...)"
                value={deptManager}
                onChange={(e) => setDeptManager(e.target.value)}
                className="w-full border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-bold text-base bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* تاريخ الإدخال (يتولد بشكل أوتوماتيكي) */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 flex items-center gap-1.5 text-sm sm:text-base">
                <Calendar className="w-4 h-4 text-slate-500" />
                تاريخ الإدخال (أوتوماتيكي عند الحفظ)
              </label>
              <input
                type="text"
                value={currentDate}
                disabled
                className="w-full bg-slate-100 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 cursor-not-allowed font-mono dir-ltr text-right font-bold text-base"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-base px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>حفظ القسم الجديد</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 2- Subview: الأقسام الموجودة */}
      {(subView === 'view' || !subView) && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              قائمة كافة أقسام الشركة ({departments.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pr-5">رقم القسم</th>
                  <th className="p-3.5 text-base">اسم القسم</th>
                  <th className="p-3.5">مدير القسم</th>
                  <th className="p-3.5">تاريخ الإدخال (التسجيل)</th>
                  <th className="p-3.5 text-center">عدد المستخدمين</th>
                  <th className="p-3.5 text-center">عدد الأصول والآلات</th>
                  <th className="p-3.5 pl-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {departments.map((dept) => {
                  const deptUserCount = getUserCount(dept.id, dept.name);
                  const deptAssetCount = getAssetCount(dept.id, dept.name);
                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pr-5 font-mono font-bold text-blue-700">{dept.id}</td>
                      <td className="p-3.5 font-extrabold text-slate-900 text-sm sm:text-base">{dept.name}</td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {dept.managerName ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-900 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold">
                            <UserCheck className="w-4 h-4 text-amber-600" />
                            {dept.managerName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs sm:text-sm">غير محدد</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-xs sm:text-sm dir-ltr text-right">
                        {dept.createdDate}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="bg-purple-50 text-purple-800 px-3 py-1 rounded-xl font-bold text-xs sm:text-sm border border-purple-100">
                          {deptUserCount} مستخدم
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-xl font-bold text-xs sm:text-sm border border-blue-100">
                          {deptAssetCount} أصول
                        </span>
                      </td>
                    <td className="p-3.5 pl-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingDept(dept)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل اسم القسم"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت تأكد من حذف القسم "${dept.name}"؟`)) {
                              deleteDepartment(dept.id);
                            }
                          }}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف القسم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">تعديل معلومات القسم ({editingDept.id})</h3>
            
            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم القسم</label>
                <input
                  type="text"
                  required
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span>مدير القسم</span>
                  <span className="text-[11px] font-normal text-slate-500">(اختياري - غير إجباري)</span>
                </label>
                <input
                  type="text"
                  placeholder="اسم مدير القسم"
                  value={editingDept.managerName || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, managerName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

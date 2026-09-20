import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, RolePermission, PermissionCapabilities } from '../types';
import { ShieldCheck, Check, X, Shield, Lock, CheckCircle2, UserCheck, Edit3 } from 'lucide-react';

export const RolesPermissionsView: React.FC = () => {
  const { rolePermissions, updateRolePermission, activeRole, setActiveRole } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [successMsg, setSuccessMsg] = useState('');

  const currentRole = rolePermissions.find(r => r.roleId === selectedRole) || rolePermissions[0];

  const moduleNamesArabic: Record<string, string> = {
    departments: 'أقسام الشركة (Departments)',
    users: 'المستخدمين (Users)',
    assets: 'إدارة الأصول والآلات (Assets)',
    requests: 'طلبات الصيانة (Maintenance Requests)',
    technicians: 'الفنيين (Technicians)',
    reports: 'التقارير والإحصائيات (Reports)',
    backup: 'النسخ الاحتياطي والاستعادة (Backup)',
    settings: 'إعدادات النظام (Settings)'
  };

  const handleCapabilityToggle = (
    moduleKey: keyof RolePermission['modules'],
    capKey: keyof PermissionCapabilities
  ) => {
    if (selectedRole === 'admin') {
      alert('مدير النظام يمتلك كافة الصلاحيات بشكل دائم وافتراضي.');
      return;
    }

    const updatedModules = { ...currentRole.modules };
    const moduleCaps = { ...updatedModules[moduleKey] };

    moduleCaps[capKey] = !moduleCaps[capKey];
    updatedModules[moduleKey] = moduleCaps;

    const updatedRolePerm: RolePermission = {
      ...currentRole,
      modules: updatedModules
    };

    updateRolePermission(selectedRole, updatedRolePerm);
    setSuccessMsg('تم تحديث الصلاحيات بنجاح');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          لوحة الصلاحيات الدقيقة والأدوار (Role-Based Access Control - RBAC)
        </h2>
        <p className="text-xs text-slate-500">
          تخصيص مصفوفة الصلاحيات لكل دور شغلي (مدير النظام، مدير الصيانة، الفني، الموظف) بشكل دقيق ومباشر
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Summary Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Admin Card */}
        <div
          onClick={() => setSelectedRole('admin')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'admin'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
              مدير النظام (Admin)
            </span>
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-3 leading-relaxed">
            • له جميع الصلاحيات والتحكم الكامل في كافة إعدادات النظام، المستخدمين، الأصول، والتقارير.
          </p>
        </div>

        {/* Maintenance Manager Card */}
        <div
          onClick={() => setSelectedRole('maintenance_manager')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'maintenance_manager'
              ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-lg">
              مدير الصيانة
            </span>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <ul className="text-[11px] text-slate-600 font-medium mt-3 space-y-1">
            <li>• يشاهد جميع طلبات الصيانة</li>
            <li>• يعين الفني المختص لكل طلب</li>
            <li>• يغير حالة الطلب ويوافق على الإغلاق</li>
          </ul>
        </div>

        {/* Technician Card */}
        <div
          onClick={() => setSelectedRole('technician')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'technician'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
              فني الصيانة
            </span>
            <Edit3 className="w-5 h-5 text-emerald-600" />
          </div>
          <ul className="text-[11px] text-slate-600 font-medium mt-3 space-y-1">
            <li>• يشاهد الطلبات المكلف بها فقط</li>
            <li>• يضيف التقرير الفني ويرفع الصور</li>
            <li>• يسجل قطع الغيار المستهلكة</li>
          </ul>
        </div>

        {/* Employee Card */}
        <div
          onClick={() => setSelectedRole('employee')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'employee'
              ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
              : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg">
              طالب الصيانة (الموظف)
            </span>
            <Lock className="w-5 h-5 text-purple-600" />
          </div>
          <ul className="text-[11px] text-slate-600 font-medium mt-3 space-y-1">
            <li>• إنشاء طلب صيانة جديد</li>
            <li>• متابعة الطلبات الخاصة به فقط</li>
            <li>• تقييم جودة خدمة الصيانة</li>
          </ul>
        </div>

        {/* External Approver Card */}
        <div
          onClick={() => setSelectedRole('external_approver')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'external_approver'
              ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/30'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg">
              اعتماد الورشة الخارجية
            </span>
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <ul className="text-[11px] text-slate-600 font-medium mt-3 space-y-1">
            <li>• رؤية جميع الطلبات والآلات والسجلات</li>
            <li>• إنشاء طلب صيانة جديد للقسم</li>
            <li>• اعتماد/رفض طلبات الورشة الخارجية</li>
          </ul>
        </div>

      </div>

      {/* RBAC Granular Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              مصفوفة الصلاحيات لـ: <span className="text-blue-700">{currentRole.roleName}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك النقر على خانات الاختيار للتعديل الفوري للصلاحيات
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">اختبر التصفح بهذا الدور:</span>
            <button
              onClick={() => setActiveRole(selectedRole)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
            >
              تفعيل الدور الآن
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 pr-6">الوحدة / الموديول (Module)</th>
                <th className="p-4 text-center">مشاهدة (View)</th>
                <th className="p-4 text-center">إنشاء (Create)</th>
                <th className="p-4 text-center">تعديل (Edit)</th>
                <th className="p-4 text-center">حذف (Delete)</th>
                <th className="p-4 text-center">تعيين فني (Assign)</th>
                <th className="p-4 pl-6 text-center">موافقة إغلاق (Approve)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {(Object.keys(currentRole.modules) as Array<keyof RolePermission['modules']>).map((modKey) => {
                const caps = currentRole.modules[modKey];
                return (
                  <tr key={modKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pr-6 font-bold text-slate-900 text-sm">
                      {moduleNamesArabic[modKey] || modKey}
                    </td>

                    {/* View */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleCapabilityToggle(modKey, 'view')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                          caps.view ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {caps.view ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Create */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleCapabilityToggle(modKey, 'create')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                          caps.create ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {caps.create ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Edit */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleCapabilityToggle(modKey, 'edit')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                          caps.edit ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {caps.edit ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleCapabilityToggle(modKey, 'delete')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                          caps.delete ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {caps.delete ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Assign Tech */}
                    <td className="p-4 text-center">
                      {modKey === 'requests' ? (
                        <button
                          onClick={() => handleCapabilityToggle(modKey, 'assignTech')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                            caps.assignTech ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {caps.assignTech ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Approve Closure */}
                    <td className="p-4 pl-6 text-center">
                      {modKey === 'requests' ? (
                        <button
                          onClick={() => handleCapabilityToggle(modKey, 'approveClosure')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                            caps.approveClosure ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {caps.approveClosure ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

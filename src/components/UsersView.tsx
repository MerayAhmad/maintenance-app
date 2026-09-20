import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { Users, Plus, Edit2, Trash2, Hash, Shield, Building2, Phone, Mail, Key, CheckCircle2 } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, departments, addUser, updateUser, deleteUser, subView, setSubView } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'employee' as UserRole,
    departmentId: departments[0]?.id || '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [editPassError, setEditPassError] = useState('');

  const nextAutoUserId = `USR-${(users.length + 1).toString().padStart(3, '0')}`;

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin - مدير النظام',
    maintenance_manager: 'Maintenance Manager - مدير الصيانة',
    technician: 'Technician - فني الصيانة',
    employee: 'Employee - طالب الصيانة / الموظف',
    external_approver: 'External Approver - مسؤول اعتماد الورشة الخارجية'
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name.trim() || !formData.username.trim() || !formData.password) {
      setErrorMsg('يرجى ملء كافة الحقول الإلزامية');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقتين!');
      return;
    }

    const dept = departments.find(d => d.id === formData.departmentId);

    const created = addUser({
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      role: formData.role,
      departmentId: formData.departmentId,
      departmentName: dept?.name || 'القسم العام',
      phone: formData.phone,
      email: formData.email,
      password: formData.password
    });

    setFormData({
      name: '',
      username: '',
      role: 'employee',
      departmentId: departments[0]?.id || '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    setSuccessMsg(`تم إدراج المستخدم (${created.name}) بالرقم ${created.id} بنجاح`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const dept = departments.find(d => d.id === editingUser.departmentId);
    
    // Build update object
    const updateObj: Partial<User> = {
      name: editingUser.name,
      username: editingUser.username,
      role: editingUser.role,
      departmentId: editingUser.departmentId,
      departmentName: dept?.name || editingUser.departmentName,
      phone: editingUser.phone,
      email: editingUser.email
    };

    if (editingUser.password && editingUser.password.trim().length > 0) {
      updateObj.password = editingUser.password.trim();
    }

    updateUser(editingUser.id, updateObj);
    setEditingUser(null);
    setSuccessMsg('تم تعديل بيانات المستخدم بنجاح');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditPassError('');
    if (!passwordUser) return;
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setEditPassError('كلمة المرور يجب أن تتكون من 4 خانات على الأقل');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setEditPassError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين!');
      return;
    }

    updateUser(passwordUser.id, { password: newPasswordInput });
    setPasswordUser(null);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setSuccessMsg(`تم تغيير كلمة المرور للمستخدم (${passwordUser.name}) بنجاح`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            إدارة مستخدمي النظام
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة مستخدمين جدد، تحديد أدوارهم وأقسامهم، واستعراض قائمة مستخدمي الشؤون
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl text-sm sm:text-base font-bold gap-1">
          <button
            onClick={() => setSubView('add')}
            className={`px-4.5 py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'add' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            + إضافة مستخدم جديد
          </button>
          <button
            onClick={() => setSubView('view')}
            className={`px-4.5 py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'view' || !subView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            المستخدمون ({users.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Subview 1: إضافة مستخدم جديد */}
      {subView === 'add' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              نموذج إضافة مستخدم جديد
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              رقم المستخدم يتولد أوتوماتيكياً. يرجى اختيار الدور والقسم التابع له.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            
            {/* رقم المستخدم */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                رقم المستخدم (يتولد بشكل أوتوماتيكي)
              </label>
              <input
                type="text"
                value={nextAutoUserId}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-slate-600 cursor-not-allowed font-bold"
              />
            </div>

            {/* الاسم الكامل */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                الاسم الكامل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="أدخل الاسم الثلاثي للمستخدم"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* اسم المستخدم (Username) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                اسم المستخدم (Username) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ahmad_ali"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dir-ltr text-right"
              />
            </div>

            {/* دور المستخدم */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                دور المستخدم <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                <option value="admin">Admin - مدير النظام</option>
                <option value="maintenance_manager">Maintenance Manager - مدير الصيانة</option>
                <option value="technician">Technician - فني صيانة</option>
                <option value="employee">Employee - طالب الصيانة / موظف</option>
                <option value="external_approver">External Approver - مسؤول اعتماد الورشة الخارجية</option>
              </select>
            </div>

            {/* القسم التابع له المستخدم */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                القسم التابع له <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                ))}
              </select>
            </div>

            {/* رقم الهاتف */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                رقم الهاتف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="050XXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dir-ltr text-right"
              />
            </div>

            {/* البريد الإلكتروني (اختياري) */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                البريد الإلكتروني (غير ضروري / اختياري)
              </label>
              <input
                type="email"
                placeholder="user@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dir-ltr text-right"
              />
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                تأكيد كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="md:col-span-2 pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ المستخدم الجديد</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Subview 2: عرض المستخدمين */}
      {(subView === 'view' || !subView) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              قائمة المستخدمين المسجلين بالمبنى ({users.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pr-5">رقم المستخدم</th>
                  <th className="p-3.5">الاسم</th>
                  <th className="p-3.5">اسم المستخدم</th>
                  <th className="p-3.5">دور المستخدم</th>
                  <th className="p-3.5">القسم التابع له</th>
                  <th className="p-3.5">الهاتف</th>
                  <th className="p-3.5">البريد الإلكتروني</th>
                  <th className="p-3.5 pl-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pr-5 font-mono font-bold text-blue-700">{u.id}</td>
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5 font-mono text-slate-600 dir-ltr text-right">{u.username}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'maintenance_manager' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'technician' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-semibold">{u.departmentName}</td>
                    <td className="p-3.5 dir-ltr text-right font-mono text-slate-600">{u.phone}</td>
                    <td className="p-3.5 text-slate-500 dir-ltr text-right text-[11px]">
                      {u.email || <span className="text-slate-300">غير مدخل</span>}
                    </td>
                    <td className="p-3.5 pl-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل المستخدم"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPasswordUser(u);
                            setNewPasswordInput('');
                            setConfirmPasswordInput('');
                            setEditPassError('');
                          }}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="تغيير كلمة المرور"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت تأكد من حذف المستخدم "${u.name}"؟`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">تعديل بيانات المستخدم ({editingUser.id})</h3>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المستخدم (Username)</label>
                <input
                  type="text"
                  required
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">دور المستخدم</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white"
                >
                  <option value="admin">Admin - مدير النظام</option>
                  <option value="maintenance_manager">Maintenance Manager - مدير الصيانة</option>
                  <option value="technician">Technician - فني صيانة</option>
                  <option value="employee">Employee - طالب صيانة</option>
                  <option value="external_approver">External Approver - مسؤول اعتماد الورشة الخارجية</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">القسم</label>
                <select
                  value={editingUser.departmentId}
                  onChange={(e) => setEditingUser({ ...editingUser, departmentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  كلمة المرور الجديدة (أدخل قيمة جديدة لتحديثها أو اتركها كما هي)
                </label>
                <input
                  type="password"
                  placeholder="اتركها فارغة لإبقاء كلمة المرور الحالية"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Change Password Modal */}
      {passwordUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                تغيير كلمة المرور للمستخدم ({passwordUser.name})
              </h3>
            </div>

            {editPassError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold">
                {editPassError}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المستخدم الحسابي</label>
                <input
                  type="text"
                  disabled
                  value={`${passwordUser.name} (@${passwordUser.username})`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">كلمة المرور الجديدة <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="أدخل كلمة المرور الجديدة"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تأكيد كلمة المرور الجديدة <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Key className="w-4 h-4" />
                  <span>تحديث كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

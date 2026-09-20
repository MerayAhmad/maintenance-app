import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Technician } from '../types';
import { Wrench, Plus, Edit2, Trash2, Phone, Mail, UserCheck, Shield, CheckCircle2, Hash, Key, ClipboardList } from 'lucide-react';

export const TechniciansView: React.FC = () => {
  const {
    technicians,
    specializations,
    departments,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addSpecialization,
    subView,
    setSubView,
    setActiveView
  } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    specializationId: specializations[0]?.id || '',
    phone: '',
    email: '',
    username: '',
    password: ''
  });

  const [newSpecName, setNewSpecName] = useState('');
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const nextAutoTechId = `TECH-${301 + technicians.length}`;
  const maintDept = departments.find(d => d.name.includes('صيانة')) || departments[0];

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.phone.trim()) return;

    const specObj = specializations.find(s => s.id === formData.specializationId);

    const created = addTechnician({
      name: formData.name.trim(),
      specializationId: formData.specializationId,
      specializationName: specObj?.name || 'فني صيانة',
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      username: formData.username.trim().toLowerCase(),
      password: formData.password || '123456',
      departmentId: maintDept?.id || 'DEPT-105',
      departmentName: maintDept?.name || 'قسم الصيانة'
    });

    setFormData({
      name: '',
      specializationId: specializations[0]?.id || '',
      phone: '',
      email: '',
      username: '',
      password: ''
    });

    setSuccessMsg(`تم إدراج الفني (${created.name}) بالرقم ${created.id} بنجاح وإضافته آلياً إلى قائمة المستخدمين بصفة فني صيانة`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleAddSpec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;
    addSpecialization(newSpecName.trim());
    setNewSpecName('');
    setSuccessMsg('تم إضافة الاختصاص الفني بنجاح');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech) return;
    const specObj = specializations.find(s => s.id === editingTech.specializationId);
    const deptObj = departments.find(d => d.id === editingTech.departmentId);

    updateTechnician(editingTech.id, {
      ...editingTech,
      username: editingTech.username.trim().toLowerCase(),
      specializationName: specObj?.name || editingTech.specializationName,
      departmentName: deptObj?.name || editingTech.departmentName
    });
    setEditingTech(null);
    setSuccessMsg(`تم تحديث بيانات الفني (${editingTech.name}) وكلمة المرور بنجاح`);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Subview Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            إدارة الفنيين والاختصاصات
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدخال الاختصاصات (كهرباء، ميكانيك، معلوماتية)، إضافة فنيين جدد، ومتابعة الطلبات المكلفين بها
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl text-sm sm:text-base font-bold gap-1">
          <button
            onClick={() => setSubView('specializations')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'specializations' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            إدخال اختصاص
          </button>
          <button
            onClick={() => setSubView('add')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'add' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            + فني جديد
          </button>
          <button
            onClick={() => setSubView('view')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'view' || !subView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            عرض الفنيين ({technicians.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1- Subview: إدخال اختصاص */}
      {subView === 'specializations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              إضافة اختصاص فني جديد
            </h3>
            <form onSubmit={handleAddSpec} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الاختصاص</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فني هيدروليك، معلوماتية وإلكترونيات..."
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                + حفظ الاختصاص
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900">الاختصاصات المعتمدة بالنظام</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specializations.map(s => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{s.name}</span>
                  <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-md font-bold">{s.id}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2- Subview: فني جديد */}
      {subView === 'add' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              نموذج إضافة فني صيانة جديد
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يتولد رقم الفني أوتوماتيكياً ويتبع افتراضياً لقسم الصيانة والتشغيل
            </p>
          </div>

          <form onSubmit={handleAddTech} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            
            {/* رقم الفني */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                رقم الفني (يتولد أوتوماتيكياً)
              </label>
              <input
                type="text"
                value={nextAutoTechId}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-slate-600 cursor-not-allowed font-bold"
              />
            </div>

            {/* اسم الفني */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                اسم الفني <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="أدخل الاسم الثلاثي للفني"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            {/* اختصاص الفني */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                اختصاص الفني <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.specializationId}
                onChange={(e) => setFormData({ ...formData, specializationId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
              >
                {specializations.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* رقم الهاتف */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                رقم الهاتف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="050XXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold dir-ltr text-right"
              />
            </div>

            {/* البريد الإلكتروني إن وجد */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">البريد الإلكتروني (إن وجد)</label>
              <input
                type="email"
                placeholder="tech@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold dir-ltr text-right"
              />
            </div>

            {/* اسم المستخدم */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                اسم المستخدم للدخول <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: tech_moustafa"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold dir-ltr text-right"
              />
            </div>

            {/* كلمة المرور */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1.5">كلمة المرور</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            <div className="md:col-span-2 pt-3 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ بيانات الفني</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 3- Subview: عرض الفنيين */}
      {(subView === 'view' || !subView) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              قائمة الفنيين المسجلين بقسم الصيانة ({technicians.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pr-5">رقم الفني</th>
                  <th className="p-3.5">اسم الفني</th>
                  <th className="p-3.5">الاختصاص</th>
                  <th className="p-3.5">الهاتف</th>
                  <th className="p-3.5">البريد الإلكتروني</th>
                  <th className="p-3.5">اسم المستخدم</th>
                  <th className="p-3.5 text-center">الطلبات النشطة</th>
                  <th className="p-3.5 text-center">الطلبات المنجزة</th>
                  <th className="p-3.5 pl-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {technicians.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pr-5 font-mono font-bold text-blue-700">{tech.id}</td>
                    <td className="p-3.5 font-bold text-slate-900 text-sm">{tech.name}</td>
                    <td className="p-3.5">
                      <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold">
                        {tech.specializationName}
                      </span>
                    </td>
                    <td className="p-3.5 dir-ltr text-right font-mono text-slate-700">{tech.phone}</td>
                    <td className="p-3.5 dir-ltr text-right text-slate-500 text-[11px]">
                      {tech.email || <span className="text-slate-300">غير مدخل</span>}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dir-ltr text-right">{tech.username}</td>
                    <td className="p-3.5 text-center">
                      <span className="bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                        {tech.activeRequestsCount}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                        {tech.completedRequestsCount}
                      </span>
                    </td>
                    <td className="p-3.5 pl-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveView('requests');
                            setSubView('view');
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                          title="عرض طلبات الصيانة للفني"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>الطلبات</span>
                        </button>
                        <button
                          onClick={() => setEditingTech(tech)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل الفني"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت تأكد من حذف الفني "${tech.name}"؟`)) {
                              deleteTechnician(tech.id);
                            }
                          }}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف الفني"
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

      {/* Edit Tech Modal */}
      {editingTech && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                تعديل كافة بيانات الحساب والفني ({editingTech.id})
              </h3>
            </div>

            <form onSubmit={handleUpdateTech} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الفني <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editingTech.name}
                  onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المستخدم لحساب الدخول <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingTech.username}
                    onChange={(e) => setEditingTech({ ...editingTech, username: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-mono text-right dir-ltr focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="text"
                    placeholder="كلمة المرور للحساب"
                    value={editingTech.password || ''}
                    onChange={(e) => setEditingTech({ ...editingTech, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الاختصاص الفني</label>
                  <select
                    value={editingTech.specializationId}
                    onChange={(e) => setEditingTech({ ...editingTech, specializationId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    {specializations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">القسم التابع له</label>
                  <select
                    value={editingTech.departmentId || departments[0]?.id}
                    onChange={(e) => setEditingTech({ ...editingTech, departmentId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الهاتف <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingTech.phone}
                    onChange={(e) => setEditingTech({ ...editingTech, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-mono dir-ltr text-right focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editingTech.email || ''}
                    onChange={(e) => setEditingTech({ ...editingTech, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-mono dir-ltr text-right focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTech(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ التعديلات وكلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

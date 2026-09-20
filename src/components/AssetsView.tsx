import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Asset, PriorityLevel } from '../types';
import { inferMachineType, COMMON_MACHINE_TYPES } from '../data/initialData';
import {
  Box,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Sliders,
  CheckCircle2,
  Wrench,
  RotateCw,
  Cpu
} from 'lucide-react';

export const AssetsView: React.FC = () => {
  const {
    assets,
    departments,
    deviceTypes,
    faultTypes,
    requests,
    addAsset,
    updateAsset,
    deleteAsset,
    addDeviceType,
    deleteDeviceType,
    addFaultType,
    deleteFaultType,
    resetFaultTypesToDefault,
    subView,
    setSubView,
    setActiveView
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedMachineTypeFilter, setSelectedMachineTypeFilter] = useState('');

  // Form state for New Asset (User requested: only Code, no Serial Number, add Machine Type field)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    model: '',
    manufacturer: '',
    typeId: deviceTypes[0]?.id || '',
    machineType: 'حقن',
    location: '',
    departmentId: departments.find(d => d.name === 'الانتاج')?.id || departments[0]?.id || '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: '',
    status: 'working' as Asset['status']
  });

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form state for Device Types
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');

  // Form state for Fault Types (User requested only fault type: ميكانيك - كهرباء - برمجي(IT) - غيرها)
  const [newFaultTypeInput, setNewFaultTypeInput] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  // فحص ما إذا كان القسم المختار هو قسم الإنتاج حصراً
  const isProductionDept = (deptId: string): boolean => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return false;
    const name = dept.name.toLowerCase();
    return name.includes('إنتاج') || name.includes('انتاج') || dept.id === 'DEPT-107';
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.departmentId) return;

    const dept = departments.find(d => d.id === formData.departmentId);
    const typeObj = deviceTypes.find(t => t.id === formData.typeId);
    const isProd = isProductionDept(formData.departmentId);

    const created = addAsset({
      name: formData.name.trim(),
      code: formData.code.trim() || `AST-${(assets.length + 1).toString().padStart(3, '0')}`,
      model: formData.model.trim() || 'N/A',
      manufacturer: formData.manufacturer.trim() || 'N/A',
      typeId: formData.typeId,
      typeName: typeObj?.name || 'آلات ميكانيكية',
      machineType: isProd ? (formData.machineType.trim() || 'المضغوطات') : '',
      location: formData.location.trim() || 'الموقع الرئيسي',
      departmentId: formData.departmentId,
      departmentName: dept?.name || 'القسم العام',
      purchaseDate: formData.purchaseDate,
      purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : 0,
      status: formData.status
    });

    setFormData({
      name: '',
      code: '',
      model: '',
      manufacturer: '',
      typeId: deviceTypes[0]?.id || '',
      machineType: 'حقن',
      location: '',
      departmentId: departments.find(d => d.name === 'الانتاج')?.id || departments[0]?.id || '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchasePrice: '',
      status: 'working'
    });

    setSuccessMsg(`تم إدراج الأصل بنجاح: [${created.code}] ${created.name}${created.machineType ? ` (${created.machineType})` : ''}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    const dept = departments.find(d => d.id === editingAsset.departmentId);
    const typeObj = deviceTypes.find(t => t.id === editingAsset.typeId);
    const isProd = isProductionDept(editingAsset.departmentId);

    updateAsset(editingAsset.id, {
      ...editingAsset,
      departmentName: dept?.name,
      typeName: typeObj?.name,
      machineType: isProd ? (editingAsset.machineType?.trim() || inferMachineType(editingAsset)) : ''
    });
    setEditingAsset(null);
    setSuccessMsg('تم تعديل بيانات الأصل بنجاح');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    addDeviceType(newTypeName.trim(), newTypeCode.trim() || 'TYPE');
    setNewTypeName('');
    setNewTypeCode('');
    setSuccessMsg('تم إضافة النوع الجديد بنجاح');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddFault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaultTypeInput.trim()) return;
    addFaultType(newFaultTypeInput.trim());
    setNewFaultTypeInput('');
    setSuccessMsg('تم إضافة نوع العطل بنجاح لاعتماده في طلبات الصيانة');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filtered Assets
  const filteredAssets = assets.filter(a => {
    const mType = a.machineType || inferMachineType(a);
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDeptFilter || a.departmentId === selectedDeptFilter;
    const matchesType = !selectedTypeFilter || a.typeId === selectedTypeFilter;
    const matchesMachineType = !selectedMachineTypeFilter ||
      mType === selectedMachineTypeFilter ||
      (selectedMachineTypeFilter === 'المضغوطات' && (mType === 'حب' || mType.includes('حب') || mType.includes('مضغوط')));
    return matchesSearch && matchesDept && matchesType && matchesMachineType;
  });

  const statusLabels: Record<Asset['status'], { label: string; bg: string }> = {
    working: { label: 'يعمل (حالة ممتازة)', bg: 'bg-emerald-100 text-emerald-800' },
    maintenance: { label: 'قيد الصيانة', bg: 'bg-amber-100 text-amber-800' },
    broken: { label: 'متوقف / معطل', bg: 'bg-rose-100 text-rose-800' },
    needs_inspection: { label: 'بحاجة لمعاينة', bg: 'bg-blue-100 text-blue-800' }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Subview Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-6 h-6 text-blue-600" />
            إدارة الأصول والآلات (Mechanical / Electrical / Electronics)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة وتصنيف واستعراض الأجهزة، وإدارة الأنواع، الأعطال، والأولويات
          </p>
        </div>

        <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl text-sm sm:text-base font-bold gap-1.5">
          <button
            onClick={() => setSubView('add')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'add' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            + إضافة جديد
          </button>
          <button
            onClick={() => setSubView('view')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'view' || !subView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            جميع الأصول ({assets.length})
          </button>
          <button
            onClick={() => setSubView('types')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'types' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            إدارة الأنواع
          </button>
          <button
            onClick={() => setSubView('faults')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'faults' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            إدارة الأعطال
          </button>
          <button
            onClick={() => setSubView('priorities')}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl transition-all cursor-pointer font-extrabold ${
              subView === 'priorities' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            إدارة الأولويات
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1- Subview: إضافة جديد */}
      {subView === 'add' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              نموذج إضافة أصل/جهاز جديد
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              الحقول المحددة بـ (<span className="text-rose-500">*</span>) إلزامية (اسم الجهاز والقسم)، وباقي الحقول توثيقية اختياري.
            </p>
          </div>

          <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            
            {/* اسم الجهاز - المطلوب الرئيسي */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1.5">
                اسم الجهاز / الآلة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: مخرطة CNC عالية الدقة، مولد كهربائي 500 KVA..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* القسم - المطلوب الرئيسي الثاني */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                القسم التابع له الأصل <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* نوع الجهاز */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">نوع الجهاز (من القائمة)</label>
              <select
                value={formData.typeId}
                onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
              >
                {deviceTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* كود الآلة التعريفي */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>كود الآلة التعريفي <span className="text-rose-500">*</span></span>
                <span className="text-xs text-blue-700 font-medium">الكود المعتمد للآلة</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: IM206 أو MCH-01 أو INJ-10"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold dir-ltr text-right focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* التصنيف التشغيلي (يظهر حصرياً وفقط عند اختيار قسم الإنتاج) */}
            {isProductionDept(formData.departmentId) && (
              <div className="md:col-span-2 bg-blue-50/70 border-2 border-blue-200/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-blue-950 font-black text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span>التصنيف التشغيلي</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-blue-700 font-bold">
                    مخصص لفرز وتقسيم آلات قسم الإنتاج (حقن، بودرة، المضغوطات...)
                  </span>
                </div>

                {/* أزرار اختيار سريعة مع إمكانية الإدخال اليدوي */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {COMMON_MACHINE_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, machineType: type })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        formData.machineType === type
                          ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-400'
                          : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100/60'
                      }`}
                    >
                      {type === 'حقن' && '💉 '}
                      {type === 'بودرة' && '🧪 '}
                      {type === 'المضغوطات' && '💊 '}
                      {type === 'شراب' && '🧴 '}
                      {type === 'مراهم' && '🩹 '}
                      {type === 'تعبئة وتغليف' && '📦 '}
                      {type === 'صيانة ومرافق' && '⚙️ '}
                      {type}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    list="assetMachineTypesList"
                    placeholder="اختر من الأزرار أو اكتب التصنيف التشغيلي يدوياً (مثال: حقن، بودرة، المضغوطات، شراب...)"
                    value={formData.machineType}
                    onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                    className="w-full bg-white border border-blue-300 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <datalist id="assetMachineTypesList">
                    {COMMON_MACHINE_TYPES.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}

            {/* الموديل */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">الموديل (Model)</label>
              <input
                type="text"
                placeholder="مثال: Haas VF-2"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            {/* الشركة المصنعة */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">الشركة المصنعة</label>
              <input
                type="text"
                placeholder="مثال: Caterpillar, Siemens, Haas"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            {/* الموقع */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">الموقع داخل الشركة</label>
              <input
                type="text"
                placeholder="مثال: صالة الإنتاج A - الخط الأول"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            {/* تاريخ الشراء */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">تاريخ الشراء</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold"
              />
            </div>

            {/* سعر / قيمة الآلة - اختياري */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                سعر / قيمة الآلة ($) <span className="text-slate-400 font-normal">(اختياري - غير ملزم)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="مثال: 15000 (افتراضي $0)"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold dir-ltr text-right"
              />
            </div>

            {/* الحالة التشغيلية */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">الحالة التشغيلية للأصل</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Asset['status'] })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold bg-white"
              >
                <option value="working">يعمل (حالة ممتازة)</option>
                <option value="maintenance">قيد الصيانة</option>
                <option value="broken">متوقف / معطل</option>
                <option value="needs_inspection">بحاجة لمعاينة</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ الأصل الجديد</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 2- Subview: عرض جميع الأصول مع البحث والفلترة والتعديل */}
      {(subView === 'view' || !subView) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث باسم الجهاز، الكود، التصنيف التشغيلي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                <option value="">جميع الأقسام</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedMachineTypeFilter}
                onChange={(e) => setSelectedMachineTypeFilter(e.target.value)}
                className="w-full py-2 px-3 border border-blue-300 bg-blue-50/60 rounded-xl text-xs font-bold text-blue-900"
              >
                <option value="">جميع التصنيفات التشغيلية (حقن، بودرة...)</option>
                {COMMON_MACHINE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                <option value="">جميع أنواع الأجهزة</option>
                {deviceTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">كود الآلة</th>
                  <th className="p-3.5 text-base">اسم الآلة / الجهاز</th>
                  <th className="p-3.5">التصنيف التشغيلي</th>
                  <th className="p-3.5">النوع الفني</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">الموديل / الشركة</th>
                  <th className="p-3.5">الموقع</th>
                  <th className="p-3.5">تاريخ الشراء</th>
                  <th className="p-3.5">سعر الآلة ($)</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {filteredAssets.map((asset) => {
                  const mType = asset.machineType || inferMachineType(asset);
                  const isInjection = mType.includes('حقن');
                  const isPowder = mType.includes('بودرة');
                  const isPill = mType.includes('حب') || mType.includes('مضغوط');
                  const isSyrup = mType.includes('شراب');
                  const displayType = (mType === 'حب' || mType.includes('حب')) ? 'المضغوطات' : mType;

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono">
                        <span className="inline-block px-2.5 py-1 bg-slate-900 text-amber-300 font-black rounded-lg text-xs tracking-wider border border-slate-700 shadow-2xs">
                          {asset.code}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-900 text-sm sm:text-base">{asset.name}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                          isInjection
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : isPowder
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isPill
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : isSyrup
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-blue-100 text-blue-900 border-blue-200'
                        }`}>
                          {isInjection && '💉 '}
                          {isPowder && '🧪 '}
                          {isPill && '💊 '}
                          {isSyrup && '🧴 '}
                          {displayType}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{asset.typeName}</td>
                      <td className="p-3.5 font-bold text-slate-800">{asset.departmentName}</td>
                      <td className="p-3.5 text-slate-600">{asset.model} ({asset.manufacturer})</td>
                      <td className="p-3.5 text-slate-700">{asset.location}</td>
                      <td className="p-3.5 font-mono text-xs sm:text-sm text-slate-600 dir-ltr text-right">{asset.purchaseDate}</td>
                      <td className="p-3.5 font-mono font-black text-emerald-800 text-sm sm:text-base">${(asset.purchasePrice || 0).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold border ${statusLabels[asset.status].bg}`}>
                          {statusLabels[asset.status].label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingAsset(asset)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل الأصل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت تأكد من حذف الجهاز "${asset.name}"؟`)) {
                                deleteAsset(asset.id);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف الأصل"
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

      {/* 3- Subview: إدارة الأنواع (Device Types) */}
      {subView === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form Add Type */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              إضافة نوع جهاز جديد
            </h3>
            <form onSubmit={handleAddType} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1.5 text-sm sm:text-base">اسم النوع</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أجهزة الكترونية، معدات هيدروليكية..."
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full border-2 border-slate-300 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-base bg-slate-50 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-800 font-extrabold mb-1.5 text-sm sm:text-base">كود/رمز النوع</label>
                <input
                  type="text"
                  placeholder="مثال: ELEC-TRON"
                  value={newTypeCode}
                  onChange={(e) => setNewTypeCode(e.target.value)}
                  className="w-full border-2 border-slate-300 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-base bg-slate-50 focus:bg-white focus:outline-none transition-all dir-ltr text-right"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base py-3 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                + إضافة النوع
              </button>
            </form>
          </div>

          {/* Types List Table */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5 space-y-3">
            <div className="border-b border-slate-100 pb-3 font-black text-base sm:text-lg text-slate-900 flex items-center justify-between">
              <span>قائمة تصنيفات وأنواع الأجهزة ({deviceTypes.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">كود النوع</th>
                    <th className="p-3.5 text-base">اسم النوع</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {deviceTypes.map(type => (
                    <tr key={type.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-blue-700 font-bold">{type.id} ({type.code})</td>
                      <td className="p-3.5 font-extrabold text-slate-900 text-base">{type.name}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => deleteDeviceType(type.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4- Subview: إدارة أنواع الأعطال (Fault Types) */}
      {subView === 'faults' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form: إضافة نوع عطل جديد */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                إضافة نوع عطل جديد
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                إدخال نوع العطل مباشرة لاعتماده في بلاغات وطلبات الصيانة
              </p>
            </div>

            <form onSubmit={handleAddFault} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1.5 text-sm sm:text-base">
                  نوع العطل <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ميكانيك، كهرباء، برمجي (IT)..."
                  value={newFaultTypeInput}
                  onChange={(e) => setNewFaultTypeInput(e.target.value)}
                  className="w-full border-2 border-slate-300 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-base focus:outline-none bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              {/* Quick Select Buttons for standard types */}
              <div className="space-y-2 pt-1">
                <span className="text-xs sm:text-[13px] font-bold text-slate-600 block">
                  الأنواع المعتمدة (انقر للاختيار المباشر):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'ميكانيك', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
                    { name: 'كهرباء', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
                    { name: 'برمجي (IT)', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
                    { name: 'غيرها', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' }
                  ].map(t => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setNewFaultTypeInput(t.name)}
                      className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer text-center ${t.color}`}
                    >
                      + {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-5 h-5" />
                <span>+ إضافة نوع العطل</span>
              </button>
            </form>
          </div>

          {/* Table: قائمة أنواع الأعطال المعتمدة */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-3 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>أنواع الأعطال المعتمدة لاستخدامها في طلبات الصيانة</span>
                  <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full">
                    {faultTypes.length}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  تظهر هذه الأنواع مباشرة في نماذج تسجيل طلبات الصيانة والتكليف الفني
                </p>
              </div>

              {/* Button to restore 4 core types if needed */}
              <button
                type="button"
                onClick={() => {
                  resetFaultTypesToDefault();
                  setSuccessMsg('تم استعادة وتثبيت الأنواع الأساسية (ميكانيك، كهرباء، برمجي (IT)، غيرها)');
                  setTimeout(() => setSuccessMsg(''), 4000);
                }}
                className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer self-start sm:self-center shrink-0 flex items-center gap-1.5"
                title="إعادة ضبط القائمة للأنواع الأربعة المعتمدة: ميكانيك، كهرباء، برمجي (IT)، غيرها"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>الأنواع الأساسية (4)</span>
              </button>
            </div>

            {faultTypes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                <p className="text-sm font-bold text-slate-600">لا توجد أنواع أعطال مسجلة حالياً.</p>
                <button
                  type="button"
                  onClick={() => {
                    resetFaultTypesToDefault();
                    setSuccessMsg('تم تفعيل الأنواع الأساسية بنجاح');
                    setTimeout(() => setSuccessMsg(''), 4000);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  تفعيل الأنواع الأساسية (ميكانيك، كهرباء، برمجي (IT)، غيرها)
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 text-center w-14">#</th>
                      <th className="p-3.5">كود العطل</th>
                      <th className="p-3.5 text-base">نوع العطل</th>
                      <th className="p-3.5 text-center">الطلبات المرتبطة</th>
                      <th className="p-3.5 text-center w-24">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {faultTypes.map((f, idx) => {
                      const linkedRequestsCount = requests.filter(r => r.faultTypeId === f.id || r.faultTypeName === f.name).length;
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                          <td className="p-3.5 font-mono text-blue-700 font-bold">{f.id}</td>
                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-900 text-base">
                              {f.name}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                              {linkedRequestsCount} طلب
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف نوع العطل (${f.name})؟`)) {
                                  deleteFaultType(f.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف نوع العطل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5- Subview: إدارة الأولويات (Priorities) */}
      {subView === 'priorities' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              مستويات أولوية طلبات الصيانة المعرفة بالنظام
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              يتم تحديد الأولوية فور إنشاء طلب الصيانة لتوجيه استجابة الفنيين
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Low */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-lg">
                  منخفض (Low)
                </span>
                <span className="w-3 h-3 rounded-full bg-slate-400" />
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                للأعطال البسيطة أو الفحوصات الروتينية التي لا تؤثر على خط سير الإنتاج.
              </p>
            </div>

            {/* Medium */}
            <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-lg">
                  متوسط (Medium)
                </span>
                <span className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                للأعطال التي قد تقلل من سرعة الجهاز أو جودة المنتج دون إيقافه تماماً.
              </p>
            </div>

            {/* High */}
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                  مرتفع (High)
                </span>
                <span className="w-3 h-3 rounded-full bg-amber-500" />
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                توقف أصل هائل أو جزء حرج من خط الإنتاج يتطلب معالجة خلال ساعات قليلة.
              </p>
            </div>

            {/* Critical */}
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-lg">
                  حرج جداً (Critical)
                </span>
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              </div>
              <p className="text-[11px] text-rose-900 font-medium">
                توقف كامل خط الإنتاج أو خطورة كهربائية/ميكانيكية عاجلة تتطلب التدخل الفوري.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">تعديل معلومات الأصل ({editingAsset.code})</h3>

            <form onSubmit={handleUpdateAsset} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">كود الآلة التعريفي</label>
                <input
                  type="text"
                  required
                  value={editingAsset.code}
                  onChange={(e) => setEditingAsset({ ...editingAsset, code: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-bold dir-ltr text-right"
                />
              </div>

              {/* التصنيف التشغيلي (يظهر حصرياً لقسم الإنتاج) */}
              {isProductionDept(editingAsset.departmentId) && (
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-1.5">
                  <label className="block text-blue-950 font-bold mb-1 flex items-center justify-between">
                    <span>التصنيف التشغيلي</span>
                    <span className="text-[10px] text-blue-700 font-bold">حقن، بودرة، المضغوطات، شراب...</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_MACHINE_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditingAsset({ ...editingAsset, machineType: type })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (editingAsset.machineType || inferMachineType(editingAsset)) === type
                            ? 'bg-blue-600 text-white shadow-xs scale-105'
                            : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100/50'
                        }`}
                      >
                        {type === 'المضغوطات' ? '💊 المضغوطات' : type}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    list="editMachineTypeList"
                    value={editingAsset.machineType || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, machineType: e.target.value })}
                    placeholder="اختر أو اكتب التصنيف التشغيلي يدوياً (مثال: حقن، بودرة، المضغوطات، شراب...)"
                    className="w-full border border-blue-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="editMachineTypeList">
                    {COMMON_MACHINE_TYPES.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الجهاز</label>
                <input
                  type="text"
                  required
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">القسم</label>
                <select
                  value={editingAsset.departmentId}
                  onChange={(e) => setEditingAsset({ ...editingAsset, departmentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الجهاز</label>
                <select
                  value={editingAsset.typeId}
                  onChange={(e) => setEditingAsset({ ...editingAsset, typeId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white"
                >
                  {deviceTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الموقع</label>
                <input
                  type="text"
                  value={editingAsset.location}
                  onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  سعر / قيمة الآلة ($) <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={editingAsset.purchasePrice ?? 0}
                  onChange={(e) => setEditingAsset({ ...editingAsset, purchasePrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الحالة</label>
                <select
                  value={editingAsset.status}
                  onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value as Asset['status'] })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-bold bg-white"
                >
                  <option value="working">يعمل (حالة ممتازة)</option>
                  <option value="maintenance">قيد الصيانة</option>
                  <option value="broken">متوقف / معطل</option>
                  <option value="needs_inspection">بحاجة لمعاينة</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
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

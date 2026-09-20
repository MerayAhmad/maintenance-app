import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  Search,
  Wrench,
  FileSpreadsheet,
  Printer,
  Box,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Package,
  Layers,
  FileText
} from 'lucide-react';

export const MachineHistoryView: React.FC = () => {
  const { assets, requests } = useApp();
  
  // Selected Machine ID
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'replacements' | 'costs'>('timeline');

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  // All requests strictly related to this specific asset without mixing between machines
  const assetRequests = useMemo(() => {
    if (!selectedAsset) return [];
    return requests.filter(r => r.assetId === selectedAsset.id || r.assetCode === selectedAsset.code);
  }, [requests, selectedAsset]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return assetRequests.filter(r => {
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesSearch =
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.technicalReport && r.technicalReport.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.technicianName && r.technicianName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    }).sort((a, b) => {
      const parseReqDate = (dateStr?: string): number => {
        if (!dateStr) return 0;
        const cleaned = dateStr.replace(' | ', 'T').trim();
        const parsed = Date.parse(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };
      const timeA = parseReqDate(a.creationDate) || parseReqDate(a.faultOccurrenceDate);
      const timeB = parseReqDate(b.creationDate) || parseReqDate(b.faultOccurrenceDate);
      if (timeB !== timeA) return timeB - timeA;
      return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [assetRequests, statusFilter, searchQuery]);

  // Flattened Replaced Spare Parts List for this Machine
  const allReplacedParts = useMemo(() => {
    const list: Array<{
      requestCode: string;
      date: string;
      partName: string;
      partCode: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      currency?: string;
      technicianName: string;
      faultType: string;
    }> = [];

    assetRequests.forEach(req => {
      if (req.usedSpareParts && req.usedSpareParts.length > 0) {
        req.usedSpareParts.forEach(part => {
          list.push({
            requestCode: req.code,
            date: req.executionDate || req.completionDate || req.creationDate,
            partName: part.partName,
            partCode: part.partCode || 'SP-GEN',
            quantity: part.quantity,
            unitPrice: part.unitPrice,
            totalPrice: part.unitPrice * part.quantity,
            currency: part.currency || req.partsCurrency || '$',
            technicianName: req.technicianName || 'فني الصيانة',
            faultType: req.faultTypeName || 'صيانة داخلية'
          });
        });
      }
      if (req.externalSpareParts && req.externalSpareParts.length > 0) {
        req.externalSpareParts.forEach(part => {
          list.push({
            requestCode: req.code,
            date: req.executionDate || req.completionDate || req.creationDate,
            partName: `${part.name} (ورشة خارجية)`,
            partCode: part.id,
            quantity: part.quantity,
            unitPrice: part.unitPrice,
            totalPrice: part.totalPrice || (part.unitPrice * part.quantity),
            technicianName: req.technicianName || req.externalWorkshopName || 'ورشة خارجية',
            faultType: req.faultTypeName || 'صيانة ورشة خارجية'
          });
        });
      }
    });

    return list;
  }, [assetRequests]);

  // Calculate Asset Lifespan Metrics
  const totalRequestsCount = assetRequests.length;
  const closedRequestsCount = assetRequests.filter(r => r.status === 'closed' || r.status === 'received').length;
  
  const totalRepairHours = assetRequests
    .filter(r => r.actualRepairHours || r.repairTimeHours)
    .reduce((acc, curr) => acc + (curr.actualRepairHours || curr.repairTimeHours || 0), 0);

  // Financial Breakdown per Machine (Internal Spare Parts + External Costs)
  const totalInternalPartsCost = assetRequests.reduce((sum, r) => {
    return sum + (r.usedSpareParts || []).reduce((pSum, p) => pSum + (p.unitPrice * p.quantity), 0);
  }, 0);
  const totalExternalPartsCost = assetRequests.reduce((sum, r) => {
    return sum + (r.externalSpareParts || []).reduce((pSum, p) => pSum + (p.totalPrice || (p.unitPrice * p.quantity)), 0);
  }, 0);
  const totalSparePartsCost = totalInternalPartsCost + totalExternalPartsCost;

  const totalExternalWorkshopCost = assetRequests.reduce((sum, r) => {
    const extVal = r.externalTotalCost || r.externalWorkshopCost || ((r.externalLaborCost || 0) + (r.externalPartsCost || 0));
    return sum + (extVal || 0);
  }, 0);
  const totalOverallMaintenanceCost = totalInternalPartsCost + totalExternalWorkshopCost;
  const purchasePrice = selectedAsset?.purchasePrice || 0;
  const maintenanceToValueRatio = purchasePrice > 0 ? ((totalOverallMaintenanceCost / purchasePrice) * 100).toFixed(1) : '0';

  // Status Labels Map
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800', label: 'جديد (New)' },
    assigned: { bg: 'bg-purple-100 border-purple-300', text: 'text-purple-800', label: 'تم تعيين فني' },
    in_progress: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'قيد الإصلاح' },
    external_pending_maint_mgr: { bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-900', label: 'ورشة خارجية (بانتظار مدير الصيانة)' },
    external_pending_gm: { bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-900', label: 'ورشة خارجية (بانتظار المدير العام)' },
    external_approved_by_gm: { bg: 'bg-sky-100 border-sky-300', text: 'text-sky-900', label: 'معتمد ورشة خارجية' },
    external_in_execution: { bg: 'bg-violet-100 border-violet-300', text: 'text-violet-900', label: 'تنفيذ بالورشة الخارجية' },
    pending_approval: { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-800', label: 'بانتظار توقيع مدير الصيانة' },
    pending_closure: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800', label: 'بانتظار إغلاق طالب الصيانة' },
    closed: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'مغلق (تم الإصلاح)' },
    received: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'تم الاستلام وضمان الجودة' },
    cancelled: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', label: 'ملغى' }
  };

  const assetStatusBadge: Record<string, { bg: string; text: string; label: string }> = {
    working: { bg: 'bg-emerald-600 text-white', text: 'text-emerald-700', label: 'جاهزية كاملة (شغالة)' },
    maintenance: { bg: 'bg-amber-500 text-white', text: 'text-amber-700', label: 'قيد الصيانة الدوريّة' },
    broken: { bg: 'bg-red-600 text-white', text: 'text-red-700', label: 'معطلة (خارج الخدمة)' },
    needs_inspection: { bg: 'bg-indigo-600 text-white', text: 'text-indigo-700', label: 'بحاجة فحص وتدقيق' }
  };

  // Export to Excel / CSV
  const exportToCSV = () => {
    if (!selectedAsset) return;
    let csv = `سجل صيانة وإجراءات الآلة: ${selectedAsset.name} (${selectedAsset.code})\n`;
    csv += `الكود,تاريخ الطلب,طالب الصيانة,القسم,نوع العطل,الفني المكلف,الحالة,ساعات الإصلاح,تقرير الفني,قطع الغيار المستهلكة,التكلفة ($)\n`;

    assetRequests.forEach(r => {
      const partsStr = r.usedSpareParts ? r.usedSpareParts.map(p => `${p.partName} (${p.quantity})`).join(' - ') : 'لا يوجد';
      let cost = 0;
      if (r.usedSpareParts) {
        cost = r.usedSpareParts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
      }
      csv += `"${r.code}","${r.creationDate}","${r.requesterName}","${r.departmentName}","${r.faultTypeName}","${r.technicianName || 'لم يعين'}","${r.status}","${r.actualRepairHours || r.estimatedRepairHours || 0}","${r.technicalReport || ''}","${partsStr}","${cost}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Machine_History_${selectedAsset.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-[#0f172a]">
      
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            سجل الآلات والتبدلات والتكاليف المستقل (Individual Machine Ledger)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل فني مخصص ومستقل لكل آلة على حدا لتدقيق الأحداث، التبدلات، قطع الغيار، ومطابقة التكاليف دون خلط
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportToCSV}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title="تصدير سجل الآلة لملف Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            title="طباعة سجل الآلة أو حفظ كـ PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة / PDF</span>
          </button>
        </div>
      </div>

      {/* Machine Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Box className="w-4 h-4 text-blue-600" />
          اختر الآلة / الجهاز لفتح السجل الفني والمالي الخاص بها:
        </label>
        <select
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {assets.map((asset, idx) => (
            <option key={asset.id} value={asset.id}>
              #{asset.seqNumber ?? idx + 1} | {asset.code} - {asset.name} ({asset.departmentName}) [{asset.status === 'working' ? 'شغالة' : asset.status === 'maintenance' ? 'صيانة' : 'معطلة'}]
            </option>
          ))}
        </select>
      </div>

      {/* Printable Company Official Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">شركة أكبيطرة لصناعة الأدوية البيطرية</h1>
        <h2 className="text-lg font-semibold text-slate-700 mt-1">بطاقة السجل الفني والعملياتي للآلة CMMS</h2>
        <p className="text-xs text-slate-500 mt-0.5 dir-ltr">تاريخ التقرير: {new Date().toISOString().slice(0, 10)}</p>
      </div>

      {selectedAsset && (
        <>
          {/* Machine Passport Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {selectedAsset.code}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${assetStatusBadge[selectedAsset.status]?.bg || 'bg-slate-600 text-white'}`}>
                    {assetStatusBadge[selectedAsset.status]?.label}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {selectedAsset.name}
                </h3>
              </div>

              <div className="text-xs text-slate-500 font-medium space-y-1 md:text-left">
                <p>الموديل: <span className="font-bold text-slate-800">{selectedAsset.model}</span></p>
                <p>المصنع: <span className="font-bold text-slate-800">{selectedAsset.manufacturer}</span></p>
                <p>قيمة الشراء الأصلية: <span className="font-bold text-emerald-800">${purchasePrice.toLocaleString()}</span></p>
              </div>
            </div>

            {/* Machine Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-0.5">القسم المالك</span>
                <span className="font-bold text-slate-900">{selectedAsset.departmentName}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-0.5">الموقع والتمركز</span>
                <span className="font-bold text-slate-900">{selectedAsset.location}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-0.5">نوع التصنيف الفني</span>
                <span className="font-bold text-slate-900">{selectedAsset.typeName}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-0.5">تاريخ الشراء والبدء</span>
                <span className="font-bold text-slate-900 dir-ltr text-right">{selectedAsset.purchaseDate}</span>
              </div>
            </div>

            {/* Financial & Maintenance Cost Comparison Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-xs text-blue-800 font-semibold block">إجمالي طلبات الصيانة</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-blue-900">{totalRequestsCount}</span>
                  <span className="text-[11px] text-blue-700 font-bold">منجزة: {closedRequestsCount}</span>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-xs text-amber-800 font-semibold block">تكلفة قطع الغيار المنسوبة</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-amber-900">${totalSparePartsCost.toLocaleString()}</span>
                  <span className="text-[11px] text-amber-700 font-bold">{allReplacedParts.length} قطعة تبديل</span>
                </div>
              </div>

              <div className="bg-purple-50/70 border border-purple-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-xs text-purple-800 font-semibold block">تكلفة الورشات الخارجية</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-purple-900">${totalExternalWorkshopCost.toLocaleString()}</span>
                  <span className="text-[11px] text-purple-700 font-bold">{totalRepairHours.toFixed(1)} ساعة إصلاح</span>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-xs text-emerald-800 font-semibold block">إجمالي الصيانة vs قيمة الشراء</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-emerald-900">${totalOverallMaintenanceCost.toLocaleString()}</span>
                  <span className="text-[11px] text-emerald-800 font-black bg-emerald-100 px-1.5 py-0.5 rounded">
                    {maintenanceToValueRatio}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar for Machine View */}
          <div className="flex items-center gap-2 border-b border-slate-200 no-print">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>سجل جميع الأحداث وطلبات الصيانة ({filteredRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('replacements')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'replacements'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>سجل التبدلات وقطع الغيار المباشرة للآلة ({allReplacedParts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('costs')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'costs'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>مطابقة التكاليف والموازنة المخصصة</span>
            </button>
          </div>

          {/* TAB 1: Operations & Maintenance History Timeline */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
              
              {/* Table Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  تسلسل الأحداث الزمنية لـ {selectedAsset.name}
                </h3>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="بحث بالتفاصيل، التقرير..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-8 pl-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                  >
                    <option value="">جميع الحالات</option>
                    <option value="closed">مغلق (تم الإصلاح)</option>
                    <option value="in_progress">قيد العمل</option>
                    <option value="new">جديد</option>
                  </select>
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 pr-4">كود الحدث / الطلب</th>
                      <th className="p-3">التاريخ والوقت</th>
                      <th className="p-3">طالب الصيانة / الحدث</th>
                      <th className="p-3">التفاصيل والوصف</th>
                      <th className="p-3">الفني / الجهة المكلفة</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">التقرير الفني وإجراء الإصلاح</th>
                      <th className="p-3 pl-4">قطع الغيار والتكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                          لم يتم تسجيل أي طلبات صيانة لهذه الآلة
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => {
                        let reqPartCost = 0;
                        if (req.usedSpareParts) {
                          reqPartCost = req.usedSpareParts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
                        }

                        return (
                          <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 pr-4 font-mono font-bold text-emerald-700">{req.code}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-500 dir-ltr text-right">{req.creationDate}</td>
                            <td className="p-3 font-bold text-slate-900">{req.requesterName}</td>
                            <td className="p-3 text-slate-700 max-w-xs">{req.description}</td>
                            <td className="p-3 font-bold text-slate-800">
                              {req.technicianName || <span className="text-slate-400 font-normal">لم يعين</span>}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusMap[req.status]?.bg || 'bg-slate-100'} ${statusMap[req.status]?.text || 'text-slate-800'}`}>
                                {statusMap[req.status]?.label || req.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-800 max-w-xs">
                              {req.technicalReport ? (
                                <div>
                                  <span className="font-medium text-slate-900">{req.technicalReport}</span>
                                  {req.executionDate && (
                                    <div className="text-[10px] text-emerald-800 font-extrabold font-mono mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                      تاريخ وساعة التنفيذ: {req.executionDate}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">بانتظار تقرير الفني</span>
                              )}
                            </td>
                            <td className="p-3 pl-4">
                              {req.usedSpareParts && req.usedSpareParts.length > 0 ? (
                                <div className="space-y-0.5">
                                  {req.usedSpareParts.map((p, idx) => (
                                    <div key={idx} className="text-[11px] text-slate-700">
                                      • {p.partName} <span className="font-bold text-emerald-700">({p.quantity})</span>
                                    </div>
                                  ))}
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-1">
                                    التكلفة: ${reqPartCost}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">لا يوجد قطع</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Itemized Spare Parts Replacements Ledger */}
          {activeTab === 'replacements' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  سجل القطع المستبدلة المباشرة الخاصة بالآلة: {selectedAsset.name} ({selectedAsset.code})
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  إجمالي التكلفة المباشرة للقطع: <span className="text-amber-800 font-mono text-sm">${totalSparePartsCost.toLocaleString()}</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 pr-4">رقم طلب الصيانة</th>
                      <th className="p-3">تاريخ الاستبدال</th>
                      <th className="p-3">اسم كود قطعة الغيار</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-center">سعر القطعة</th>
                      <th className="p-3 text-center">الإجمالي</th>
                      <th className="p-3">الفني المنفذ</th>
                      <th className="p-3">سبب الاستبدال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {allReplacedParts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                          لم تسجل أي عمليات استبدال لقطع الغيار لهذه الآلة حتى الآن
                        </td>
                      </tr>
                    ) : (
                      allReplacedParts.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 pr-4 font-mono font-bold text-emerald-700">{item.requestCode}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 dir-ltr text-right">{item.date}</td>
                          <td className="p-3 font-bold text-slate-900">
                            {item.partName} <span className="text-slate-400 font-mono text-[10px]">({item.partCode})</span>
                          </td>
                          <td className="p-3 text-center font-bold text-blue-900">{item.quantity}</td>
                          <td className="p-3 text-center font-mono">{item.unitPrice.toLocaleString()} {item.currency || '$'}</td>
                          <td className="p-3 text-center font-mono font-bold text-amber-800 bg-amber-50/50">{item.totalPrice.toLocaleString()} {item.currency || '$'}</td>
                          <td className="p-3 font-bold text-slate-800">{item.technicianName}</td>
                          <td className="p-3 text-slate-600">{item.faultType}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Financial & Cost Audit per Machine */}
          {activeTab === 'costs' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  جدول مطابقة التكاليف والتدقيق المالي التراكمي للآلة: {selectedAsset.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  مقارنة مالية دقيقة بين سعر شراء الآلة وتكاليف قطع الغيار والعمالة المخصصة
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Cost Breakdown Details Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 p-3 font-bold text-slate-900 border-b border-slate-200">
                    تفاصيل مكونات تكلفة الآلة المباشرة
                  </div>
                  <div className="p-4 space-y-3 font-medium">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-600">قيمة شراء الآلة عند التأسيس:</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">${purchasePrice.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-600">إجمالي تكلفة قطع الغيار المبدلة:</span>
                      <span className="font-bold text-amber-800 font-mono text-sm">${totalSparePartsCost.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-600">تكلفة ورشة خارجية ({totalRepairHours.toFixed(1)} ساعة):</span>
                      <span className="font-bold text-purple-800 font-mono text-sm">${totalExternalWorkshopCost.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-bold mt-2">
                      <span className="text-emerald-900">إجمالي مصاريف الصيانة والتشغيل:</span>
                      <span className="text-emerald-900 font-mono text-base">${totalOverallMaintenanceCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Economic Analysis Card */}
                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    المؤشرات المدرسية وكفاءة الاستثمار الفني
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-700 font-bold mb-1">
                        <span>نسبة مصاريف الصيانة من أصل الشراء:</span>
                        <span className="font-mono text-emerald-800">{maintenanceToValueRatio}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(parseFloat(maintenanceToValueRatio), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">التقييم الفني والجدوى الاقتصادية:</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {parseFloat(maintenanceToValueRatio) < 25
                          ? 'الآلة في حالة ممتازة جودة ممتازة، ونسبة تكاليف الصيانة أقل من 25% من قيمة الأصل. يوصى بالاستمرار في برنامج الصيانة الوقائية الحالي.'
                          : 'الآلة تتطلب متابعة دورية مستمرة مع تدقيق قطع الغيار عالية الاستهلاك لتجنب ارتفاع التكاليف.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
};

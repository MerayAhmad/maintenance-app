import React, { useState } from 'react';
import { useApp, sortRequestsNewestFirst } from '../context/AppContext';
import { downloadWordReport } from '../utils/generateWordReport';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  Building2,
  Box,
  Plus,
  ArrowRight,
  Eye,
  Activity,
  Layers,
  ArrowUpRight,
  Calendar,
  BarChart2,
  Download,
  FileDown,
  RotateCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { requests, assets, departments, users, setActiveView, setSubView, activeRole, currentUser, technicians } = useApp();

  // Full access roles (Admin and Maintenance Manager) see all system statistics
  const isFullAccessRole =
    activeRole === 'admin' ||
    activeRole === 'maintenance_manager' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'maintenance_manager';

  const currentTech = technicians?.find(t =>
    currentUser?.username && t.username.toLowerCase() === currentUser.username.toLowerCase()
  );

  // Filter requests for standard users (Employee / Technician) to only show their own requests
  const relevantRequests = isFullAccessRole
    ? requests
    : requests.filter(r => {
        // Check if current user is the requester
        const isRequester =
          (currentUser?.id && r.requesterId === currentUser.id) ||
          (currentUser?.name && r.requesterName && (
            r.requesterName.toLowerCase().trim() === currentUser.name.toLowerCase().trim() ||
            r.requesterName.toLowerCase().trim().includes(currentUser.name.toLowerCase().trim()) ||
            currentUser.name.toLowerCase().trim().includes(r.requesterName.toLowerCase().trim())
          ));

        // Check if current user is the assigned technician
        const isAssignedTech =
          (currentUser?.id && r.technicianId === currentUser.id) ||
          (currentTech?.id && r.technicianId === currentTech.id) ||
          (currentUser?.name && r.technicianName && (
            r.technicianName.toLowerCase().trim() === currentUser.name.toLowerCase().trim() ||
            r.technicianName.toLowerCase().trim().includes(currentUser.name.toLowerCase().trim()) ||
            currentUser.name.toLowerCase().trim().includes(r.technicianName.toLowerCase().trim())
          ));

        return isRequester || isAssignedTech;
      });

  // Top KPIs Calculations
  const newRequestsCount = relevantRequests.filter(r => r.status === 'new').length;
  const openRequestsCount = relevantRequests.filter(r => ['assigned', 'in_progress', 'external_pending_maint_mgr', 'external_pending_gm', 'external_approved_by_gm', 'external_in_execution', 'pending_approval', 'pending_closure'].includes(r.status)).length;
  const closedRequestsCount = relevantRequests.filter(r => r.status === 'closed' || r.status === 'received').length;
  const criticalFaultsCount = relevantRequests.filter(r => r.priority === 'critical' && r.status !== 'closed' && r.status !== 'received' && r.status !== 'cancelled').length;

  // Multi-Year Maintenance Requests Analytics State & Calculations
  const [selectedChartYear, setSelectedChartYear] = React.useState<number>(2026);
  const [chartViewMode, setChartViewMode] = React.useState<'monthly' | 'yearly_comparison'>('monthly');

  // Dynamically extract all available years from relevant requests
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>([2024, 2025, 2026]);
    relevantRequests.forEach(r => {
      const dateStr = r.creationDate || r.faultOccurrenceDate;
      if (dateStr) {
        const match = dateStr.match(/(\d{4})/);
        if (match) {
          yearsSet.add(parseInt(match[1], 10));
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a); // [2026, 2025, 2024]
  }, [relevantRequests]);

  // Arabic Month Names
  const ARABIC_MONTHS = [
    'كانون 2',
    'شباط',
    'آذار',
    'نيسان',
    'أيار',
    'حزيران',
    'تموز',
    'آب',
    'أيلول',
    'تشرين 1',
    'تشرين 2',
    'كانون 1'
  ];

  // Accurate Monthly Requests Chart Data for Selected Year
  const monthlyDataForSelectedYear = React.useMemo(() => {
    const monthsArray = ARABIC_MONTHS.map((mName, idx) => ({
      month: mName,
      monthIndex: idx + 1,
      requestsCount: 0,
      closedCount: 0
    }));

    relevantRequests.forEach(r => {
      const dateStr = r.creationDate || r.faultOccurrenceDate;
      if (dateStr) {
        const match = dateStr.match(/(\d{4})[-/](\d{1,2})/);
        if (match) {
          const reqYear = parseInt(match[1], 10);
          const reqMonth = parseInt(match[2], 10);

          if (reqYear === selectedChartYear && reqMonth >= 1 && reqMonth <= 12) {
            monthsArray[reqMonth - 1].requestsCount += 1;
            if (r.status === 'closed' || r.status === 'received') {
              monthsArray[reqMonth - 1].closedCount += 1;
            }
          }
        }
      }
    });

    return monthsArray;
  }, [relevantRequests, selectedChartYear]);

  // Multi-Year Comparison Data across all available years
  const multiYearComparisonData = React.useMemo(() => {
    return availableYears.slice().reverse().map(yr => {
      let totalReqs = 0;
      let closedReqs = 0;

      relevantRequests.forEach(r => {
        const dateStr = r.creationDate || r.faultOccurrenceDate;
        if (dateStr) {
          const match = dateStr.match(/(\d{4})/);
          if (match && parseInt(match[1], 10) === yr) {
            totalReqs += 1;
            if (r.status === 'closed' || r.status === 'received') {
              closedReqs += 1;
            }
          }
        }
      });

      return {
        year: `سنة ${yr}`,
        yearNum: yr,
        requestsCount: totalReqs,
        closedCount: closedReqs
      };
    });
  }, [relevantRequests, availableYears]);

  // Active Chart Year Totals for Summary Bar
  const selectedYearTotalRequests = monthlyDataForSelectedYear.reduce((acc, m) => acc + m.requestsCount, 0);
  const selectedYearTotalClosed = monthlyDataForSelectedYear.reduce((acc, m) => acc + m.closedCount, 0);
  const selectedYearCompletionRate = selectedYearTotalRequests > 0
    ? Math.round((selectedYearTotalClosed / selectedYearTotalRequests) * 100)
    : 0;

  // Asset Type Pie Chart Data
  const mechanicalCount = assets.filter(a => a.typeName?.includes('ميكانيك')).length;
  const electricalCount = assets.filter(a => a.typeName?.includes('كهربائ')).length;
  const electronicCount = assets.filter(a => a.typeName?.includes('الكترون')).length;
  const otherCount = Math.max(0, assets.length - (mechanicalCount + electricalCount + electronicCount));

  const assetTypePieData = [
    { name: 'آلات ميكانيكية', value: mechanicalCount, color: '#2563eb' },
    { name: 'أجهزة كهربائية', value: electricalCount, color: '#059669' },
    { name: 'أجهزة الكترونية', value: electronicCount, color: '#7c3aed' },
    { name: 'هيدروليك وأخرى', value: otherCount, color: '#d97706' }
  ];

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-800', label: 'جديد' },
    assigned: { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-800', label: 'قيد التعيين' },
    in_progress: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-800', label: 'قيد الإصلاح' },
    pending_approval: { bg: 'bg-orange-100 border-orange-200', text: 'text-orange-800', label: 'بانتظار توقيع مدير الصيانة' },
    pending_closure: { bg: 'bg-indigo-100 border-indigo-200', text: 'text-indigo-800', label: 'بانتظار إغلاق طالب الصيانة' },
    closed: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', label: 'مغلق (تم الإصلاح)' },
    received: { bg: 'bg-teal-100 border-teal-200', text: 'text-teal-800', label: 'مستلم (Received)' },
    cancelled: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', label: 'ملغى' }
  };

  const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'منخفض' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'متوسط' },
    high: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'مرتفع' },
    critical: { bg: 'bg-rose-100 text-rose-800 border border-rose-200 font-bold', text: 'text-rose-800', label: 'حرج جداً' }
  };

  return (
    <div className="space-y-6 text-[#0f172a] dir-rtl">
      
      {/* Top Welcome Executive Banner matching Royal Blue Palette */}
      <div className="bg-gradient-to-r from-[#1746c8] via-[#1d4ed8] to-[#0c2770] text-white p-6 rounded-2xl shadow-md border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 bg-blue-200 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-bold text-blue-100 tracking-wider">
              {isFullAccessRole ? 'لوحة القيادة والمتابعة الشاملة للنظام' : `إحصائيات طلبات الصيانة الخاصة بك (${currentUser?.name || 'المستخدم'})`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {isFullAccessRole ? 'لوحة تحكم إدارة الصيانة والتشغيل الآلي' : 'لوحة متابعة طلباتي وإحصائيات الخدمة'}
          </h2>
          <p className="text-xs text-blue-100/90 mt-1">
            {isFullAccessRole
              ? 'متابعة فورية وشاملة لجميع طلبات صيانة الآلات والمعدات، خطوط الإنتاج، ومؤشرات الأداء التشغيلي'
              : 'عرض ومتابعة حالة جميع طلبات الصيانة الخاصة بك، نسبة الإنجاز والتحديثات المباشرة'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => downloadWordReport()}
            className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/30 transition-all shadow-xs flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            title="تحميل التقرير التعريفي الشامل للنظام كملف Word (.docx)"
          >
            <FileDown className="w-4 h-4 text-blue-200" />
            <span>تحميل التقرير (Word)</span>
          </button>

          <button
            onClick={() => {
              setActiveView('requests');
              setSubView('create');
            }}
            className="bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-700" />
            <span>طلب صيانة جديد</span>
          </button>
        </div>
      </div>

      {/* Top 4 Dashboard KPI Data Grid Matching Capture2.JPG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: إجمالي الطلبات (Blue Accent Bar) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 border-r-4 border-r-blue-600 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-sm font-extrabold text-slate-600 block">إجمالي طلبات الصيانة</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 block font-sans tracking-tight">{relevantRequests.length}</span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 block">
              المتابعة العامة
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: مفتوحة وحرجة (Rose Accent Bar) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 border-r-4 border-r-rose-500 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-sm font-extrabold text-slate-600 block">مفتوحة / حرجة</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 block font-sans tracking-tight">{criticalFaultsCount + newRequestsCount}</span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 block">
              تحتاج إجراء فوري
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: قيد الإصلاح (Amber Accent Bar) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 border-r-4 border-r-amber-500 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-sm font-extrabold text-slate-600 block">قيد الإصلاح والمعالجة</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 block font-sans tracking-tight">{openRequestsCount}</span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 block">
              نشطة الآن
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: مكتملة (Purple Accent Bar) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 border-r-4 border-r-purple-500 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-sm font-extrabold text-slate-600 block">الإصلاحات المكتملة</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 block font-sans tracking-tight">{closedRequestsCount}</span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-400 block">
              قيد المراجعة والاعتماد
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Section 1 Matching Capture2.JPG: شكاوى / طلبات واردة من الأقسام */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-700 border border-blue-200/70 px-2.5 py-0.5 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>بانتظار استلام الصيانة</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              طلبات صيانة واردة من الأقسام
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              أدخل الرقم الداخلي أو انقر على الطلب لمتابعة إجراءات الفحص والإصلاح بالتوازي مع الأقسام المعنية.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              {newRequestsCount} جديدة
            </span>
            <button
              onClick={() => {
                setActiveView('requests');
                setSubView('view');
              }}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {newRequestsCount === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            لا توجد طلبات صيانة جديدة بانتظار التعيين حالياً. اضغط «تحديث» بعد أن يسجل أي قسم طلباً جديداً.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {relevantRequests.filter(r => r.status === 'new').slice(0, 3).map(req => (
              <div
                key={req.id}
                onClick={() => {
                  setActiveView('requests');
                  setSubView('view');
                }}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{req.requestNumber || req.id}</span>
                      <span className="text-slate-400 font-normal">|</span>
                      <span>{req.assetName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-md">
                      {req.faultDescription}
                    </p>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-[10px] text-blue-700 bg-blue-50 font-bold px-2 py-0.5 rounded-md">
                    {req.departmentName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2 Matching Capture2.JPG: توزيع متعدد الأقسام */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 border border-blue-200/70 px-2.5 py-0.5 rounded-lg text-xs font-bold inline-flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>توزيع متعدد الأقسام</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            تصل الشكوى والطلب أولاً إلى قسم الصيانة من القسم الذي سجلها، ثم يحدد المشرف والمهندس الرقم الداخلي ويختار جميع الأقسام والفنيين المعنيين للعمل بالتوازي.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveView('requests');
            setSubView('create');
          }}
          className="border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 text-slate-800 hover:text-blue-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>تسجيل طلب صيانة جديد</span>
        </button>
      </div>

      {/* Monthly Requests Bar Chart + Device Types Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly & Multi-Year Maintenance Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                حركة طلبات الصيانة والإنجاز (مخطط متعدد السنوات)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                متابعة دقيقة ومطابقة للواقع لعدد الطلبات المستلمة مقابل المنجزة شهرياً وسنوياً
              </p>
            </div>

            {/* Year Selector & View Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mode Toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center text-[11px] font-bold">
                <button
                  onClick={() => setChartViewMode('monthly')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  عرض شهري
                </button>
                <button
                  onClick={() => setChartViewMode('yearly_comparison')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'yearly_comparison'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مقارنة السنوات
                </button>
              </div>

              {/* Year Dropdown (visible in monthly mode) */}
              {chartViewMode === 'monthly' && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500 font-bold text-[11px]">السنة:</span>
                  <select
                    value={selectedChartYear}
                    onChange={(e) => setSelectedChartYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-slate-900 cursor-pointer focus:outline-none"
                  >
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar for Selected Year */}
          {chartViewMode === 'monthly' && (
            <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">إجمالي طلبات {selectedChartYear}</span>
                <span className="text-sm sm:text-base font-extrabold text-blue-700 font-mono">{selectedYearTotalRequests}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">المغلقة والمنجزة</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono">{selectedYearTotalClosed}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">نسبة الإنجاز السنوية</span>
                <span className="text-sm sm:text-base font-extrabold text-purple-700 font-mono">{selectedYearCompletionRate}%</span>
              </div>
            </div>
          )}

          {/* Recharts Bar Chart */}
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartViewMode === 'monthly' ? monthlyDataForSelectedYear : multiYearComparisonData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={chartViewMode === 'monthly' ? 'month' : 'year'}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                <Bar dataKey="requestsCount" name="إجمالي طلبات الصيانة" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="closedCount" name="الطلبات المنجزة والمغلقة" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              توزيع الآلات حسب التصنيف
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              نسب التغطية الفنية لكل فئة أصول
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetTypePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetTypePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold pt-1">
            {assetTypePieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-700 truncate">{item.name}:</span>
                <span className="text-slate-900 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Department Breakdown: Users & Assets Stats */}
      {isFullAccessRole && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                إحصائيات الأصول والمستخدمين الفعلية لكل قسم
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                توزيع مستخدمي النظام والآلات والأجهزة حسب الأقسام بشكل دقيق ومباشر
              </p>
            </div>
            <button
              onClick={() => {
                setActiveView('departments');
                setSubView('view');
              }}
              className="text-sm font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition-colors"
            >
              <span>إدارة الأقسام</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {departments.map(dept => {
              const deptUsers = users.filter(u => u.departmentId === dept.id || u.departmentName === dept.name).length;
              const deptAssets = assets.filter(a => a.departmentId === dept.id || a.departmentName === dept.name).length;
              return (
                <div key={dept.id} className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 p-4 rounded-xl space-y-2.5 transition-all shadow-2xs">
                  <div className="text-sm sm:text-base font-black text-slate-900 truncate" title={dept.name}>
                    {dept.name}
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-200">
                    <span className="text-slate-600 font-bold">المستخدمين:</span>
                    <span className="font-mono font-black text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-lg">{deptUsers}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-600 font-bold">الأصول والآلات:</span>
                    <span className="font-mono font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-lg">{deptAssets}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-3 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            {isFullAccessRole ? 'أحدث بلاغات وطلبات الصيانة المسجلة للنظام' : 'أحدث طلبات الصيانة الخاصة بك'}
          </h3>

          <button
            onClick={() => {
              setActiveView('requests');
              setSubView('view');
            }}
            className="text-sm font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-colors"
          >
            <span>عرض كافة الطلبات</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {relevantRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-bold text-sm">
              لا توجد طلبات صيانة مسجلة خاصة بك حالياً.
            </div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pr-4">كود الطلب</th>
                  <th className="p-3.5 text-base">اسم الآلة / الأصل</th>
                  <th className="p-3.5">القسم المالك</th>
                  <th className="p-3.5">طالب الصيانة</th>
                  <th className="p-3.5">نوع العطل</th>
                  <th className="p-3.5">الأولوية</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 pl-4">الفني المكلف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {sortRequestsNewestFirst(relevantRequests).slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pr-4 font-mono font-bold text-emerald-700">{req.code}</td>
                    <td className="p-3.5 font-extrabold text-slate-900 text-sm sm:text-base">{req.assetName}</td>
                    <td className="p-3.5 text-slate-700">{req.departmentName}</td>
                    <td className="p-3.5 text-slate-800 font-bold">{req.requesterName}</td>
                    <td className="p-3.5 text-slate-800 font-bold">{req.faultTypeName}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${priorityColors[req.priority]?.bg || 'bg-slate-100'}`}>
                        {priorityColors[req.priority]?.label || req.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold border ${statusColors[req.status]?.bg || 'bg-slate-100'} ${statusColors[req.status]?.text || 'text-slate-800'}`}>
                        {statusColors[req.status]?.label || req.status}
                      </span>
                    </td>
                    <td className="p-3.5 pl-4 font-extrabold text-slate-800">
                      {req.technicianName || <span className="text-slate-400 font-normal">غير معين</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

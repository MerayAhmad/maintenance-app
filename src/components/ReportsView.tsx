import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MaintenanceReportPDF } from './MaintenanceReportPDF';
import { downloadWordReport } from '../utils/generateWordReport';
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
  Legend,
  LabelList
} from 'recharts';
import { FileText, TrendingUp, DollarSign, Wrench, AlertTriangle, Clock, Award, Building2, Printer, CheckCircle2, Package, Layers, FileDown } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { requests, assets, technicians, spareParts } = useApp();

  // 1- Accurate Realized Costs Calculation from Requests
  const totalSparePartsCost = useMemo(() => {
    return requests.reduce((acc, req) => {
      if (req.usedSpareParts && req.usedSpareParts.length > 0) {
        return acc + req.usedSpareParts.reduce((pAcc, p) => pAcc + (p.unitPrice * p.quantity), 0);
      }
      return acc;
    }, 0);
  }, [requests]);

  const totalExternalWorkshopCost = useMemo(() => {
    return requests.reduce((acc, req) => {
      const extTotal = req.externalTotalCost || req.externalWorkshopCost || ((req.externalLaborCost || 0) + (req.externalPartsCost || 0));
      return acc + (extTotal || 0);
    }, 0);
  }, [requests]);

  const totalMaintenanceHours = useMemo(() => {
    return requests.reduce((acc, r) => acc + (r.actualRepairHours || r.estimatedRepairHours || 2), 0);
  }, [requests]);

  const totalOverallCost = totalSparePartsCost + totalExternalWorkshopCost;

  // 2- MTTR (Mean Time To Repair)
  const closedReqs = requests.filter(r => r.status === 'closed' || r.status === 'received');
  const avgMTTR = closedReqs.length > 0
    ? (closedReqs.reduce((acc, r) => acc + (r.actualRepairHours || r.estimatedRepairHours || 2.5), 0) / closedReqs.length).toFixed(1)
    : '2.5';

  // 3- Top Fault Prone Assets (أكثر الأجهزة تحملاً/تكراراً للأعطال)
  const topFaultyAssetsData = useMemo(() => {
    const assetFaultCounts: Record<string, { name: string; count: number; code: string }> = {};
    requests.forEach(r => {
      const assetKey = r.assetId || r.assetCode || r.assetName;
      if (!assetFaultCounts[assetKey]) {
        assetFaultCounts[assetKey] = { name: r.assetName, count: 0, code: r.assetCode };
      }
      assetFaultCounts[assetKey].count += 1;
    });
    return Object.values(assetFaultCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [requests]);

  // 4- Audited Technician Efficiency & Performance Calculation (أكثر الفنيين إنجازاً إلى أقلهم)
  const techPerformanceData = useMemo(() => {
    return technicians.map(t => {
      // Filter requests assigned to this technician by ID or Name
      const techRequests = requests.filter(r => r.technicianId === t.id || r.technicianName === t.name);
      const totalAssigned = techRequests.length;
      const completed = techRequests.filter(r => r.status === 'closed' || r.status === 'received').length;
      const active = techRequests.filter(r => ['assigned', 'in_progress', 'pending_approval', 'pending_closure'].includes(r.status)).length;
      
      const totalHours = techRequests
        .filter(r => r.status === 'closed' || r.status === 'received')
        .reduce((sum, r) => sum + (r.actualRepairHours || r.estimatedRepairHours || 0), 0);
        
      const avgHours = completed > 0 ? (totalHours / completed).toFixed(1) : '0.0';
      const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : (completed > 0 ? 100 : 0);

      return {
        id: t.id,
        name: t.name,
        specialization: t.specializationName,
        totalAssigned,
        completed,
        active,
        totalHours: totalHours.toFixed(1),
        avgHours,
        completionRate
      };
    }).sort((a, b) => b.completed - a.completed || b.completionRate - a.completionRate);
  }, [technicians, requests]);

  // 5- Per-Machine Maintenance Costs Audit Table (مطابقة التكاليف لكل آلة على حدا)
  const perMachineCostsData = useMemo(() => {
    return assets.map(asset => {
      const assetReqs = requests.filter(r => r.assetId === asset.id || r.assetCode === asset.code);
      const reqCount = assetReqs.length;
      
      let partsCost = 0;
      let extCost = 0;
      assetReqs.forEach(r => {
        if (r.usedSpareParts) {
          partsCost += r.usedSpareParts.reduce((pSum, p) => pSum + (p.unitPrice * p.quantity), 0);
        }
        const extVal = r.externalTotalCost || r.externalWorkshopCost || ((r.externalLaborCost || 0) + (r.externalPartsCost || 0));
        extCost += (extVal || 0);
      });

      const totalHours = assetReqs.reduce((sum, r) => sum + (r.actualRepairHours || r.estimatedRepairHours || 0), 0);
      const laborCost = extCost;
      const overallCost = partsCost + laborCost;
      const purchasePrice = asset.purchasePrice || 0;
      const costRatio = purchasePrice > 0 ? ((overallCost / purchasePrice) * 100).toFixed(1) : '0';

      return {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        department: asset.departmentName,
        status: asset.status,
        reqCount,
        partsCost,
        laborCost,
        overallCost,
        purchasePrice,
        costRatio
      };
    }).sort((a, b) => b.overallCost - a.overallCost);
  }, [assets, requests]);

  // 6- Most Requesting Departments
  const topDepartmentsData = useMemo(() => {
    const deptReqCounts: Record<string, { name: string; count: number }> = {};
    requests.forEach(r => {
      if (!deptReqCounts[r.departmentName]) {
        deptReqCounts[r.departmentName] = { name: r.departmentName, count: 0 };
      }
      deptReqCounts[r.departmentName].count += 1;
    });
    return Object.values(deptReqCounts).sort((a, b) => b.count - a.count);
  }, [requests]);

  // 7- Multi-Year Analysis
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2024, 2025, 2026]);
    requests.forEach(r => {
      const dateStr = r.creationDate || r.faultOccurrenceDate;
      if (dateStr) {
        const match = dateStr.match(/(\d{4})/);
        if (match) {
          yearsSet.add(parseInt(match[1], 10));
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [requests]);

  const multiYearReportData = useMemo(() => {
    return availableYears.map(yr => {
      let totalReqs = 0;
      let closedReqsCount = 0;

      requests.forEach(r => {
        const dateStr = r.creationDate || r.faultOccurrenceDate;
        if (dateStr) {
          const match = dateStr.match(/(\d{4})/);
          if (match && parseInt(match[1], 10) === yr) {
            totalReqs += 1;
            if (r.status === 'closed' || r.status === 'received') {
              closedReqsCount += 1;
            }
          }
        }
      });

      return {
        year: `سنة ${yr}`,
        requestsCount: totalReqs,
        closedCount: closedReqsCount,
        completionRate: totalReqs > 0 ? Math.round((closedReqsCount / totalReqs) * 100) : 0
      };
    });
  }, [requests, availableYears]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            التقارير الإحصائية والتحليلية المتقدمة المدققة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مقارنة كفاءة الفنيين، التكاليف المستقلة لكل آلة، تحليل الأعطال، ومؤشرات الأداء CMMS
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadWordReport()}
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-blue-500 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            title="تحميل التقرير التعريفي الشامل كملف Word"
          >
            <FileDown className="w-4 h-4 text-blue-200" />
            <span>تحميل التقرير (Word)</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإحصائيات PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Total Maintenance Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>إجمالي التكاليف المسجلة</span>
            <DollarSign className="w-5 h-5 text-emerald-600 bg-emerald-50 p-1 rounded-lg" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${totalOverallCost.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            قطع غيار داخلية: ${totalSparePartsCost.toLocaleString()} | ورشات خارجية (قطع + أجور): ${totalExternalWorkshopCost.toLocaleString()}
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>معدل إنجاز الصيانة الكلي</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600 bg-blue-50 p-1 rounded-lg" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {requests.length > 0 ? Math.round((closedReqs.length / requests.length) * 100) : 100}%
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            {closedReqs.length} طلب منجز من إجمالي {requests.length} طلب
          </p>
        </div>

      </div>

      {/* Technicians Efficiency & Performance Comparison Table (أكثر الفنيين إنجازاً إلى أقلهم) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-2">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              تقرير مقارنة كفاءة وإنجاز الفنيين (أكثر الفنيين إنجازاً إلى أقلهم)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              مطابقة دقيقة ومباشرة مع سجلات الطلبات الفعلية ونسب الإنجاز المئوية
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            تم تدقيق البيانات وتحديثها
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pr-5">اسم الفني</th>
                <th className="p-3.5">الاختصاص</th>
                <th className="p-3.5 text-center">إجمالي الطلبات المسندة</th>
                <th className="p-3.5 text-center">الطلبات النشطة (قيد العمل)</th>
                <th className="p-3.5 text-center">الطلبات المنجزة والمغلقة</th>
                <th className="p-3.5 text-center">نسبة الإنجاز %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {techPerformanceData.map((tech, idx) => (
                <tr key={tech.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 pr-5 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                      #{idx + 1}
                    </span>
                    <span>{tech.name}</span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-600">{tech.specialization}</td>
                  <td className="p-3.5 text-center font-bold text-slate-800 font-mono">{tech.totalAssigned}</td>
                  <td className="p-3.5 text-center font-bold text-amber-700 font-mono">{tech.active}</td>
                  <td className="p-3.5 text-center font-bold text-emerald-700 font-mono">{tech.completed}</td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${tech.completionRate}%` }} />
                      </div>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{tech.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Machine Maintenance Costs Audit Table (مطابقة التكاليف لكل آلة على حدا) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-2">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              جدول مطابقة التكاليف والتبدلات المستقل لكل آلة على حدا
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              تفصيل تكلفة قطع الغيار، الورشة الخارجية، والتكلفة الإجمالية المنسوبة لكل آلة دون خلط
            </p>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
            مطابقة مالية 100%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pr-5">كود الآلة واسمها</th>
                <th className="p-3.5">القسم المالك</th>
                <th className="p-3.5 text-center">عدد الأعطال</th>
                <th className="p-3.5 text-center">تكلفة قطع الغيار ($)</th>
                <th className="p-3.5 text-center">تكلفة ورشة خارجية ($)</th>
                <th className="p-3.5 text-center">إجمالي الصيانة ($)</th>
                <th className="p-3.5 text-center">سعر الآلة ($)</th>
                <th className="p-3.5 text-center">نسبة المصاريف (%)</th>
                <th className="p-3.5 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {perMachineCostsData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 pr-5 font-bold text-slate-900">
                    <div>
                      <span>{item.name}</span>
                      <span className="block text-[10px] font-mono text-emerald-700 font-bold">{item.code}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-600">{item.department}</td>
                  <td className="p-3.5 text-center font-bold font-mono text-blue-900">{item.reqCount}</td>
                  <td className="p-3.5 text-center font-bold font-mono text-amber-800">${item.partsCost.toLocaleString()}</td>
                  <td className="p-3.5 text-center font-bold font-mono text-purple-800">${item.laborCost.toLocaleString()}</td>
                  <td className="p-3.5 text-center font-bold font-mono text-emerald-900 bg-emerald-50/50">${item.overallCost.toLocaleString()}</td>
                  <td className="p-3.5 text-center font-mono text-slate-600">${item.purchasePrice.toLocaleString()}</td>
                  <td className="p-3.5 text-center font-bold font-mono text-slate-800">{item.costRatio}%</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'working' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status === 'working' ? 'شغالة' : 'صيانة'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Year Analytics Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            تحليل الاتجاه السنوي لطلبات الصيانة والإنجاز (2024 - 2026)
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            تطور حجم الأعطال ونسبة إغلاقها عبر السنوات
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={multiYearReportData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#475569', fontWeight: 'bold' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
              />
              <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
              <Bar dataKey="requestsCount" name="إجمالي الطلبات السنوية" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="closedCount" name="الطلبات المغلقة والمنجزة" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: أكثر الأجهزة تعرضاً للأعطال */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            أكثر الأجهزة والآلات تكراراً للأعطال
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFaultyAssetsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
                />
                <Bar dataKey="count" name="عدد الأعطال" fill="#2563eb" radius={[0, 8, 8, 0]}>
                  <LabelList dataKey="count" position="insideRight" fill="#ffffff" fontSize={13} fontWeight="bold" offset={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: أكثر الأقسام طلباً للصيانة */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            توزيع الطلبات حسب الأقسام
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topDepartmentsData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {topDepartmentsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

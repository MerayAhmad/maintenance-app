import React from 'react';
import { MaintenanceRequest } from '../types';
import { useApp } from '../context/AppContext';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface MaintenanceReportPDFProps {
  request?: MaintenanceRequest | null;
  onClose?: () => void;
}

export const MaintenanceReportPDF: React.FC<MaintenanceReportPDFProps> = ({ request, onClose }) => {
  const { departments, users, assets, faultTypes } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const isRequestProvided = Boolean(request);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Status flags
  const status = request?.status;
  const isReceived = status === 'received' || Boolean(request?.receivedDate);
  const isClosed = status === 'closed';
  const isCompletedOrClosed = isClosed || isReceived || status === 'pending_approval' || status === 'pending_closure';
  const isInProgress = status === 'in_progress';
  const isAssigned = status === 'assigned';
  const isNew = status === 'new';
  const isCancelled = status === 'cancelled';

  // Status Label for PDF header badge
  const statusLabelMap: Record<string, string> = {
    new: 'جديد (قيد الانتظار)',
    assigned: 'تم تعيين فني',
    in_progress: 'قيد التنفيذ',
    pending_approval: 'بانتظار توقيع مدير الصيانة',
    pending_closure: 'بانتظار إغلاق طالب الصيانة',
    closed: 'مغلق (مكتمل الصيانة ومستلم)',
    received: 'مستلم ومطابق (Received)',
    cancelled: 'ملغى'
  };
  const statusBadgeText = isRequestProvided ? (statusLabelMap[status || 'new'] || 'جديد') : 'نموذج معاينة رسمي';

  // Core Fields
  const code = request?.code || 'REQ-001';
  const assetName = request?.assetName || (isRequestProvided ? 'غير محدد' : 'آلة الختم المعدني في خط غرونينغر');
  const assetObj = assets?.find(a => a.id === request?.assetId || a.name === request?.assetName);
  const assetCode = request?.assetCode || assetObj?.code || (isRequestProvided ? '---' : 'GRN-SEAL-01');
  const departmentName = request?.departmentName || (isRequestProvided ? 'عام' : 'الانتاج');
  const faultOccurrenceDate = request?.faultOccurrenceDate || request?.creationDate || (isRequestProvided ? 'لم يحدد' : '2026-08-09 | 14:07');
  const description = request?.description || (isRequestProvided ? 'لا يوجد وصف مدون' : 'توقف أحد سيور الآلة عن العمل بشكل مفاجئ');
  const requesterName = request?.requesterName || (isRequestProvided ? 'غير محدد' : 'علاء بطحيش');
  const creationDate = request?.creationDate || (isRequestProvided ? 'غير محدد' : '2026-08-09 | 14:07');

  // Department & Maintenance Managers
  const dept = departments.find(d => d.id === request?.departmentId || d.name === request?.departmentName);
  const deptManagerName = dept?.managerName || (isRequestProvided ? 'المدير المباشر' : 'علاء بطحيش');
  const maintManagerObj = users.find(u => u.role === 'maintenance_manager');
  const maintManagerName = maintManagerObj?.name || 'المهندس اسماعيل زغموت';

  // Priorities
  const priorities = [
    { key: 'critical', label: 'حرج جداً' },
    { key: 'high', label: 'عالي' },
    { key: 'medium', label: 'متوسط' },
    { key: 'low', label: 'منخفض' }
  ];
  const currentPriority = request?.priority || 'critical';

  // Diagnosed Fault Types (Determined by Maintenance Manager)
  const diagnosedFaultNames: string[] = [];
  if (request?.faultTypeNames && request.faultTypeNames.length > 0) {
    diagnosedFaultNames.push(...request.faultTypeNames);
  } else if (request?.faultTypeName && request.faultTypeName !== 'بانتظار تحديد مدير الصيانة') {
    diagnosedFaultNames.push(request.faultTypeName);
  } else if (request?.faultTypeId) {
    const ftObj = faultTypes.find(f => f.id === request.faultTypeId);
    if (ftObj) diagnosedFaultNames.push(ftObj.name);
  }

  // Execution / Tech Info (Only populated if executed/in-progress)
  let executionDateTime = '..................';
  if (isRequestProvided) {
    if (request?.executionDateTime && request.executionDateTime.trim() !== '') {
      executionDateTime = request.executionDateTime;
    } else if (request?.executionDate) {
      executionDateTime = `${request.executionDate} ${request.executionTime || ''}`.trim();
    } else if (isInProgress) {
      executionDateTime = 'جاري العمل (قيد التنفيذ حالياً)';
    } else if (isNew || isAssigned) {
      executionDateTime = '.................. (لم يبدأ التنفيذ بعد)';
    } else if (isCancelled) {
      executionDateTime = '.................. (تم إلغاء الطلب)';
    }
  } else {
    executionDateTime = '2026-08-09 | 15:30';
  }

  // Work Executed / Technical Report
  let technicalReport = '...............................................................';
  if (isRequestProvided) {
    if (request?.technicalReport && request.technicalReport.trim() !== '') {
      technicalReport = request.technicalReport;
    } else if (isCancelled) {
      technicalReport = 'ملغى - لم يتم إجراء أية عمليات صيانة';
    } else if (isNew || isAssigned) {
      technicalReport = 'لم يتم التنفيذ بعد (الطلب جديد وقيد الانتظار وتكليف الفني)';
    } else if (isInProgress) {
      technicalReport = 'عمليات الفحص والتشخيص والإصلاح قيد المباشرة حالياً';
    } else if (isCompletedOrClosed) {
      technicalReport = 'تم إجراء الصيانة اللازمة واختبار جاهزية الجهاز/الآلة بنجاح';
    }
  } else {
    technicalReport = 'تبين وجود عطل في الانفيرتر حيث تم إصلاحه وإعادة تركيبه وتجربة التشغيل بنجاح.';
  }

  // Technician Name
  let technicianName = '..................';
  if (isRequestProvided) {
    if (request?.technicianName && request.technicianName.trim() !== '') {
      technicianName = request.technicianName;
    } else if (isNew) {
      technicianName = '.................. (لم يُعين فني بعد)';
    }
  } else {
    technicianName = 'المهندس عمر الأحمد';
  }

  // Receipt Section (STRICTLY populated ONLY if the request status is 'received' or has explicit receivedDate)
  let receiptDate = '..................';
  let receiptTime = '........';
  let receiptRequester = '..................';
  let receiptNotes = '..................';
  let recipientSignature = '..................';

  if (isRequestProvided) {
    if (isReceived || isClosed) {
      receiptRequester = request?.closedByRequesterName || requesterName;
      recipientSignature = request?.closedByRequesterName || requesterName;
      receiptNotes = request?.ratingFeedback || 'تم استلام وتجربة الجهاز/الآلة وهو بحالة تشغيلية ممتازة ومطابقة وإغلاق الطلب';

      const dateToUse = request?.receivedDate || request?.closureDate;
      if (dateToUse) {
        if (dateToUse.includes('(')) {
          const parts = dateToUse.split('(');
          receiptDate = parts[0].trim() || todayStr;
          receiptTime = parts[1]?.replace(')', '').trim() || '12:00 م';
        } else if (dateToUse.includes(' ')) {
          const parts = dateToUse.split(' ');
          receiptDate = parts[0].trim() || todayStr;
          receiptTime = parts.slice(1).join(' ').trim() || '12:00 م';
        } else {
          receiptDate = dateToUse;
          receiptTime = '12:00 م';
        }
      } else {
        receiptDate = todayStr;
        receiptTime = '12:00 م';
      }
    }
  } else {
    // Blank template preview sample values
    receiptDate = '2026-08-09';
    receiptTime = '02:11 م';
    receiptRequester = requesterName;
    receiptNotes = 'الآلة تعمل ممتاز بعد الإصلاح';
    recipientSignature = requesterName;
  }

  // Spare Parts (Internal Warehouse & External Workshop Parts Combined)
  const isExternal = request?.maintenanceType === 'external' || Boolean(request?.requiresExternalWorkshop) || Boolean(request?.externalWorkshopName);
  const externalParts = request?.externalSpareParts || [];
  const usedParts = request?.usedSpareParts || [];
  
  // Map internal used parts (usedSpareParts)
  const mappedUsedParts = usedParts.map((p, idx) => {
    const cur = p.currency || request?.partsCurrency || '$';
    return {
      name: p.partName || 'قطعة غيار',
      specs: p.unitPrice ? `سعر الوحدة: ${p.unitPrice.toLocaleString()} ${cur} | الإجمالي: ${(p.unitPrice * p.quantity).toLocaleString()} ${cur}` : 'قطع غيار مستهلكة',
      qty: p.quantity,
      code: p.partCode || (p.partId ? `SP-${p.partId}` : `SP-${501 + idx}`)
    };
  });

  // Map external workshop parts (externalSpareParts)
  const mappedExternalParts = externalParts.map((p, idx) => ({
    name: p.name || 'قطعة غيار خارجية',
    specs: `سعر المفرد: ${p.unitPrice} $ | الإجمالي: ${p.totalPrice || (p.unitPrice * p.quantity)} $ (ورشة خارجية)`,
    qty: p.quantity,
    code: `EXT-SP-${101 + idx}`
  }));

  // Combined list of all replaced parts
  const allReplacedParts = [...mappedUsedParts, ...mappedExternalParts];

  const minRows = 4;
  const totalRowsCount = Math.max(minRows, allReplacedParts.length);

  const partRows = Array.from({ length: totalRowsCount }).map((_, idx) => {
    const item = allReplacedParts[idx];
    if (item) {
      return {
        index: idx + 1,
        name: item.name,
        specs: item.specs,
        qty: item.qty,
        code: item.code
      };
    }
    if (!isRequestProvided && idx === 0) {
      return { index: 1, name: 'سير نقل حركة V-Belt B-68', specs: 'قياس B-68 مقاوِم للحرارة', qty: 1, code: 'SP-501' };
    }
    if (!isRequestProvided && idx === 1) {
      return { index: 2, name: 'محمل كروي SKF 6205', specs: 'قطر 25mm إيطالي', qty: 2, code: 'SP-502' };
    }
    return { index: idx + 1, name: '', specs: '', qty: '', code: '' };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      
      {/* Top Floating Control Bar (Hidden in Print) */}
      <div className="fixed top-4 left-4 right-4 max-w-4xl mx-auto bg-slate-900 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between z-50 no-print border border-slate-700">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-sm">معاينة وتصدير تقرير الصيانة PDF (نموذج أكديما الرسمي)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ كملف PDF</span>
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Sheet Window Container */}
      <div className="mt-16 mb-8 bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-[12mm] shadow-2xl rounded-sm border border-slate-300 printable-acdivet-sheet print:m-0 print:p-[10mm] print:shadow-none print:w-full print:max-w-none dir-rtl text-right">
        
        {/* Document Header - ACDIVET Brand */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="grid grid-cols-3 items-center text-xs font-bold leading-tight">
            
            {/* English Header Left */}
            <div className="text-left font-serif space-y-0.5">
              <p className="font-extrabold text-base tracking-wider text-slate-900">ACDIMA</p>
              <p className="text-[10px] font-sans font-semibold text-slate-800">For Veterinary Medicines Industry</p>
              <p className="text-[11px] font-sans font-bold text-slate-900">(ACDIVET) Ltd.</p>
            </div>

            {/* Logo Center */}
            <div className="text-center flex flex-col items-center justify-center px-2">
              <div className="flex items-baseline justify-center dir-ltr text-slate-900 font-sans">
                <span className="text-2xl sm:text-3xl font-black tracking-wider text-slate-950">ACDIVET</span>
                <span className="text-xs font-bold text-slate-800 align-super ml-0.5">®</span>
              </div>
              <p className="text-[11px] font-black text-slate-950 mt-0.5 tracking-wide">أكبيطرة</p>
              <p className="text-[9px] font-bold text-slate-800 tracking-tight">أكديما لصناعة الأدوية البيطرية</p>
            </div>

            {/* Arabic Header Right */}
            <div className="text-right space-y-0.5 text-slate-900 font-sans">
              <p className="text-base font-black tracking-wide">أكديـمــــا</p>
              <p className="text-[11px] font-bold">لصناعة الأدوية البيطريــة</p>
              <p className="text-[11px] font-bold">(أكبيطرة) المحدودة المسؤولية</p>
            </div>

          </div>

          {/* Form Serial & Title Bar */}
          <div className="mt-4 pt-2 border-t border-slate-900 flex items-center justify-between text-slate-900">
            <div className="font-bold text-sm font-mono tracking-wider text-slate-900">
              № <span className="font-black text-base underline decoration-slate-800">{code}</span>
            </div>

            <h1 className="text-base sm:text-lg font-black tracking-tight text-center underline decoration-2 underline-offset-4">
              طلب صيانة / إصلاح رقم ( <span className="font-mono px-1 text-blue-950 font-black">{code}</span> )
            </h1>

            <div className="text-[11px] font-bold px-2 py-0.5 rounded border border-slate-800 bg-slate-50 text-slate-800 text-center">
              حالة الطلب: <span className="font-extrabold text-blue-950">{statusBadgeText}</span>
            </div>
          </div>
        </div>

        {/* Form Body Formats */}
        <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-900">
          
          {/* Greeting */}
          <div className="font-bold text-sm text-slate-900">
            السيد مسؤول الصيانة المحترم، تحية وبعد:
          </div>

          {/* Request Lines */}
          <div className="space-y-2.5 text-xs">
            {/* Row 1: قسم - مقدمه - يرجى إصلاح - الرقم التسلسلي للجهاز */}
            <div className="flex flex-wrap items-baseline justify-between gap-1.5 text-xs leading-relaxed">
              <div className="flex items-baseline gap-1">
                <span className="font-bold">قسم:</span>
                <span className="border-b-2 border-dotted border-slate-800 font-bold text-blue-950 px-1 py-0.5">
                  {departmentName}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-bold">مقدمه:</span>
                <span className="border-b-2 border-dotted border-slate-800 font-bold text-blue-950 px-1 py-0.5">
                  {requesterName}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-bold">يرجى إصلاح:</span>
                <span className="border-b-2 border-dotted border-slate-800 font-bold text-blue-950 px-1 py-0.5">
                  {assetName}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-bold">الرقم التسلسلي للجهاز:</span>
                <span className="border-b-2 border-dotted border-slate-800 font-bold font-mono text-blue-950 px-1 py-0.5">
                  {assetCode}
                </span>
              </div>
            </div>

            {/* Row 2: ساعة التوقف */}
            <div className="flex items-baseline gap-2">
              <span className="whitespace-nowrap font-bold">ساعة التوقف:</span>
              <span className="flex-1 border-b-2 border-dotted border-slate-800 font-bold text-blue-950 px-2 py-0.5 font-mono">
                {faultOccurrenceDate}
              </span>
            </div>

            {/* Row 3: وصف العطل */}
            <div className="flex items-baseline gap-2">
              <span className="whitespace-nowrap font-bold">وصف العطل:</span>
              <span className="flex-1 border-b-2 border-dotted border-slate-800 font-bold text-slate-950 px-2 py-0.5 leading-normal">
                {description}
              </span>
            </div>

            {/* Row: حالة التكرار */}
            {request?.isRecurring && (
              <div className="flex items-center gap-2 text-xs bg-slate-100 border border-slate-400 px-2 py-1 rounded-xs">
                <span className="font-black text-slate-950">طبيعة العطل:</span>
                <span className="font-bold text-slate-900">عطل متكرر — تم اعتماد التشخيص وتكليف الفني آلياً بواسطة النظام وفق الحالات السابقة.</span>
              </div>
            )}

            {/* Row 4: درجة خطورة العطل (خيارات مع تشيك بوكس) */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="font-bold text-slate-900 whitespace-nowrap">درجة خطورة العطل:</span>
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {priorities.map((p) => {
                  const isSelected = currentPriority === p.key;
                  return (
                    <div key={p.key} className="flex items-center gap-1 text-xs">
                      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-900 rounded-[2px] text-[10px] font-black leading-none ${isSelected ? 'bg-slate-900 text-white' : 'bg-white text-transparent'}`}>
                        ✓
                      </span>
                      <span className={`font-bold ${isSelected ? 'text-slate-950 font-black' : 'text-slate-700'}`}>
                        {p.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Department Signatures & Request Date Row */}
          <div className="pt-3 flex items-center justify-between text-xs font-bold text-slate-900 px-2">
            <div>
              <span>تاريخ ووقت تقديم الطلب: </span>
              <span className="inline-block border-b border-slate-800 px-2 text-blue-950 font-mono">
                {creationDate}
              </span>
            </div>
            <div>
              <span>المدير المباشر: </span>
              <span className="inline-block border-b border-slate-800 px-2 text-blue-950 font-bold min-w-[120px] text-center">
                {deptManagerName}
              </span>
            </div>
          </div>

          {/* Section: Maintenance Department Action */}
          <div className="pt-2">
            <div className="border border-slate-900 rounded-xs overflow-hidden">
              <div className="bg-slate-100 font-black text-center py-1 border-b border-slate-900 text-xs tracking-wider">
                قسم الصيانة
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900">تشخيص نوع العطل (مدير الصيانة):</span>
                  <span className="flex-1 font-bold text-blue-950 underline decoration-dotted">
                    {diagnosedFaultNames.length > 0 ? diagnosedFaultNames.join(' + ') : (request?.faultTypeName || 'بانتظار تحديد مدير الصيانة')}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900">تاريخ ووقت التنفيذ:</span>
                  <span className="flex-1 font-mono font-bold text-slate-950 underline decoration-dotted">
                    {executionDateTime}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900">العمل المنفذ:</span>
                  <span className="flex-1 font-semibold text-slate-950 underline decoration-dotted underline-offset-4">
                    {technicalReport}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900">اسم الفني المنفذ:</span>
                  <span className="flex-1 font-bold text-blue-950 underline decoration-dotted">
                    {technicianName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Spare Parts Table */}
          <div className="pt-1">
            <h3 className="font-black text-center text-xs mb-1.5 underline">القطع التبديلية المطلوبة</h3>
            <table className="w-full text-center border-collapse border border-slate-900 text-xs">
              <thead className="bg-slate-100 font-black">
                <tr>
                  <th className="border border-slate-900 p-1.5 w-10">الرقم</th>
                  <th className="border border-slate-900 p-1.5">القطعة</th>
                  <th className="border border-slate-900 p-1.5">المواصفات</th>
                  <th className="border border-slate-900 p-1.5 w-16">العدد</th>
                  <th className="border border-slate-900 p-1.5 w-24">كود القطعة</th>
                </tr>
              </thead>
              <tbody>
                {partRows.map((row) => (
                  <tr key={row.index} className="h-7">
                    <td className="border border-slate-900 p-1 font-mono">{row.index}</td>
                    <td className="border border-slate-900 p-1 font-bold text-slate-900">{row.name}</td>
                    <td className="border border-slate-900 p-1 text-slate-800">{row.specs}</td>
                    <td className="border border-slate-900 p-1 font-mono font-bold">{row.qty}</td>
                    <td className="border border-slate-900 p-1 font-mono font-bold text-slate-800">{row.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* External Workshop Costs Breakdown (If External) */}
            {isExternal && (
              <div className="mt-2 border border-slate-900 p-2 bg-slate-50 text-[11px] font-bold space-y-1">
                <div className="flex justify-between border-b border-slate-300 pb-1">
                  <span>اسم الورشة الخارجية: <strong className="text-blue-950 font-black">{request?.externalWorkshopName || 'ورشة خارجية'}</strong></span>
                  <span>المبلغ الإجمالي لقطع الغيار المطلوبة: <strong className="font-mono text-blue-950">{request?.externalPartsCost || 0} $</strong></span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>تكلفة أجور الورشة: <strong className="font-mono text-blue-950">{request?.externalLaborCost || 0} $</strong></span>
                  <span>المبلغ الإجمالي الكلي (قطع غيار + أجور ورشة): <strong className="font-mono text-blue-950 text-xs underline">{request?.externalTotalCost || ((request?.externalLaborCost || 0) + (request?.externalPartsCost || 0))} $</strong></span>
                </div>
              </div>
            )}

            {/* External Invoice Image (If present) */}
            {isExternal && request?.externalInvoicePhoto && (
              <div className="mt-2 border border-slate-900 p-2 text-[10px] space-y-1 bg-white">
                <span className="font-black block text-slate-900">صورة فاتورة الورشة الخارجية المرفقة:</span>
                <img src={request.externalInvoicePhoto} alt="فاتورة الورشة" className="max-h-40 max-w-xs object-contain border border-slate-300 rounded" />
              </div>
            )}

            {/* Maintenance Manager Signature */}
            <div className="mt-3 text-left font-bold text-xs pl-4 flex items-center justify-end gap-2">
              <span>توقيع رئيس قسم الصيانة: </span>
              <span className="inline-block border-b border-slate-800 px-4 text-blue-950 font-bold min-w-[200px] text-center">
                {request?.managerSigned ? `${request.managerSignedBy || maintManagerName} (تم الفحص والتوقيع بالاعتماد)` : maintManagerName}
              </span>
            </div>
          </div>

          {/* Section: General Manager Approval */}
          <div className="pt-2 flex items-baseline gap-2">
            <span className="whitespace-nowrap font-black text-xs">ملاحظات واعتماد المدير العام:</span>
            <span className="flex-1 border-b border-dotted border-slate-800 py-0.5"></span>
          </div>

          {/* Section: Receipt of Repair */}
          <div className="pt-2">
            <div className="border border-slate-900 rounded-xs overflow-hidden">
              <div className="bg-slate-100 font-black text-center py-1 border-b border-slate-900 text-xs tracking-wider">
                استلام الإصلاح
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span>لقد تم الاستلام بتاريخ</span>
                  <span className="w-32 border-b border-dotted border-slate-800 font-bold px-1 font-mono text-center text-blue-950">
                    {receiptDate}
                  </span>
                  <span>الساعة</span>
                  <span className="w-24 border-b border-dotted border-slate-800 font-bold px-1 font-mono text-center text-blue-950">
                    {receiptTime}
                  </span>
                  <span>من قبل</span>
                  <span className="flex-1 border-b border-dotted border-slate-800 font-bold px-1 text-blue-950">
                    {receiptRequester}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold">ملاحظات:</span>
                  <span className="flex-1 border-b border-dotted border-slate-800 px-1 text-slate-900">
                    {receiptNotes}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Signatures Footer */}
          <div className="pt-6 flex items-center justify-between text-xs font-bold text-slate-900 px-4">
            <div>
              <span>توقيع المستلم: </span>
              <span className="inline-block border-b border-slate-800 px-3 text-blue-950 font-bold min-w-[140px] text-center">
                {recipientSignature}
              </span>
            </div>
            <div>
              <span>المدير المسؤول: </span>
              <span className="inline-block border-b border-slate-800 px-3 text-blue-950 font-bold min-w-[140px] text-center">
                {deptManagerName}
              </span>
            </div>
          </div>

        </div>

        {/* Document Metadata Footer Bar */}
        <div className="mt-12 pt-3 border-t-2 border-slate-900 text-[10px] font-mono font-bold text-slate-800 flex items-center justify-between px-2">
          <div className="border border-slate-800 px-2 py-0.5">F09-03</div>
          <div>Issue No.: 02</div>
          <div>Issue Date: 25/08/2020</div>
          <div>Page 1 of 1</div>
        </div>

      </div>

      {/* Global CSS for Clean Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-acdivet-sheet, .printable-acdivet-sheet * {
            visibility: visible !important;
          }
          .printable-acdivet-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
};

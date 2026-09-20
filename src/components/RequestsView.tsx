import React, { useState, useMemo } from 'react';
import { useApp, sortRequestsNewestFirst } from '../context/AppContext';
import { MaintenanceReportPDF } from './MaintenanceReportPDF';
import { inferMachineType } from '../data/initialData';
import {
  Asset,
  MaintenanceRequest,
  RequestStatus,
  PriorityLevel,
  UsedSparePart,
  UserRole
} from '../types';

export const isActionRequiredForUser = (
  req: MaintenanceRequest,
  userRole: UserRole,
  currentUserId?: string,
  currentUserName?: string,
  matchedTechId?: string,
  matchedTechName?: string
): boolean => {
  if (!req) return false;

  const norm = (s?: string) => (s || '').toLowerCase().trim();

  const isRequester = Boolean(
    (currentUserId && req.requesterId === currentUserId) ||
    (req.requesterName && currentUserName && (
      norm(req.requesterName).includes(norm(currentUserName)) ||
      norm(currentUserName).includes(norm(req.requesterName))
    ))
  );

  // 1. Employee / Requester actions (ONLY for requests sent by this user)
  if (isRequester) {
    if (req.status === 'pending_closure') return true;
    if (req.status === 'closed' && !req.rating) return true;
    if (req.status === 'closed' && req.rating && !req.receivedDate) return true;
  }

  // Ordinary employees cannot perform actions on requests sent by other users
  if (userRole === 'employee') {
    return false;
  }

  // 2. Technician (ONLY requests explicitly assigned to this technician or requested by him)
  if (userRole === 'technician') {
    const isAssignedTech = Boolean(
      (currentUserId && req.technicianId === currentUserId) ||
      (matchedTechId && req.technicianId === matchedTechId) ||
      (currentUserName && req.technicianName && (
        norm(req.technicianName).includes(norm(currentUserName)) ||
        norm(currentUserName).includes(norm(req.technicianName))
      )) ||
      (matchedTechName && req.technicianName && (
        norm(req.technicianName).includes(norm(matchedTechName)) ||
        norm(matchedTechName).includes(norm(req.technicianName))
      ))
    );

    if (isAssignedTech && ['assigned', 'in_progress', 'external_in_execution', 'external_pending_maint_mgr'].includes(req.status)) {
      return true;
    }
    return false;
  }

  // 3. Maintenance Manager
  if (userRole === 'maintenance_manager') {
    if (req.status === 'new') return true;
    if (req.status === 'external_pending_maint_mgr') return true;
    if (req.status === 'external_approved_by_gm') return true;
    if (req.status === 'pending_approval') return true;
  }

  // 4. General Manager / External Approver
  if (userRole === 'external_approver') {
    if (req.status === 'external_pending_gm') return true;
  }

  // 5. System Admin
  if (userRole === 'admin') {
    if (['new', 'external_pending_maint_mgr', 'external_pending_gm', 'external_approved_by_gm', 'external_in_execution', 'pending_approval', 'pending_closure'].includes(req.status)) {
      return true;
    }
  }

  return false;
};
import {
  ClipboardList,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Plus,
  Eye,
  UserCheck,
  Wrench,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Star,
  Image as ImageIcon,
  Package,
  XCircle,
  Download,
  AlertTriangle,
  Lock,
  User,
  ShieldCheck,
  Building2,
  RotateCcw,
  Trash2,
  X
} from 'lucide-react';

export const RequestsView: React.FC = () => {
  const {
    requests,
    assets,
    departments,
    faultTypes,
    technicians,
    spareParts,
    activeRole,
    currentUser,
    createRequest,
    assignTechnicianToRequest,
    updateRequestFaultAndPriority,
    updateRequestWorkflow,
    approveExternalWorkshop,
    approveRequestClosure,
    signAndApproveByManager,
    closeRequestByRequester,
    rateRequestService,
    markRequestAsReceived,
    cancelRequest,
    deleteRequest,
    subView,
    setSubView
  } = useApp();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');

  // Primary Category Tabs: 'all' | 'my_requests' | 'external_workshop'
  const [requestCategoryTab, setRequestCategoryTab] = useState<'all' | 'my_requests' | 'external_workshop'>(() => {
    if (subView === 'external_approval') return 'external_workshop';
    return 'all';
  });

  // External Workshop approval modal state
  const [approvalCostInput, setApprovalCostInput] = useState<number | ''>('');
  const [approvalNotesInput, setApprovalNotesInput] = useState<string>('');
  const [reqNeedsExternalCheckbox, setReqNeedsExternalCheckbox] = useState<boolean>(false);

  // Selected Request Modal State
  const [activeModalReq, setActiveModalReq] = useState<MaintenanceRequest | null>(null);

  // PDF Official Maintenance Report Modal State
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfTargetReq, setPdfTargetReq] = useState<MaintenanceRequest | null>(null);

  // Form state for New Request Modal (Auto Department & Asset Filtering)
  const initialDeptId = currentUser?.departmentId || departments[0]?.id || 'DEPT-101';
  const [newReqDeptId, setNewReqDeptId] = useState<string>(initialDeptId);
  const [newReqMachineTypeFilter, setNewReqMachineTypeFilter] = useState<string>('all');

  // Available Assets filtered by selected department
  const selectedDeptObj = departments.find(d => d.id === newReqDeptId);
  const departmentAssets = useMemo(() => {
    return assets.filter(
      a => a.departmentId === newReqDeptId || (selectedDeptObj && a.departmentName === selectedDeptObj.name)
    );
  }, [assets, newReqDeptId, selectedDeptObj]);

  // Distinct Machine Types present in this department (e.g. حقن, بودرة, حب, شراب...)
  const departmentMachineTypes = useMemo(() => {
    const typesSet = new Set<string>();
    departmentAssets.forEach(a => {
      typesSet.add(a.machineType || inferMachineType(a));
    });
    return Array.from(typesSet);
  }, [departmentAssets]);

  // Filtered Assets according to selected machine type
  const availableAssetsForRequest = useMemo(() => {
    if (newReqMachineTypeFilter === 'all') return departmentAssets;
    return departmentAssets.filter(a => (a.machineType || inferMachineType(a)) === newReqMachineTypeFilter);
  }, [departmentAssets, newReqMachineTypeFilter]);

  // Grouped by machine type for categorized select optgroups
  const groupedAssetsForRequest = useMemo<Record<string, Asset[]>>(() => {
    const groups: Record<string, Asset[]> = {};
    departmentAssets.forEach(a => {
      const mType = a.machineType || inferMachineType(a);
      if (!groups[mType]) groups[mType] = [];
      groups[mType].push(a);
    });
    return groups;
  }, [departmentAssets]);

  const [newReqAssetId, setNewReqAssetId] = useState<string>(departmentAssets[0]?.id || assets[0]?.id || '');
  const [newReqFaultTypeId, setNewReqFaultTypeId] = useState(faultTypes[0]?.id || '');
  const [newReqPriority, setNewReqPriority] = useState<PriorityLevel>('medium');
  const [newReqDescription, setNewReqDescription] = useState('');
  const [newReqIsRecurring, setNewReqIsRecurring] = useState(false);
  const [showManagerRecurringOverride, setShowManagerRecurringOverride] = useState(false);

  // Customizable Fault Occurrence Date & Time state (datetime-local format: YYYY-MM-DDTHH:mm)
  const [newReqFaultDateTime, setNewReqFaultDateTime] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  // Live Current Date & Time for Automatic Request Creation Timestamp
  const [currentFormDateTime, setCurrentFormDateTime] = useState(() => {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${dateStr} | ${timeStr}`;
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const dateStr = d.toISOString().split('T')[0];
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setCurrentFormDateTime(`${dateStr} | ${timeStr}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (subView === 'external_approval') {
      setRequestCategoryTab('external_workshop');
    }
  }, [subView]);

  // Maintenance Manager Fault Types & Priority Selection State
  const [managerFaultTypeIds, setManagerFaultTypeIds] = useState<string[]>([]);
  const [managerPriority, setManagerPriority] = useState<PriorityLevel>('medium');

  // Auto-suggest technician & external workshop data when active modal request is selected
  React.useEffect(() => {
    if (activeModalReq) {
      const initFaultIds: string[] = [];
      if (activeModalReq.faultTypeIds && activeModalReq.faultTypeIds.length > 0) {
        initFaultIds.push(...activeModalReq.faultTypeIds);
      } else if (activeModalReq.faultTypeId) {
        initFaultIds.push(activeModalReq.faultTypeId);
      } else if (activeModalReq.faultTypeName) {
        const found = faultTypes.find(f => f.name === activeModalReq.faultTypeName);
        if (found) initFaultIds.push(found.id);
      }
      setManagerFaultTypeIds(initFaultIds);
      setManagerPriority(activeModalReq.priority || 'medium');

      setAssignTechId(activeModalReq.technicianId || '');
      setApprovalCostInput(activeModalReq.externalWorkshopCost || '');
      setApprovalNotesInput(activeModalReq.externalWorkshopNotes || '');
      setReqNeedsExternalCheckbox(!!activeModalReq.requiresExternalWorkshop);

      setTechMaintType(activeModalReq.maintenanceType || (activeModalReq.requiresExternalWorkshop ? 'external' : 'internal'));
      setExtReasonText(activeModalReq.externalWorkshopReason || activeModalReq.externalWorkshopNotes || '');
      setExtWorkshopName(activeModalReq.externalWorkshopName || '');
      setExtLaborCost(activeModalReq.externalLaborCost !== undefined ? activeModalReq.externalLaborCost : '');
      setExtReportText(activeModalReq.technicalReport || '');
      setExtSpareParts(activeModalReq.externalSpareParts || []);
      setExtInvoicePhoto(activeModalReq.externalInvoicePhoto || '');
    }
  }, [activeModalReq?.id]);

  // Filter for requests requiring current user's action
  const [onlyPendingMyAction, setOnlyPendingMyAction] = useState<boolean>(false);

  // External invoice photo state
  const [extInvoicePhoto, setExtInvoicePhoto] = useState<string>('');

  const handleInvoiceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم صورة الفاتورة كبير جداً، يرجى اختيار صورة أقل من 5 ميغابايت');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setExtInvoicePhoto(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Workflow Modal Actions State
  const [assignTechId, setAssignTechId] = useState('');

  const [techReportText, setTechReportText] = useState('');
  const [techPhotoUrl, setTechPhotoUrl] = useState('');

  // Technician Maintenance Choice State ('internal' or 'external')
  const [techMaintType, setTechMaintType] = useState<'internal' | 'external'>('internal');
  const [extReasonText, setExtReasonText] = useState<string>('');

  // External Workshop Data Entry (for Technician in execution phase)
  const [extWorkshopName, setExtWorkshopName] = useState<string>('');
  const [extLaborCost, setExtLaborCost] = useState<number | ''>('');
  const [extReportText, setExtReportText] = useState<string>('');

  // External Spare Parts List (Independent from warehouse)
  const [extSpareParts, setExtSpareParts] = useState<Array<{ id: string; name: string; quantity: number; unitPrice: number; totalPrice: number }>>([]);
  const [extPartNameInput, setExtPartNameInput] = useState<string>('');
  const [extPartQtyInput, setExtPartQtyInput] = useState<number>(1);
  const [extPartUnitPriceInput, setExtPartUnitPriceInput] = useState<number | ''>('');

  const handleAddExternalSparePart = () => {
    if (!extPartNameInput.trim()) return;
    const qty = Math.max(1, extPartQtyInput || 1);
    const unitPrice = Number(extPartUnitPriceInput) || 0;
    const totalPrice = qty * unitPrice;

    setExtSpareParts(prev => [
      ...prev,
      {
        id: 'EXT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: extPartNameInput.trim(),
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      }
    ]);

    setExtPartNameInput('');
    setExtPartQtyInput(1);
    setExtPartUnitPriceInput('');
  };

  const handleRemoveExternalSparePart = (id: string) => {
    setExtSpareParts(prev => prev.filter(p => p.id !== id));
  };

  // Manual Spare Parts List for Internal Maintenance (Technician Entry)
  const [techSpareParts, setTechSpareParts] = useState<Array<{
    id: string;
    name: string;
    code: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: '$' | 'ل.س';
  }>>([]);
  const [techPartNameInput, setTechPartNameInput] = useState<string>('');
  const [techPartCodeInput, setTechPartCodeInput] = useState<string>('');
  const [techPartQtyInput, setTechPartQtyInput] = useState<number>(1);
  const [techPartUnitPriceInput, setTechPartUnitPriceInput] = useState<number | ''>('');
  const [techPartCurrency, setTechPartCurrency] = useState<'$' | 'ل.س'>('$');

  // Format spare parts total cost according to currencies
  const formatPartsCostSummary = (parts?: Array<{ totalPrice?: number; unitPrice: number; quantity: number; currency?: string }>) => {
    if (!parts || parts.length === 0) return '0 $';
    const usdTotal = parts
      .filter(p => (p.currency || '$') === '$')
      .reduce((sum, p) => sum + (p.totalPrice ?? (p.unitPrice * p.quantity)), 0);
    const sypTotal = parts
      .filter(p => p.currency === 'ل.س')
      .reduce((sum, p) => sum + (p.totalPrice ?? (p.unitPrice * p.quantity)), 0);

    const partsArr: string[] = [];
    if (usdTotal > 0) partsArr.push(`${usdTotal.toLocaleString()} $`);
    if (sypTotal > 0) partsArr.push(`${sypTotal.toLocaleString()} ل.س`);
    if (partsArr.length === 0) return '0 $';
    return partsArr.join(' + ');
  };

  const handleAddTechSparePart = () => {
    if (!techPartNameInput.trim()) return;
    const qty = Math.max(1, Number(techPartQtyInput) || 1);
    const unitPrice = Math.max(0, Number(techPartUnitPriceInput) || 0);
    const totalPrice = qty * unitPrice;
    const code = techPartCodeInput.trim() || `SP-${Math.floor(1000 + Math.random() * 9000)}`;

    setTechSpareParts(prev => [
      ...prev,
      {
        id: 'SP-TECH-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: techPartNameInput.trim(),
        code: code,
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        currency: techPartCurrency
      }
    ]);

    setTechPartNameInput('');
    setTechPartCodeInput('');
    setTechPartQtyInput(1);
    setTechPartUnitPriceInput('');
  };

  const handleRemoveTechSparePart = (id: string) => {
    setTechSpareParts(prev => prev.filter(item => item.id !== id));
  };

  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [managerSignNotes, setManagerSignNotes] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  // Helper: Find technician matching currently logged-in user
  const currentMatchedTech = technicians.find(t =>
    t.id === currentUser?.id ||
    (t.username && currentUser?.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) ||
    (t.email && currentUser?.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (t.name && currentUser?.name && (
      currentUser.name.toLowerCase().includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(currentUser.name.toLowerCase())
    ))
  );

  // Helpers for exact request filtering and matching
  const normStr = (s?: string) => (s || '').toLowerCase().trim();

  // Helper: Check if request is assigned to the current technician
  const isAssignedToCurrentTechnician = (r: MaintenanceRequest): boolean => {
    if (!r.technicianId && !r.technicianName) return false;
    const techIdFilter = techFilter && techFilter !== 'all' ? techFilter : null;
    const selectedTech = techIdFilter ? technicians.find(t => t.id === techIdFilter) : null;

    if (techIdFilter && r.technicianId === techIdFilter) return true;
    if (selectedTech && r.technicianName && normStr(r.technicianName).includes(normStr(selectedTech.name))) return true;

    if (currentUser?.id && r.technicianId === currentUser.id) return true;
    if (currentMatchedTech?.id && r.technicianId === currentMatchedTech.id) return true;

    if (r.technicianName) {
      const tName = normStr(r.technicianName);
      if (currentUser?.name && (tName.includes(normStr(currentUser.name)) || normStr(currentUser.name).includes(tName))) return true;
      if (currentMatchedTech?.name && (tName.includes(normStr(currentMatchedTech.name)) || normStr(currentMatchedTech.name).includes(tName))) return true;
    }
    return false;
  };

  // 1. Check if request was sent/created by the user himself
  const isUserSentRequest = (r: MaintenanceRequest): boolean => {
    if (!currentUser) return false;
    return Boolean(
      (currentUser.id && r.requesterId === currentUser.id) ||
      (r.requesterName && currentUser.name && (
        normStr(r.requesterName).includes(normStr(currentUser.name)) ||
        normStr(currentUser.name).includes(normStr(r.requesterName))
      ))
    );
  };

  // 2. Tab "جميع طلبات الصيانة"
  const isUserDepartmentOrTechAllRequest = (r: MaintenanceRequest): boolean => {
    if (activeRole === 'admin' || activeRole === 'maintenance_manager') return true;
    if (activeRole === 'technician') {
      return isUserSentRequest(r) || isAssignedToCurrentTechnician(r);
    }
    if (!currentUser) return true;
    if (!currentUser.departmentId && !currentUser.departmentName) return true;
    return Boolean(
      (currentUser.departmentId && r.departmentId === currentUser.departmentId) ||
      (currentUser.departmentName && r.departmentName && normStr(r.departmentName) === normStr(currentUser.departmentName))
    );
  };

  // 3. Tab "طلباتي"
  const isUserMyRequestsList = (r: MaintenanceRequest): boolean => {
    if (activeRole === 'technician') {
      return isUserSentRequest(r) || isAssignedToCurrentTechnician(r);
    }
    return isUserSentRequest(r);
  };

  // 4. Check if request requires external workshop
  const isExternalWorkshopRequest = (r: MaintenanceRequest): boolean => {
    return Boolean(r.requiresExternalWorkshop || r.maintenanceType === 'external' || (r.status && r.status.startsWith('external_')));
  };

  // Tab "اعتماد الورشة الخارجية"
  const isUserExternalWorkshopRequest = (r: MaintenanceRequest): boolean => {
    if (!isExternalWorkshopRequest(r)) return false;
    if (activeRole === 'admin' || activeRole === 'maintenance_manager' || activeRole === 'external_approver') return true;
    if (activeRole === 'technician') {
      return isUserSentRequest(r) || isAssignedToCurrentTechnician(r);
    }
    return isUserSentRequest(r) || isUserDepartmentOrTechAllRequest(r);
  };

  // 5. Filter "الطلبات التي تنتظر إجرائي"
  const isPendingUserActionRequest = (r: MaintenanceRequest): boolean => {
    if (activeRole === 'employee' && !isUserSentRequest(r)) return false;
    if (activeRole === 'technician') {
      if (!isUserSentRequest(r) && !isAssignedToCurrentTechnician(r)) return false;
    } else if (activeRole !== 'admin' && activeRole !== 'maintenance_manager' && activeRole !== 'external_approver' && !isUserDepartmentOrTechAllRequest(r)) {
      return false;
    }
    return isActionRequiredForUser(r, activeRole, currentUser?.id, currentUser?.name, currentMatchedTech?.id, currentMatchedTech?.name);
  };

  // Pre-calculate exact request groups for each tab
  const allDeptRequests = requests.filter(r => isUserDepartmentOrTechAllRequest(r));
  const mySentRequests = requests.filter(r => isUserMyRequestsList(r));
  const externalWorkshopRequests = requests.filter(r => isUserExternalWorkshopRequest(r));
  const pendingUserActionRequests = requests.filter(r => isPendingUserActionRequest(r));

  // Counts for tab badges
  const allAccessibleCount = allDeptRequests.length;
  const myRequestsCount = mySentRequests.length;
  const externalWorkshopCount = externalWorkshopRequests.length;
  const pendingExternalCount = externalWorkshopRequests.filter(r => r.externalWorkshopStatus === 'pending' || (r.status && r.status.includes('pending'))).length;
  const pendingUserActionCount = pendingUserActionRequests.length;

  // Determine base target requests array based on active tab / toggle
  let baseTargetRequests: MaintenanceRequest[] = [];
  if (onlyPendingMyAction) {
    baseTargetRequests = pendingUserActionRequests;
  } else if (requestCategoryTab === 'my_requests') {
    baseTargetRequests = mySentRequests;
  } else if (requestCategoryTab === 'external_workshop') {
    baseTargetRequests = externalWorkshopRequests;
  } else {
    // 'all'
    baseTargetRequests = allDeptRequests;
  }

  // Filter base list by search query and dropdown filters
  const filteredRequests = baseTargetRequests.filter(r => {
    // Technician dropdown filter for Admin / Manager
    if (techFilter && techFilter !== 'all' && activeRole !== 'technician') {
      const selectedT = technicians.find(t => t.id === techFilter);
      const isMatch = r.technicianId === techFilter || (selectedT && r.technicianName && (
        normStr(r.technicianName).includes(normStr(selectedT.name)) ||
        normStr(selectedT.name).includes(normStr(r.technicianName))
      ));
      if (!isMatch) return false;
    }

    // Standard Search and Dropdown Filters
    const matchesSearch =
      !searchQuery ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.technicianName && r.technicianName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesPriority = !priorityFilter || r.priority === priorityFilter;
    const matchesDept = !deptFilter || r.departmentId === deptFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDept;
  });

  const sortedFilteredRequests = sortRequestsNewestFirst(filteredRequests);

  // Handle department change in creation form -> dynamically update available assets
  const handleDepartmentChange = (deptId: string) => {
    setNewReqDeptId(deptId);
    setNewReqMachineTypeFilter('all');
    const targetDept = departments.find(d => d.id === deptId);
    const filtered = assets.filter(
      a => a.departmentId === deptId || (targetDept && a.departmentName === targetDept.name)
    );
    if (filtered.length > 0) {
      setNewReqAssetId(filtered[0].id);
    } else {
      setNewReqAssetId('');
    }
  };

  const handleMachineTypeFilterChange = (mType: string) => {
    setNewReqMachineTypeFilter(mType);
    const filtered = mType === 'all'
      ? departmentAssets
      : departmentAssets.filter(a => (a.machineType || inferMachineType(a)) === mType);
    if (filtered.length > 0) {
      setNewReqAssetId(filtered[0].id);
    }
  };

  // Handlers
  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqAssetId || !newReqDescription.trim()) return;

    const created = createRequest({
      assetId: newReqAssetId,
      faultOccurrenceDate: newReqFaultDateTime,
      description: newReqDescription.trim(),
      isRecurring: newReqIsRecurring
    });

    setNewReqDescription('');
    setNewReqIsRecurring(false);
    setSubView('view');
    if (created.isRecurring) {
      setSuccessMsg(`تم إدراج طلب الصيانة المتكرر (${created.code}) بنجاح، وقام النظام آلياً باعتماد التشخيص وتكليفه للفني (${created.technicianName || 'المختص'}) مباشرة استناداً لسوابق الصيانة.`);
    } else {
      setSuccessMsg(`تم إدراج طلب الصيانة (${created.code}) بنجاح (بانتظار تحديد العطل والأولوية من مدير الصيانة)`);
    }
    setTimeout(() => setSuccessMsg(''), 5500);
  };

  const handleSaveFaultAndPriorityOnly = () => {
    if (!activeModalReq) return;
    const selectedFaults = faultTypes.filter(f => managerFaultTypeIds.includes(f.id));
    const selectedFaultNames = selectedFaults.map(f => f.name);
    const combinedFaultName = selectedFaultNames.length > 0 
      ? selectedFaultNames.join(' + ') 
      : (activeModalReq.faultTypeName || 'عطل تقني');

    updateRequestFaultAndPriority(activeModalReq.id, {
      faultTypeIds: managerFaultTypeIds,
      faultTypeNames: selectedFaultNames,
      faultTypeId: managerFaultTypeIds[0] || '',
      faultTypeName: combinedFaultName,
      priority: managerPriority
    });

    setActiveModalReq(prev => prev ? {
      ...prev,
      faultTypeIds: managerFaultTypeIds,
      faultTypeNames: selectedFaultNames,
      faultTypeId: managerFaultTypeIds[0] || '',
      faultTypeName: combinedFaultName,
      priority: managerPriority
    } : null);

    setSuccessMsg(`تم حفظ تشخيص العطل (${combinedFaultName}) ودرجة الأولوية بنجاح`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAssignTechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalReq) return;
    if (!assignTechId) {
      alert('يرجى اختيار فني الصيانة المكلف بالإصلاح من القائمة المنسدلة أولاً.');
      return;
    }
    const targetTech = technicians.find(t => t.id === assignTechId);

    const selectedFaults = faultTypes.filter(f => managerFaultTypeIds.includes(f.id));
    const selectedFaultNames = selectedFaults.map(f => f.name);
    const combinedFaultName = selectedFaultNames.length > 0 
      ? selectedFaultNames.join(' + ') 
      : (activeModalReq.faultTypeName || 'عطل تقني');

    assignTechnicianToRequest(
      activeModalReq.id,
      assignTechId,
      undefined,
      {
        faultTypeIds: managerFaultTypeIds,
        faultTypeNames: selectedFaultNames,
        faultTypeId: managerFaultTypeIds[0] || '',
        faultTypeName: combinedFaultName,
        priority: managerPriority
      }
    );

    setActiveModalReq(null);
    setSuccessMsg(`تم بنجاح تشخيص العطل (${combinedFaultName})، وتحديد الأولوية، وتعيين الفني المختص (${targetTech?.name || 'فني الصيانة'})`);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const handleTechReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalReq) return;

    if (techMaintType === 'internal') {
      const photosArr = techPhotoUrl.trim() ? [techPhotoUrl.trim()] : [];

      const formattedUsedParts = techSpareParts.map((p, idx) => ({
        partId: p.id || `SP-TECH-${Date.now()}-${idx}`,
        partName: p.name,
        partCode: p.code || `SP-${1000 + idx}`,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        currency: p.currency || techPartCurrency
      }));
      const partsSummaryStr = formatPartsCostSummary(formattedUsedParts);

      updateRequestWorkflow(activeModalReq.id, {
        status: 'pending_approval',
        maintenanceType: 'internal',
        technicalReport: techReportText.trim() || 'تم إجراء الصيانة المطلوبة وتجربة الجهاز بنجاح.',
        photos: photosArr,
        usedSpareParts: formattedUsedParts,
        partsCurrency: techPartCurrency
      });

      setTechReportText('');
      setTechPhotoUrl('');
      setTechSpareParts([]);
      setTechPartNameInput('');
      setTechPartCodeInput('');
      setTechPartQtyInput(1);
      setTechPartUnitPriceInput('');
      setActiveModalReq(null);
      setSuccessMsg(`تم رفع التقرير الفني للصيانة الميدانية${techSpareParts.length > 0 ? ` وتوثيق قطع الغيار وتكلفة (${partsSummaryStr}) وإضافتها لسجل صيانة الآلة` : ''} وإرسال الطلب للاعتماد`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } else {
      // External Workshop Request Form Submission
      updateRequestWorkflow(activeModalReq.id, {
        status: 'external_pending_maint_mgr',
        maintenanceType: 'external',
        requiresExternalWorkshop: true,
        externalWorkshopReason: extReasonText.trim() || 'طلب تحويل صيانة إلى ورشة خارجية لعدم إمكانية الإصلاح الميداني.'
      });

      setExtReasonText('');
      setActiveModalReq(null);
      setSuccessMsg('تم رفع طلب الورشة الخارجية إلى مدير الصيانة لرفعه للمدير العام للاعتماد');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Technician External Execution Phase Submission
  const handleExternalExecutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalReq) return;

    const partsTotal = extSpareParts.reduce((sum, p) => sum + p.totalPrice, 0);
    const labor = Number(extLaborCost) || 0;
    const finalTotal = labor + partsTotal;

    const formattedReportText = extReportText.trim().startsWith('تم استدعاء ورشة خارجية')
      ? extReportText.trim()
      : `تم استدعاء ورشة خارجية حيث: ${extReportText.trim() || 'تم تنفيذ عمليات الإصلاح والتأهيل بالورشة وتجربة الجهاز بنجاح.'}`;

    updateRequestWorkflow(activeModalReq.id, {
      status: 'pending_approval',
      maintenanceType: 'external',
      requiresExternalWorkshop: true,
      externalWorkshopName: extWorkshopName.trim() || 'ورشة خارجية',
      externalLaborCost: labor,
      externalPartsCost: partsTotal,
      externalSpareParts: extSpareParts,
      externalTotalCost: finalTotal,
      externalInvoicePhoto: extInvoicePhoto || undefined,
      technicalReport: formattedReportText
    });

    setExtWorkshopName('');
    setExtLaborCost('');
    setExtReportText('');
    setExtSpareParts([]);
    setExtInvoicePhoto('');
    setActiveModalReq(null);
    setSuccessMsg('تم رفع تقرير وتكاليف وصورة فاتورة الورشة الخارجية لمدير الصيانة للاعتماد النهائي والإغلاق');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleManagerSign = (reqId: string) => {
    signAndApproveByManager(reqId, managerSignNotes.trim() || undefined);
    setActiveModalReq(null);
    setManagerSignNotes('');
    setSuccessMsg('تم فحص وتوقيع الطلب بنجاح من قبل مدير الصيانة وإحالته لطالب الصيانة للإغلاق وتأكيد الاستلام');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleRequesterCloseRequest = (reqId: string) => {
    closeRequestByRequester(reqId, ratingStars, ratingFeedback.trim() || undefined);
    setActiveModalReq(null);
    setRatingFeedback('');
    setSuccessMsg('تم إغلاق طلب الصيانة وتأكيد استلام الآلة بنجاح من قبل طالب الصيانة');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleApproveClosure = (reqId: string) => {
    approveRequestClosure(reqId);
    setActiveModalReq(null);
    setSuccessMsg('تمت الموافقة على التقرير الفني وإغلاق طلب الصيانة واعتماده كـ مكتمل');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalReq) return;
    rateRequestService(activeModalReq.id, ratingStars, ratingFeedback.trim());
    setActiveModalReq(prev => prev ? { ...prev, rating: ratingStars, ratingFeedback: ratingFeedback.trim() } : null);
    setSuccessMsg('شكراً لك، تم حفظ التقييم بنجاح! يمكنك الآن تأكيد استلام الطلب والجهاز.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleConfirmReceipt = (reqId: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const fullDateStr = `${dateStr} (${timeStr})`;

    markRequestAsReceived(reqId);
    setActiveModalReq(prev => prev ? { ...prev, status: 'received', receivedDate: fullDateStr } : null);
    setSuccessMsg(`تم تأكيد استلام الطلب والجهاز بنجاح وتسجيل تاريخ ووقت الاستلام تلقائياً: ${fullDateStr}`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Export CSV / Excel
  const exportToCSV = () => {
    const headers = ['رقم الطلب', 'الجهاز', 'القسم', 'طالب الصيانة', 'الحالة', 'الفني', 'الأولوية', 'تاريخ الإنشاء'];
    const rows = filteredRequests.map(r => [
      r.code,
      `"${r.assetName}"`,
      `"${r.departmentName}"`,
      `"${r.requesterName}"`,
      r.status,
      `"${r.technicianName || 'غير معين'}"`,
      r.priority,
      r.creationDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maintenance_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Window Trigger
  const handlePrint = () => {
    window.print();
  };

  const statusMap: Record<RequestStatus, { bg: string; text: string; ring: string; label: string }> = {
    new: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'border-blue-200/80', label: 'جديد (New)' },
    assigned: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'border-purple-200/80', label: 'تم تعيين فني' },
    in_progress: { bg: 'bg-cyan-50', text: 'text-cyan-800', ring: 'border-cyan-200/80', label: 'قيد الإصلاح' },
    pending_approval: { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'border-amber-200/80', label: 'بانتظار توقيع مدير الصيانة' },
    pending_closure: { bg: 'bg-blue-50', text: 'text-blue-800', ring: 'border-blue-200/80', label: 'بانتظار إغلاق طالب الصيانة' },
    closed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'border-emerald-200/80', label: 'مغلق (مكتمل)' },
    received: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'border-teal-200/80', label: 'مستلم (Received)' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'border-slate-200', label: 'ملغى' },
    external_pending_maint_mgr: { bg: 'bg-indigo-50', text: 'text-indigo-800', ring: 'border-indigo-200/80', label: 'طلب ورشة (مدير الصيانة)' },
    external_pending_gm: { bg: 'bg-amber-50', text: 'text-amber-900', ring: 'border-amber-300', label: 'طلب ورشة (اعتماد أ. محمد زغموت)' },
    external_approved_by_gm: { bg: 'bg-emerald-50', text: 'text-emerald-800', ring: 'border-emerald-200/80', label: 'ورشة معتمدة (توجيه للفني)' },
    external_in_execution: { bg: 'bg-indigo-50', text: 'text-indigo-900', ring: 'border-indigo-200/80', label: 'قيد التنفيذ بالورشة الخارجية' }
  };

  const priorityMap: Record<PriorityLevel, { bg: string; label: string }> = {
    low: { bg: 'bg-slate-100 text-slate-700 border border-slate-200', label: 'منخفض' },
    medium: { bg: 'bg-blue-50 text-blue-700 border border-blue-200/80', label: 'متوسط' },
    high: { bg: 'bg-amber-50 text-amber-800 font-bold border border-amber-200/80', label: 'مرتفع' },
    critical: { bg: 'bg-rose-50 text-rose-700 font-extrabold border border-rose-300', label: 'حرج جداً' }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              إدارة طلبات الصيانة
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              متابعة دورة حياة الأعطال، تعيين الفنيين، التقارير الميدانية، واعتمادات الورش الخارجية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Create Request Button */}
          <button
            onClick={() => setSubView('create')}
            className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm px-4.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إنشاء طلب صيانة</span>
          </button>

          {/* Export Excel (CSV) */}
          <button
            onClick={exportToCSV}
            className="bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold text-sm px-4 py-2.5 border border-slate-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            title="تصدير جدول الطلبات إلى ملف Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          {/* Export PDF / Print */}
          <button
            onClick={handlePrint}
            className="bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold text-sm px-4 py-2.5 border border-slate-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            title="طباعة أو حفظ كملف PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة / PDF</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 text-sm font-semibold rounded-xl flex items-center gap-2.5 shadow-2xs no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Subview: Create New Request Form */}
      {subView === 'create' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6 no-print">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  إنشاء طلب صيانة جديد
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">يرجى تعبئة بيانات العطل بدقة لتوجيه الطلب للفني المختص</p>
              </div>
            </div>
            <button
              onClick={() => setSubView('view')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="إلغاء والعودة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateNewRequest} className="space-y-4 text-xs font-sans">
            
            {/* بيانات مقدم الطلب، وقت الإنشاء الآلي، وتاريخ وساعة العطل اليدوية */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-4 border border-slate-200/80 rounded-2xl">
              {/* 1. اسم مقدم الطلب (آلي وغير قابل للتغير) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>اسم مقدم الطلب:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={currentUser?.name || 'سامي الخالد (مشرف الإنتاج)'}
                    className="w-full border border-slate-200 bg-white text-slate-900 font-bold px-3 py-2 rounded-xl text-xs cursor-not-allowed pr-2"
                  />
                  <span className="absolute left-1.5 top-2 text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    تلقائي
                  </span>
                </div>
              </div>

              {/* 2. تاريخ وساعة إنشاء الطلب (آلي وتلقائي) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>تاريخ/ساعة الإنشاء:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={currentFormDateTime}
                    className="w-full border border-slate-200 bg-white text-blue-900 font-bold font-mono px-3 py-2 rounded-xl text-xs cursor-not-allowed text-left pr-2"
                  />
                  <span className="absolute left-1.5 top-2 text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">
                    آلي
                  </span>
                </div>
              </div>

              {/* 3. تاريخ وساعة حدوث العطل (يمكن للمستخدم تحديده) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تاريخ وساعة العطل:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const hours = String(now.getHours()).padStart(2, '0');
                      const minutes = String(now.getMinutes()).padStart(2, '0');
                      setNewReqFaultDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    }}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    [الآن]
                  </button>
                </div>
                <input
                  type="datetime-local"
                  required
                  value={newReqFaultDateTime}
                  onChange={(e) => setNewReqFaultDateTime(e.target.value)}
                  className="w-full border border-amber-300 bg-white text-slate-900 font-bold font-mono px-2.5 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>
            </div>
            
            {/* القسم المعني - محدد أوتوماتيكياً بحسب الموظف */}
            <div className="bg-amber-50/80 p-3 border border-amber-300 rounded-lg space-y-1">
              <label className="block font-bold text-amber-900 flex items-center gap-1.5">
                <span>القسم التابع له الموظف (يحدد تلقائياً):</span>
              </label>
              <select
                value={newReqDeptId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full border border-amber-400 px-3 py-2 font-bold text-slate-900 bg-white rounded"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-amber-800 font-sans">
                * يتم إظهار الآلات المتاحة في المعمل فقط والمخصصة لهذا القسم لتسهيل وتبسيط اختيار الآلة.
              </p>
            </div>

            {/* تصنيف وفرز نوع الآلة (حقن، بودرة، حب، شراب...) لتقسيم آلات قسم الإنتاج */}
            {departmentAssets.length > 0 && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span>التصنيف التشغيلي (فرز وتجميع حسب خط الإنتاج):</span>
                  </label>
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {newReqMachineTypeFilter === 'all' 
                      ? `معروض كل الآلات (${departmentAssets.length})` 
                      : `مفلتر: آلات (${newReqMachineTypeFilter}) فقط (${availableAssetsForRequest.length})`}
                  </span>
                </div>

                {/* أزرار فرز سريعة بحسب نوع الآلة (حقن، بودرة، إلخ) */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMachineTypeFilterChange('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      newReqMachineTypeFilter === 'all'
                        ? 'bg-blue-700 text-white shadow-xs ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-900'
                    }`}
                  >
                    كل التصنيفات ({departmentAssets.length})
                  </button>

                  {departmentMachineTypes.map(mType => {
                    const count = departmentAssets.filter(a => (a.machineType || inferMachineType(a)) === mType).length;
                    const isActive = newReqMachineTypeFilter === mType;
                    const isInjection = mType.includes('حقن');
                    const isPowder = mType.includes('بودرة');
                    const isPill = mType.includes('حب') || mType.includes('مضغوط');
                    const isSyrup = mType.includes('شراب');
                    const displayLabel = (mType === 'حب' || mType.includes('حب')) ? 'المضغوطات' : mType;

                    return (
                      <button
                        key={mType}
                        type="button"
                        onClick={() => handleMachineTypeFilterChange(mType)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-400'
                            : 'bg-white text-slate-800 border border-blue-200 hover:bg-blue-100/50'
                        }`}
                      >
                        {isInjection && '💉'}
                        {isPowder && '🧪'}
                        {isPill && '💊'}
                        {isSyrup && '🧴'}
                        <span>{displayLabel}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* اختيار الجهاز المعطل المفلتر حسب القسم ونوع الآلة */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-900">
                  الآلة / الجهاز المعطل <span className="text-red-600">*</span>
                </label>
                <span className="text-xs text-blue-700 font-bold">
                  {availableAssetsForRequest.length} آلة جاهزة للاختيار
                </span>
              </div>

              <select
                value={newReqAssetId}
                onChange={(e) => setNewReqAssetId(e.target.value)}
                className="w-full border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 px-3 py-2.5 text-slate-900 font-bold bg-white rounded-xl"
              >
                {availableAssetsForRequest.length === 0 ? (
                  <option value="">لا توجد آلات مسجلة تحت هذا التصنيف حالياً</option>
                ) : newReqMachineTypeFilter === 'all' && Object.keys(groupedAssetsForRequest).length > 1 ? (
                  // تقسيم كل تصنيف (حقن، بودرة، المضغوطات...) لحال في مجموعة optgroup
                  (Object.entries(groupedAssetsForRequest) as [string, Asset[]][]).map(([groupType, groupList]) => {
                    const optLabel = (groupType === 'حب' || groupType.includes('حب')) ? 'المضغوطات' : groupType;
                    return (
                      <optgroup key={groupType} label={`📂 آلات تصنيف: ${optLabel} (${groupList.length} آلة)`}>
                        {groupList.map(a => (
                          <option key={a.id} value={a.id}>
                            [كود: {a.code}] - {a.name} ({a.location})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })
                ) : (
                  availableAssetsForRequest.map(a => (
                    <option key={a.id} value={a.id}>
                      [كود: {a.code}] - {a.name} ({a.location})
                    </option>
                  ))
                )}
              </select>

              {/* بطاقة تفاصيل فورية للآلة المختارة */}
              {(() => {
                const sel = assets.find(a => a.id === newReqAssetId);
                if (!sel) return null;
                const mType = sel.machineType || inferMachineType(sel);
                return (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                        كود: {sel.code}
                      </span>
                      <span className="font-extrabold text-slate-900">{sel.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[11px]">
                        تصنيف: {mType}
                      </span>
                      <span className="text-slate-500 text-[11px]">{sel.location}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* خيار: العطل متكرر (تم معالجته من قبل) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              newReqIsRecurring
                ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-400/20 shadow-xs'
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newReqIsRecurring}
                  onChange={(e) => setNewReqIsRecurring(e.target.checked)}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 mt-0.5 cursor-pointer shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-purple-600" />
                      العطل متكرر (تم معالجته من قبل)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      معالجة وتكليف آلي مباشر
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed font-sans">
                    في حال اختيار هذا البند، يعتبر العطل متكرراً وسبق علاجه؛ سيمر الطلب على مدير الصيانة للاطلاع فقط دون الحاجة لأي إجراء منه، حيث يقوم النظام باختيار نوع العطل والفني تلقائياً استناداً للحالات السابقة ونقل الطلب للفني المكلف مباشرة.
                  </p>
                </div>
              </label>

              {/* معاينة سريعة للحالة السابقة المطابقة للجهاز */}
              {newReqIsRecurring && (() => {
                const prevMatch = requests.find(r => 
                  r.assetId === newReqAssetId && 
                  r.technicianId && 
                  (r.faultTypeName || (r.faultTypeIds && r.faultTypeIds.length > 0))
                );

                if (prevMatch) {
                  return (
                    <div className="mt-3 pt-3 border-t border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-purple-950">
                        <span className="font-bold">سابقة الصيانة المسجلة للجهاز:</span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-300 text-purple-900">
                          {prevMatch.code}
                        </span>
                        <span className="font-bold text-slate-700">
                          (العطل: {prevMatch.faultTypeName})
                        </span>
                      </div>
                      <div className="text-purple-900 font-bold bg-purple-100 px-2.5 py-1 rounded-lg">
                        الفني المقترن آلياً: {prevMatch.technicianName || 'فني مختص'}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="mt-3 pt-3 border-t border-purple-200/80 text-xs text-purple-800 font-sans">
                    * سيقوم النظام بالبحث الذكي وتكليف الفني الأنسب ونوع العطل المتكرر بناءً على أقرب سجلات صيانة في المعمل فور إرسال الطلب.
                  </div>
                );
              })()}
            </div>

            {/* إشعار تنظيمي: تشخيص العطل ودرجة الأولوية يتم تحديدهما من قِبل مدير الصيانة (في حال لم يكن متكرراً) */}
            {!newReqIsRecurring && (
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-blue-950 block">
                    تشخيص العطل وتحديد درجة الأولوية:
                  </span>
                  <p className="text-slate-600 leading-relaxed font-sans">
                    حرصاً على دقة الفحص والتوجيه، يتم تشخيص أنواع الأعطال المشخصة (عبر اختيارات متعددة) وتحديد درجة الأولوية رسمياً من قِبل <strong className="font-bold text-blue-900">مدير الصيانة</strong> فور استلام الطلب وتكليف الفني المختص.
                  </p>
                </div>
              </div>
            )}

            {/* وصف العطل */}
            <div>
              <label className="block font-bold mb-1 text-slate-800">
                وصف التفاصيل والأعراض الملاحظة <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="اكتب تفاصيل العطل، أصوات غير عادية، رموز خطأ الشاشة..."
                value={newReqDescription}
                onChange={(e) => setNewReqDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-slate-900 font-sans font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSubView('view')}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors shadow-2xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إرسال طلب الصيانة</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Main Table Screen */}
      {(subView === 'view' || !subView) && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-5 p-5 sm:p-6">
          
          {/* Top Category Tabs Bar */}
          <div className="flex flex-wrap items-center gap-2.5 no-print border-b border-slate-100 pb-4 text-xs sm:text-sm font-bold">
            <button
              onClick={() => {
                setRequestCategoryTab('all');
                setOnlyPendingMyAction(false);
              }}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer font-bold shadow-2xs ${
                requestCategoryTab === 'all' && !onlyPendingMyAction
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-blue-400" />
              <span>جميع طلبات الصيانة</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                requestCategoryTab === 'all' && !onlyPendingMyAction ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {allAccessibleCount}
              </span>
            </button>

            <button
              onClick={() => {
                setRequestCategoryTab('my_requests');
                setOnlyPendingMyAction(false);
              }}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer font-bold shadow-2xs ${
                requestCategoryTab === 'my_requests' && !onlyPendingMyAction
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <User className="w-4 h-4 text-purple-500" />
              <span>طلباتي</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                requestCategoryTab === 'my_requests' && !onlyPendingMyAction ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {myRequestsCount}
              </span>
            </button>

            <button
              onClick={() => {
                setRequestCategoryTab('external_workshop');
                setOnlyPendingMyAction(false);
              }}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer font-bold shadow-2xs ${
                requestCategoryTab === 'external_workshop' && !onlyPendingMyAction
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 border-indigo-200/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>اعتماد الورشة الخارجية</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                requestCategoryTab === 'external_workshop' && !onlyPendingMyAction ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-800 border border-indigo-200'
              }`}>
                {externalWorkshopCount}
              </span>
              {pendingExternalCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[11px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                  {pendingExternalCount} معلق
                </span>
              )}
            </button>

            {/* Filter by User Action Pending */}
            <button
              onClick={() => setOnlyPendingMyAction(!onlyPendingMyAction)}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer font-bold text-xs sm:text-sm ${
                onlyPendingMyAction
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs ring-2 ring-amber-400/50'
                  : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border-amber-200'
              }`}
              title="تصفية الطلبات التي تتطلب اتخاذ إجراء من طرفك"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>الطلبات التي تنتظر إجرائي</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                onlyPendingMyAction ? 'bg-amber-600 text-white' : 'bg-white text-amber-900 border border-amber-200'
              }`}>
                {pendingUserActionCount}
              </span>
            </button>
          </div>

          {/* Active Filter Notice if "Only Pending My Action" is ON */}
          {onlyPendingMyAction && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-900 font-medium shadow-2xs no-print">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>التصفية مفعلة: يتم عرض <strong>الطلبات التي تنتظر إجرائك فقط ({sortedFilteredRequests.length})</strong></span>
              </div>
              <button
                onClick={() => setOnlyPendingMyAction(false)}
                className="bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
              >
                إظهار الكل
              </button>
            </div>
          )}

          {/* Search & Multi-Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 no-print text-xs sm:text-sm font-medium">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="بحث برقم الطلب، الجهاز، الفني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-slate-50/50 hover:bg-white focus:bg-white rounded-xl transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50/50 hover:bg-white focus:bg-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">جميع الحالات</option>
                <option value="new">جديد (New)</option>
                <option value="assigned">تم تعيين فني</option>
                <option value="in_progress">قيد الإصلاح</option>
                <option value="pending_approval">بانتظار توقيع مدير الصيانة</option>
                <option value="pending_closure">بانتظار إغلاق طالب الصيانة</option>
                <option value="closed">مغلق (مكتمل)</option>
                <option value="received">مستلم (Received)</option>
                <option value="cancelled">ملغى</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50/50 hover:bg-white focus:bg-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">جميع الأولويات</option>
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">مرتفع</option>
                <option value="critical">حرج جداً</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50/50 hover:bg-white focus:bg-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">جميع الأقسام</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Technician Filter */}
            <div>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">تصفية حسب الفني (الكل)</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.activeRequestsCount} طلبات نشطة)
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Results count indicator */}
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100">
            <span>عدد الطلبات المعروضة: <strong className="text-slate-900 font-bold">{sortedFilteredRequests.length}</strong> طلب</span>
            {sortedFilteredRequests.length === 0 && (
              <span className="text-rose-600 font-bold">لا توجد طلبات تطابق معايير التصفية الحالية</span>
            )}
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-3.5 text-xs font-bold">كود الطلب</th>
                  <th className="py-3 px-3.5 text-xs font-bold">الجهاز / الأصل</th>
                  <th className="py-3 px-3.5 text-xs font-bold">القسم</th>
                  <th className="py-3 px-3.5 text-xs font-bold">طالب الصيانة</th>
                  <th className="py-3 px-3.5 text-xs font-bold">الحالة</th>
                  <th className="py-3 px-3.5 text-xs font-bold">الفني المكلف</th>
                  <th className="py-3 px-3.5 text-xs font-bold">الأولوية</th>
                  <th className="py-3 px-3.5 text-xs font-bold">تاريخ وساعة العطل</th>
                  <th className="py-3 px-3.5 text-xs font-bold text-center no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="text-xs font-sans divide-y divide-slate-100">
                {sortedFilteredRequests.map((req) => {
                  const needsUserAction = isActionRequiredForUser(req, activeRole, currentUser?.id, currentUser?.name, currentMatchedTech?.id);
                  return (
                    <tr
                      key={req.id}
                      className={`group transition-colors duration-150 ${
                        needsUserAction
                          ? 'bg-amber-50/70 hover:bg-amber-100/70 border-r-4 border-r-amber-500 font-semibold text-slate-900'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <td className="py-3.5 px-3.5 font-mono font-bold text-blue-600">
                        <div>{req.code}</div>
                        {req.isRecurring && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                            <RotateCcw className="w-2.5 h-2.5 text-purple-600" />
                            عطل متكرر
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 font-bold text-slate-900">
                        {req.assetName}
                        <span className="block text-[11px] font-mono text-slate-400 font-normal">{req.assetCode}</span>
                        {req.faultTypeNames && req.faultTypeNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {req.faultTypeNames.map((ftn, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                                {ftn}
                              </span>
                            ))}
                          </div>
                        ) : req.faultTypeName && req.faultTypeName !== 'بانتظار تحديد مدير الصيانة' ? (
                          <span className="inline-block bg-blue-50 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200 mt-1">
                            {req.faultTypeName}
                          </span>
                        ) : (
                          <span className="inline-block bg-amber-50 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-200 mt-1">
                            بانتظار تشخيص العطل
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-slate-600">{req.departmentName}</td>
                      <td className="py-3.5 px-3.5 text-slate-600">{req.requesterName}</td>
                      <td className="py-3.5 px-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg border ${statusMap[req.status].ring} ${statusMap[req.status].bg} ${statusMap[req.status].text}`}>
                          {statusMap[req.status].label}
                        </span>
                        {needsUserAction && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-2xs">
                            <AlertTriangle className="w-3 h-3" /> ينتظر إجرائك
                          </span>
                        )}
                        {req.requiresExternalWorkshop && (
                          <span className="block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200/80 w-fit">
                            ورشة خارجية {req.externalWorkshopStatus === 'approved' ? '✓' : req.externalWorkshopStatus === 'rejected' ? '✕' : '⏳'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 font-semibold text-slate-800">
                        {req.technicianName ? (
                          <div>
                            <span>{req.technicianName}</span>
                            {req.isRecurring && (
                              <span className="block text-[10px] text-purple-700 font-bold mt-0.5">
                                (تكليف آلي من النظام)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">لم يعين بعد</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5">
                        <span className={`inline-block px-2 py-0.5 text-[11px] rounded-md font-bold ${priorityMap[req.priority].bg}`}>
                          {priorityMap[req.priority].label}
                        </span>
                        {req.status === 'new' && (
                          <span className="block text-[9px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-1 font-bold w-fit">
                            بانتظار الإدارة
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-slate-600">
                        <div className="font-semibold text-slate-800">{req.faultOccurrenceDate || req.creationDate}</div>
                        <div className="text-[10px] text-slate-400 font-mono">إنشاء: {req.creationDate}</div>
                        {req.executionDateTime && (
                          <div className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">تنفيذ: {req.executionDateTime}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveModalReq(req);
                              setAssignTechId(req.technicianId || '');
                              if (req.usedSpareParts && req.usedSpareParts.length > 0) {
                                setTechSpareParts(req.usedSpareParts.map((p, idx) => ({
                                  id: p.partId || `SP-TECH-${idx}`,
                                  name: p.partName,
                                  code: p.partCode || '',
                                  quantity: p.quantity,
                                  unitPrice: p.unitPrice,
                                  totalPrice: p.unitPrice * p.quantity,
                                  currency: (p.currency as '$' | 'ل.س') || (req.partsCurrency as '$' | 'ل.س') || '$'
                                })));
                                const initialCur = (req.usedSpareParts[0]?.currency as '$' | 'ل.س') || (req.partsCurrency as '$' | 'ل.س') || '$';
                                setTechPartCurrency(initialCur);
                              } else {
                                setTechSpareParts([]);
                                setTechPartCurrency('$');
                              }
                              setTechPartNameInput('');
                              setTechPartCodeInput('');
                              setTechPartQtyInput(1);
                              setTechPartUnitPriceInput('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                              needsUserAction
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold'
                                : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 hover:border-blue-600'
                            }`}
                            title="عرض تفاصيل الطلب واتخاذ إجراء"
                          >
                            تفاصيل / إجراء
                          </button>

                          <button
                            onClick={() => {
                              setPdfTargetReq(req);
                              setShowPDFModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-2xs"
                            title="توليد وطباعة تقرير الصيانة الرسمي (أكديما) كـ PDF لهذا الطلب"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>تقرير PDF</span>
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

      {/* Comprehensive Request Detail & Action Workflow Modal */}
      {activeModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-7 space-y-6 my-8 text-slate-800 max-h-[90vh] overflow-y-auto font-sans rounded-3xl">
            
            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                  {activeModalReq.code}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    طلب صيانة: {activeModalReq.assetName}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">كود الأصل: {activeModalReq.assetCode}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalReq(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Details Card */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-slate-50/80 border border-slate-200/80 p-4 text-xs rounded-2xl shadow-2xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">القسم المعني:</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{activeModalReq.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">مقدم الطلب:</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{activeModalReq.requesterName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">درجة الأولوية:</span>
                <span className="font-bold">{priorityMap[activeModalReq.priority].label}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">تاريخ/ساعة العطل:</span>
                <span className="font-bold font-mono text-amber-900 text-xs">{activeModalReq.faultOccurrenceDate || activeModalReq.creationDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">إنشاء الطلب:</span>
                <span className="font-bold font-mono text-blue-900 text-xs">{activeModalReq.creationDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">تاريخ/ساعة التنفيذ:</span>
                <span className="font-bold font-mono text-emerald-800 text-xs">
                  {activeModalReq.executionDateTime || (activeModalReq.executionDate ? `${activeModalReq.executionDate} ${activeModalReq.executionTime || ''}` : 'تلقائي عند الحفظ')}
                </span>
              </div>
            </div>

            {/* بطاقة نوع العطل المشخص ودرجة الأولوية المعتمدة */}
            <div className="bg-slate-50 border border-slate-200/90 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  نوع العطل المشخص (مدير الصيانة):
                </span>
                {activeModalReq.faultTypeNames && activeModalReq.faultTypeNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeModalReq.faultTypeNames.map((ftName, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {ftName}
                      </span>
                    ))}
                  </div>
                ) : activeModalReq.faultTypeName && activeModalReq.faultTypeName !== 'بانتظار تحديد مدير الصيانة' ? (
                  <span className="bg-blue-100 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {activeModalReq.faultTypeName}
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    بانتظار تشخيص وتحديد مدير الصيانة
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">درجة الأولوية:</span>
                <span className={`px-2.5 py-0.5 rounded-lg font-black ${priorityMap[activeModalReq.priority].bg}`}>
                  {priorityMap[activeModalReq.priority].label}
                </span>
              </div>
            </div>

            {/* Fault Description */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-1">
              <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>تفاصيل العطل والشكوى:</span>
              </h4>
              <p className="font-sans font-medium text-xs sm:text-sm leading-relaxed text-slate-900">{activeModalReq.description}</p>
            </div>

            {/* Existing Technical Report & Spare Parts Log */}
            {activeModalReq.technicalReport && activeModalReq.maintenanceType !== 'external' && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 space-y-2.5 rounded-2xl">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <h4 className="font-extrabold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                    <span>التقرير الفني للإصلاح الداخلي:</span>
                  </h4>
                  {(activeModalReq.executionDateTime || activeModalReq.executionDate) && (
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      تاريخ وساعة التنفيذ: {activeModalReq.executionDateTime || `${activeModalReq.executionDate} | ${activeModalReq.executionTime}`}
                    </span>
                  )}
                </div>
                <p className="font-sans font-medium text-xs sm:text-sm text-slate-900 leading-relaxed">{activeModalReq.technicalReport}</p>

                {/* Used Spare Parts */}
                {activeModalReq.usedSpareParts && activeModalReq.usedSpareParts.length > 0 && (
                  <div className="pt-3 border-t border-emerald-200/80 text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-600" />
                        قطع الغيار المستهلكة المسجلة في الصيانة:
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold px-2.5 py-0.5 rounded-lg text-xs font-mono">
                        إجمالي تكلفة القطع: {formatPartsCostSummary(activeModalReq.usedSpareParts)} (مضافة لسجل صيانة الآلة)
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-emerald-200/80 rounded-xl bg-white shadow-2xs">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-emerald-50/70 text-emerald-950 font-bold border-b border-emerald-200/60">
                          <tr>
                            <th className="p-2 pr-3">م</th>
                            <th className="p-2">اسم قطعة الغيار</th>
                            <th className="p-2">كود القطعة</th>
                            <th className="p-2 text-center">الكمية</th>
                            <th className="p-2 text-center">السعر المفرد</th>
                            <th className="p-2 text-center pl-3">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100">
                          {activeModalReq.usedSpareParts.map((part, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 pr-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2 font-bold text-slate-900">{part.partName}</td>
                              <td className="p-2 font-mono text-slate-600">{part.partCode || '-'}</td>
                              <td className="p-2 text-center font-bold font-mono text-blue-900">{part.quantity}</td>
                              <td className="p-2 text-center font-mono text-slate-700">
                                {part.unitPrice.toLocaleString()} {part.currency || '$'}
                              </td>
                              <td className="p-2 text-center pl-3 font-bold font-mono text-emerald-800 bg-emerald-50/50">
                                {(part.unitPrice * part.quantity).toLocaleString()} {part.currency || '$'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1. External Workshop Approval & Status Card (ONLY for requests requiring/requesting external workshop) */}
            {(activeModalReq.requiresExternalWorkshop || activeModalReq.maintenanceType === 'external' || activeModalReq.status.startsWith('external_')) && (
              <div className="bg-indigo-50/50 border border-indigo-200/80 p-4 text-xs space-y-3 font-sans rounded-2xl shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                  <h4 className="font-extrabold text-indigo-950 flex items-center gap-2 text-xs sm:text-sm">
                    <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
                    <span>اعتماد صيانة الورشة الخارجية (External Workshop Approval)</span>
                  </h4>

                  {/* Status badge */}
                  {activeModalReq.externalWorkshopStatus === 'approved' || ['external_approved_by_gm', 'external_in_execution'].includes(activeModalReq.status) ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      معتمد من المدير العام (أ. محمد زغموت)
                    </span>
                  ) : activeModalReq.externalWorkshopStatus === 'rejected' ? (
                    <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      مرفوضة من الورشة الخارجية
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      بانتظار الاعتماد والموافقة
                    </span>
                  )}
                </div>

                {(activeModalReq.externalWorkshopReason || activeModalReq.externalWorkshopNotes) && (
                  <div className="bg-indigo-100/60 p-2.5 rounded-lg border border-indigo-200 text-slate-800">
                    <span className="font-bold text-indigo-950 block mb-0.5">سبب طلب الورشة الخارجية:</span>
                    <p className="font-sans text-slate-800">{activeModalReq.externalWorkshopReason || activeModalReq.externalWorkshopNotes}</p>
                  </div>
                )}

                {activeModalReq.externalWorkshopApprovedBy && (
                  <div className="bg-white p-2.5 border border-indigo-100 rounded-lg text-slate-800 space-y-1">
                    <div>
                      <span className="text-slate-500 font-bold">المعتمد / الرافض: </span>
                      <span className="font-extrabold text-indigo-900">{activeModalReq.externalWorkshopApprovedBy}</span>
                    </div>
                    {activeModalReq.externalWorkshopApprovalDate && (
                      <div>
                        <span className="text-slate-500 font-bold">تاريخ وساعة الإجراء: </span>
                        <span className="font-extrabold font-mono text-slate-800">{activeModalReq.externalWorkshopApprovalDate}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Manager Action 1: Forward Technician's Request to General Manager (Status: external_pending_maint_mgr) */}
                {(activeRole === 'maintenance_manager' || activeRole === 'admin') && activeModalReq.status === 'external_pending_maint_mgr' && (
                  <div className="bg-white p-4 border border-indigo-200 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>طلب ورشة خارجية مرفوع من الفني (بانتظار توجيه مدير الصيانة للمدير العام):</span>
                    </div>
                    <p className="text-slate-600 font-sans text-xs">
                      قام الفني بطلب تحويل الصيانة إلى ورشة خارجية. انقر على الزر أدناه لرفع الطلب إلى المدير العام (أ. محمد زغموت) للاعتماد والموافقة.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        updateRequestWorkflow(activeModalReq.id, { status: 'external_pending_gm', requiresExternalWorkshop: true });
                        setActiveModalReq(prev => prev ? { ...prev, status: 'external_pending_gm' } : null);
                        setSuccessMsg('تم رفع طلب الورشة الخارجية إلى المدير العام (أ. محمد زغموت) للاعتماد');
                        setTimeout(() => setSuccessMsg(''), 4000);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs text-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>رفع الطلب للمدير العام (أ. محمد زغموت) للاعتماد</span>
                    </button>
                  </div>
                )}

                {/* Approval Action Form for General Manager / External Approver / Admin ONLY (Status: external_pending_gm) */}
                {(activeRole === 'external_approver' || activeRole === 'admin') && activeModalReq.status === 'external_pending_gm' && (
                  <div className="bg-white p-4 border border-indigo-200 rounded-2xl space-y-3 shadow-2xs">
                    <h5 className="font-extrabold text-indigo-950 flex items-center gap-2 text-xs sm:text-sm">
                      <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
                      <span>اعتماد وتوجيه المدير العام (أ. محمد زغموت):</span>
                    </h5>
                    <p className="text-slate-600 font-sans text-xs">
                      انقر على زر الموافقة المباشر للبدء بتحويل الطلب واعتماده للورشة الخارجية.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          approveExternalWorkshop(activeModalReq.id, 'approved', '', activeModalReq.externalTotalCost || 0);
                          setActiveModalReq(prev => prev ? {
                            ...prev,
                            status: 'external_approved_by_gm',
                            requiresExternalWorkshop: true,
                            externalWorkshopStatus: 'approved',
                            externalWorkshopApprovedBy: currentUser?.name || 'الأستاذ محمد زغموت',
                            externalWorkshopApprovalDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
                            externalWorkshopNotes: 'تم الاعتماد المباشر بضغط زر الموافقة',
                            externalWorkshopCost: activeModalReq.externalTotalCost || 0
                          } : null);
                          setSuccessMsg('تمت موافقة واعتماد تحويل الطلب إلى ورشة خارجية بنجاح!');
                          setTimeout(() => setSuccessMsg(''), 4000);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ اضغط هنا للموافقة واعتماد الورشة الخارجية مباشرة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          approveExternalWorkshop(activeModalReq.id, 'rejected', '', 0);
                          setActiveModalReq(prev => prev ? {
                            ...prev,
                            status: 'in_progress',
                            requiresExternalWorkshop: false,
                            maintenanceType: 'internal',
                            externalWorkshopStatus: 'rejected',
                            externalWorkshopApprovedBy: currentUser?.name || 'الأستاذ محمد زغموت',
                            externalWorkshopApprovalDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
                            externalWorkshopNotes: 'تم الرفض',
                            externalWorkshopCost: 0
                          } : null);
                          setSuccessMsg('تم رفض تحويل الطلب إلى ورشة خارجية وإعادته للصيانة الداخلية.');
                          setTimeout(() => setSuccessMsg(''), 4000);
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors text-xs"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>✕ رفض التحويل للورشة</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Information Banner for Maintenance Manager when waiting for GM */}
                {activeRole === 'maintenance_manager' && activeModalReq.status === 'external_pending_gm' && (
                  <div className="bg-amber-50/80 p-3.5 border border-amber-200 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-amber-950 font-bold">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>طلب الورشة الخارجية مرفوع إلى المدير العام (أ. محمد زغموت) للاعتماد:</span>
                    </div>
                    <p className="text-slate-600 font-sans text-xs">
                      تم تحويل الطلب بنجاح إلى المدير العام وهو قيد المراجعة والقرار منه. عند صدور الموافقة، ستتمكن من تحويل الطلب للفني للمباشرة بالتنفيذ.
                    </p>
                  </div>
                )}

                {/* Manager Action 2: Send GM Approved Request to Technician for Execution (Status: external_approved_by_gm) */}
                {(activeRole === 'maintenance_manager' || activeRole === 'admin') && activeModalReq.status === 'external_approved_by_gm' && (
                  <div className="bg-white p-4 border border-emerald-200 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>تمت موافقة المدير العام (أ. محمد زغموت) على الورشة الخارجية!</span>
                    </div>
                    <p className="text-slate-600 font-sans text-xs">
                      انقر على الزر أدناه لتوجيه الطلب وإرساله للفني للبدء بالتنفيذ وإدخال بيانات الورشة الخارجية.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        updateRequestWorkflow(activeModalReq.id, { status: 'external_in_execution' });
                        setActiveModalReq(prev => prev ? { ...prev, status: 'external_in_execution' } : null);
                        setSuccessMsg('تم إرسال وتوجيه الطلب للفني للتنفيذ في الورشة الخارجية');
                        setTimeout(() => setSuccessMsg(''), 4000);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs text-xs"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>إرسال وتوجيه الطلب للفني للتنفيذ بالورشة الخارجية</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. External Workshop Details & Cost Summary Card (DISPLAYED ONLY AFTER TECH SUBMITS REPORT) */}
            {!['external_pending_maint_mgr', 'external_pending_gm', 'external_in_execution'].includes(activeModalReq.status) &&
              (activeModalReq.externalWorkshopName || (activeModalReq.externalSpareParts && activeModalReq.externalSpareParts.length > 0) || (activeModalReq.externalTotalCost && activeModalReq.externalTotalCost > 0) || (activeModalReq.maintenanceType === 'external' && activeModalReq.technicalReport)) && (
              <div className="bg-slate-900 text-white border border-slate-800 p-5 text-xs space-y-3 font-sans rounded-2xl shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-2 text-xs sm:text-sm">
                    <Wrench className="w-4.5 h-4.5 text-indigo-400" />
                    <span>تقرير وتكاليف الورشة الخارجية (External Workshop Report)</span>
                  </h4>
                  <span className="bg-indigo-950 text-indigo-200 border border-indigo-800/80 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                    صيانة خارجية مستقلة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-xs mb-0.5">اسم الورشة الخارجية:</span>
                    <span className="text-emerald-400 font-extrabold text-sm sm:text-base">{activeModalReq.externalWorkshopName || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs mb-0.5">تكلفة أجور الورشة:</span>
                    <span className="text-amber-300 font-extrabold text-sm sm:text-base font-mono">{activeModalReq.externalLaborCost || 0} $</span>
                  </div>
                </div>

                {activeModalReq.technicalReport && (
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 font-bold block text-xs">الإجراء المتخذ وتوصيف الإصلاح:</span>
                    <p className="text-slate-200 font-sans text-xs sm:text-sm leading-relaxed">{activeModalReq.technicalReport}</p>
                  </div>
                )}

                {/* External Spare Parts Table */}
                {activeModalReq.externalSpareParts && activeModalReq.externalSpareParts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-indigo-300 font-bold block text-xs sm:text-sm">قطع الغيار المضافة من الورشة الخارجية (مستقلة):</span>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-800/90 text-slate-400">
                          <tr>
                            <th className="p-2.5 border-b border-slate-700">اسم القطعة</th>
                            <th className="p-2.5 border-b border-slate-700 text-center">الكمية</th>
                            <th className="p-2.5 border-b border-slate-700 text-center">سعر المفرد ($)</th>
                            <th className="p-2.5 border-b border-slate-700 text-left">الإجمالي ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {activeModalReq.externalSpareParts.map((sp, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50">
                              <td className="p-2.5 font-bold">{sp.name}</td>
                              <td className="p-2.5 text-center font-bold font-mono">{sp.quantity}</td>
                              <td className="p-2.5 text-center font-mono">{sp.unitPrice} $</td>
                              <td className="p-2.5 text-left font-bold text-amber-300 font-mono">{sp.totalPrice} $</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Display Invoice Photo if uploaded */}
                {activeModalReq.externalInvoicePhoto && (
                  <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>صورة فاتورة الورشة الخارجية المرفقة:</span>
                    </span>
                    <a href={activeModalReq.externalInvoicePhoto} target="_blank" rel="noreferrer" className="inline-block group">
                      <img
                        src={activeModalReq.externalInvoicePhoto}
                        alt="صورة فاتورة الورشة الخارجية"
                        className="max-h-48 rounded-xl border border-slate-700 object-contain hover:scale-105 transition-transform bg-black/40 p-1 cursor-pointer"
                      />
                    </a>
                  </div>
                )}

                {/* Cost Totals Calculation Banner */}
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-slate-300">
                      أجور الورشة: <span className="font-bold text-amber-300 font-mono">{activeModalReq.externalLaborCost || 0} $</span> + قطع الغيار الخارجية: <span className="font-bold text-amber-300 font-mono">{activeModalReq.externalPartsCost || 0} $</span>
                    </div>
                  </div>
                  <div className="bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-emerald-200 font-bold">التكلفة الإجمالية:</span>
                    <span className="text-emerald-300 font-extrabold text-sm sm:text-base font-mono">{activeModalReq.externalTotalCost || 0} $</span>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Action 1: Fault Diagnosis, Priority & Assign Technician (Exclusive for Admin or Maintenance Manager) */}
            {(activeRole === 'admin' || activeRole === 'maintenance_manager') && ['new', 'assigned', 'in_progress'].includes(activeModalReq.status) && (() => {
              if (activeModalReq.isRecurring && !showManagerRecurringOverride) {
                return (
                  <div className="bg-purple-50/90 border-2 border-purple-300 p-5 text-xs space-y-4 font-sans rounded-2xl shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
                      <div>
                        <h4 className="font-extrabold text-purple-950 flex items-center gap-2 text-xs sm:text-sm">
                          <RotateCcw className="w-5 h-5 text-purple-600" />
                          <span>عطل متكرر — تم التشخيص والتكليف آلياً بواسطة النظام</span>
                          <span className="text-[11px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md">
                            لا يتطلب أي إجراء من مدير الصيانة
                          </span>
                        </h4>
                        <p className="text-purple-800 text-[11px] mt-1 leading-relaxed">
                          {activeModalReq.recurringMatchNote || 'هذا العطل متكرر وسبق علاجه؛ قام النظام آلياً باختيار نوع العطل وتعيين الفني بناءً على الحالات السابقة وتوجيه الطلب مباشرة للفني لمباشرة الصيانة.'}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold bg-white text-purple-900 border border-purple-300 px-3 py-1 rounded-lg self-start sm:self-auto shadow-2xs">
                        حالة الطلب: {statusMap[activeModalReq.status].label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-purple-200">
                      <div>
                        <span className="text-slate-500 block text-[11px]">نوع العطل المعتمد آلياً:</span>
                        <span className="font-extrabold text-slate-900 text-xs block mt-0.5">
                          {activeModalReq.faultTypeName || 'عطل متكرر'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">الفني المكلف آلياً:</span>
                        <span className="font-extrabold text-blue-900 text-xs flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          {activeModalReq.technicianName || 'الفني المختص'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">درجة الأولوية:</span>
                        <span className={`inline-block px-2 py-0.5 text-[11px] rounded-md font-bold mt-0.5 ${priorityMap[activeModalReq.priority].bg}`}>
                          {priorityMap[activeModalReq.priority].label}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-purple-900 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تم تحويل الطلب تلقائياً إلى صندوق مهام الفني ({activeModalReq.technicianName}) لمباشرة التنفيذ دون انتظار.</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowManagerRecurringOverride(true)}
                        className="text-[11px] text-purple-800 hover:text-purple-950 underline font-bold cursor-pointer"
                      >
                        [تعديل التشخيص أو الفني المكلف يدوياً (استثنائي)]
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <form onSubmit={handleAssignTechSubmit} className="bg-white border-2 border-emerald-300/80 p-5 text-xs space-y-4.5 font-sans rounded-2xl shadow-xs">
                  {activeModalReq.isRecurring && showManagerRecurringOverride && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                        أنت تقوم حالياً بالتعديل اليدوي الاستثنائي لطلب عطل متكرر.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowManagerRecurringOverride(false)}
                        className="text-[10px] text-purple-700 hover:text-purple-950 font-bold underline cursor-pointer"
                      >
                        [الرجوع للملخص الآلي]
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-emerald-950 flex items-center gap-2 text-xs sm:text-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span>تشخيص نوع العطل وتحديد الأولوية وتكليف الفني</span>
                        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                          صلاحية مدير الصيانة
                        </span>
                      </h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        حدد أنواع الأعطال المشخصة، درجة الأولوية الرسمية، والفني المكلف بالإصلاح.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-lg self-start sm:self-auto">
                      حالة الطلب: {statusMap[activeModalReq.status].label}
                    </span>
                  </div>

                  {/* 1. تحديد نوع العطل عبر Checkboxes (اختيار متعدد) */}
                  <div className="space-y-2 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        <span>تشخيص نوع العطل (يمكنك اختيار أكثر من نوع):</span>
                      </label>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900">
                        {managerFaultTypeIds.length === 0 ? 'لم يتم الاختيار بعد' : `تم اختيار (${managerFaultTypeIds.length}) تصنيفات`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {faultTypes.map(ft => {
                        const isChecked = managerFaultTypeIds.includes(ft.id);
                        return (
                          <label
                            key={ft.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-blue-50 border-blue-500 text-blue-950 font-black ring-2 ring-blue-400/30 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-semibold'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let updated: string[];
                                if (e.target.checked) {
                                  updated = [...managerFaultTypeIds, ft.id];
                                } else {
                                  updated = managerFaultTypeIds.filter(id => id !== ft.id);
                                }
                                setManagerFaultTypeIds(updated);
                              }}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs">{ft.name}</span>
                              {ft.category && ft.category !== ft.name && (
                                <span className="text-[10px] text-slate-400 font-normal">({ft.category})</span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. تحديد درجة الأولوية من مدير الصيانة */}
                  <div className="space-y-2 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>درجة الأولوية (تحدد رسمياً من قِبل مدير الصيانة):</span>
                      </label>
                      <span className="text-[11px] font-bold text-slate-600">
                        الحالية: <strong className="text-slate-900">{priorityMap[managerPriority].label}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {(['low', 'medium', 'high', 'critical'] as PriorityLevel[]).map(p => {
                        const isSelected = managerPriority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setManagerPriority(p)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? `${priorityMap[p].bg} ring-2 ring-slate-900 font-black shadow-xs`
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{priorityMap[p].label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="block font-bold mb-1 text-slate-800 flex items-center justify-between">
                      <span>اختيار فني الصيانة المكلف بالإصلاح:</span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        اختيار مدير الصيانة
                      </span>
                    </label>
                    <select
                      value={assignTechId}
                      onChange={(e) => setAssignTechId(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 text-xs"
                    >
                      <option value="">-- اختر فني الصيانة المطلوب تكليفه بالإصلاح --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.specializationName ? `— (${t.specializationName})` : ''} | (المهام النشطة: {t.activeRequestsCount || 0})
                        </option>
                      ))}
                    </select>
                    {!assignTechId && (
                      <p className="text-[11px] text-amber-700 font-bold mt-1.5">
                        * يرجى اختيار الفني من القائمة لتكليفه بمهمة الصيانة
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSaveFaultAndPriorityOnly}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-600" />
                      <span>حفظ تشخيص العطل والأولوية فقط</span>
                    </button>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs text-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{activeModalReq.status === 'new' ? 'اعتماد التشخيص وتكليف الفني' : 'حفظ التعديلات وإعادة التعيين'}</span>
                    </button>
                  </div>
                </form>
              );
            })()}

            {/* Workflow Action 2A: Technician Selection (Internal vs External Workshop Request) - For Status: assigned / in_progress */}
            {(() => {
              const isMaintenanceManager = activeRole === 'maintenance_manager' || currentUser?.role === 'maintenance_manager';
              const canWriteTechReport = (activeRole === 'technician' || currentUser?.role === 'technician' || (activeRole === 'admin' && currentUser?.role === 'admin')) && !isMaintenanceManager;

              if (!canWriteTechReport || !['assigned', 'in_progress'].includes(activeModalReq.status)) {
                return null;
              }

              return (
                <form onSubmit={handleTechReportSubmit} className="bg-white border border-slate-200 p-5 text-xs space-y-4 font-sans rounded-2xl shadow-2xs">
                  {activeModalReq.isRecurring && (
                    <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
                      <RotateCcw className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold block">مهمة عطل متكرر محالة إليك مباشرة بواسطة النظام:</span>
                        <p className="text-[11px] text-purple-800 mt-0.5">
                          تم تشخيص العطل ({activeModalReq.faultTypeName}) وتكليفك بالعملية تلقائياً استناداً إلى سابقة الصيانة المسجلة لهذا الأصل، يمكنك مباشرة الفحص وتنفيذ الصيانة فوراً.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                      <Wrench className="w-4.5 h-4.5 text-blue-600" />
                      <span>إجراءات الفني وتحديد نوع الصيانة:</span>
                    </h4>
                  </div>

                  {/* Radio Choice Selector for Internal vs External Maintenance */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700 text-xs">حدد مسار الصيانة المتخذ:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`p-3.5 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all ${techMaintType === 'internal' ? 'border-emerald-500 bg-emerald-50/80 shadow-2xs' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name="techMaintTypeChoice"
                          value="internal"
                          checked={techMaintType === 'internal'}
                          onChange={() => setTechMaintType('internal')}
                          className="mt-0.5 w-4 h-4 accent-emerald-600"
                        />
                        <div>
                          <span className="font-bold text-emerald-950 block text-xs">1. صيانة داخلية وميدانية (Internal)</span>
                          <span className="text-[11px] text-slate-500 font-sans block mt-0.5">توصيف إجراءات الإصلاح الفنية المنجزة ميدانياً</span>
                        </div>
                      </label>

                      <label className={`p-3.5 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all ${techMaintType === 'external' ? 'border-indigo-500 bg-indigo-50/80 shadow-2xs' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name="techMaintTypeChoice"
                          value="external"
                          checked={techMaintType === 'external'}
                          onChange={() => setTechMaintType('external')}
                          className="mt-0.5 w-4 h-4 accent-indigo-600"
                        />
                        <div>
                          <span className="font-bold text-indigo-950 block text-xs">2. طلب ورشة خارجية (External Workshop)</span>
                          <span className="text-[11px] text-slate-500 font-sans block mt-0.5">تحويل الطلب لموافقة مدير الصيانة ثم اعتماد المدير العام</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Condition 1: Internal Maintenance Form */}
                  {techMaintType === 'internal' ? (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {/* Automatic Execution Date and Time Banner */}
                      <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-emerald-950">
                          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>تاريخ وساعة التنفيذ (تسجيل تلقائي):</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono font-bold text-emerald-900 bg-white px-2.5 py-1 border border-emerald-200 rounded-lg text-xs">
                          <span>{currentFormDateTime}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">تلقائي ⚡</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-slate-700">توصيف التقرير الفني والإجراء المتخذ:</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="اكتب التقرير الميداني وإجراءات الإصلاح الفنية بالتفصيل..."
                          value={techReportText}
                          onChange={(e) => setTechReportText(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-3 font-sans bg-white focus:ring-2 focus:ring-emerald-500/20 text-xs"
                        />
                      </div>

                      {/* Manual Spare Parts Entry Section for Technician */}
                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                          <div>
                            <h5 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>قطع الغيار المستهلكة بالصيانة وتكاليفها (إدخال يدوي):</span>
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              أدخل اسم القطعة وعددها وسعرها يدوياً لتُضاف تكلفتها تلقائياً إلى سجل صيانة وتكاليف الآلة.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Currency Selector ($ or ل.س) */}
                            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                              <span className="text-[11px] font-bold text-slate-600">عملة التسعير:</span>
                              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setTechPartCurrency('$')}
                                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    techPartCurrency === '$'
                                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                  title="التسعير بالدولار الأمريكي ($)"
                                >
                                  <span>$</span>
                                  <span className="text-[10px] opacity-80">(دولار)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTechPartCurrency('ل.س')}
                                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    techPartCurrency === 'ل.س'
                                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                  title="التسعير بالليرة السورية (ل.س)"
                                >
                                  <span>ل.س</span>
                                  <span className="text-[10px] opacity-80">(سوري)</span>
                                </button>
                              </div>
                            </div>

                            {techSpareParts.length > 0 && (
                              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-black font-mono">
                                الإجمالي: {formatPartsCostSummary(techSpareParts)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Input Row for Manual Part Entry */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-8">
                              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                اسم قطعة الغيار <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="مثال: سير نقل حركة V-Belt B-68، محمل كروي، قاطع كهربائي..."
                                value={techPartNameInput}
                                onChange={(e) => setTechPartNameInput(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                الرمز / الكود (اختياري)
                              </label>
                              <input
                                type="text"
                                placeholder="كود القطعة"
                                value={techPartCodeInput}
                                onChange={(e) => setTechPartCodeInput(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1 border-t border-slate-100">
                            <div className="sm:col-span-3">
                              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                العدد (الكمية) <span className="text-rose-500">*</span>
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={techPartQtyInput}
                                  onChange={(e) => setTechPartQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-black text-slate-900 bg-white text-center focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                              </div>
                            </div>

                            {/* Large Prominent Price Input */}
                            <div className="sm:col-span-6">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-extrabold text-emerald-950">
                                  سعر القطعة المفردة ({techPartCurrency}) <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-[11px] text-slate-500 font-medium">العملة:</span>
                                  <button
                                    type="button"
                                    onClick={() => setTechPartCurrency('$')}
                                    className={`px-2 py-0.5 rounded-md text-xs font-extrabold cursor-pointer transition-all ${
                                      techPartCurrency === '$' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    $ دولار
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTechPartCurrency('ل.س')}
                                    className={`px-2 py-0.5 rounded-md text-xs font-extrabold cursor-pointer transition-all ${
                                      techPartCurrency === 'ل.س' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    ل.س سوري
                                  </button>
                                </div>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0.00"
                                  value={techPartUnitPriceInput}
                                  onChange={(e) => setTechPartUnitPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full border-2 border-emerald-500/80 rounded-xl px-4 py-2.5 pl-14 text-base font-mono font-black text-slate-900 bg-emerald-50/20 text-center focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-inner"
                                />
                                <span className="absolute left-3.5 top-2.5 text-xs font-black text-emerald-700 font-mono pointer-events-none bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                  {techPartCurrency}
                                </span>
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <button
                                type="button"
                                onClick={handleAddTechSparePart}
                                disabled={!techPartNameInput.trim()}
                                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-xl text-sm whitespace-nowrap cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 h-[44px]"
                                title="إضافة القطعة للقائمة"
                              >
                                <span>+ إضافة القطعة</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* List of Added Spare Parts */}
                        {techSpareParts.length > 0 ? (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                                <tr>
                                  <th className="p-2.5 pr-3">م</th>
                                  <th className="p-2.5">اسم قطعة الغيار</th>
                                  <th className="p-2.5">الكود</th>
                                  <th className="p-2.5 text-center">العدد</th>
                                  <th className="p-2.5 text-center">السعر الإفرادي</th>
                                  <th className="p-2.5 text-center">الإجمالي</th>
                                  <th className="p-2.5 text-center pl-3">حذف</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {techSpareParts.map((item, idx) => (
                                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-2.5 pr-3 font-mono text-slate-400">{idx + 1}</td>
                                    <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                                    <td className="p-2.5 font-mono text-slate-600 text-[11px]">{item.code}</td>
                                    <td className="p-2.5 text-center font-bold font-mono text-blue-900">{item.quantity}</td>
                                    <td className="p-2.5 text-center font-mono text-slate-700 font-semibold">
                                      {item.unitPrice.toLocaleString()} <span className="text-[11px] font-bold text-slate-500">{item.currency || '$'}</span>
                                    </td>
                                    <td className="p-2.5 text-center font-bold font-mono text-emerald-800 bg-emerald-50/50">
                                      {item.totalPrice.toLocaleString()} <span className="text-[11px] font-bold text-emerald-950">{item.currency || '$'}</span>
                                    </td>
                                    <td className="p-2.5 text-center pl-3">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTechSparePart(item.id)}
                                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                                        title="حذف القطعة"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 inline" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-emerald-50/80 border-t border-emerald-200 font-bold text-emerald-950">
                                <tr>
                                  <td colSpan={5} className="p-2.5 pr-3 text-right">
                                    إجمالي تكلفة قطع الغيار المستهلكة (ستضاف لسجل صيانة الآلة):
                                  </td>
                                  <td className="p-2.5 text-center font-mono font-black text-emerald-900 text-sm">
                                    {formatPartsCostSummary(techSpareParts)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-3 text-center text-slate-500 text-[11px]">
                            لم يتم إضافة أي قطع غيار لهذا الإجراء (إذا تم استبدال قطع، يمكنك إدخالها أعلاه باختيار العملة $ أو ل.س لحفظ تكلفتها بسجل صيانة الآلة).
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2 text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>رفع تقرير الصيانة لمدير الصيانة للمعاينة والتوقيع بعد الإصلاح</span>
                      </button>
                    </div>
                  ) : (
                    /* Condition 2: External Workshop Request Form */
                    <div className="space-y-3 pt-2 border-t border-indigo-100 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200/70">
                      <div className="flex items-center gap-2 text-indigo-950 font-bold">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span>طلب تحويل العطل لورشة خارجية:</span>
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700">سبب الشكوى والحاجة للورشة الخارجية (توصيف العطل للجهة الإدارية)</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="اشرح أسباب عدم إمكانية الإصلاح الميداني والحاجة لورشة خارجية..."
                          value={extReasonText}
                          onChange={(e) => setExtReasonText(e.target.value)}
                          className="w-full border border-indigo-200 rounded-xl p-3 font-sans bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2 text-xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>رفع طلب الورشة الخارجية لمدير الصيانة</span>
                      </button>
                    </div>
                  )}
                </form>
              );
            })()}

            {/* Workflow Action 2B: External Workshop Data Entry & Execution Form (For Status: external_in_execution) */}
            {(() => {
              const isMaintenanceManager = activeRole === 'maintenance_manager' || currentUser?.role === 'maintenance_manager';
              const canExecuteExternal = (activeRole === 'technician' || currentUser?.role === 'technician' || (activeRole === 'admin' && currentUser?.role === 'admin')) && !isMaintenanceManager;

              if (!canExecuteExternal || activeModalReq.status !== 'external_in_execution') {
                return null;
              }

              const extPartsTotalSum = extSpareParts.reduce((sum, p) => sum + p.totalPrice, 0);
              const extLaborVal = Number(extLaborCost) || 0;
              const extTotalFinalVal = extLaborVal + extPartsTotalSum;

              return (
                <form onSubmit={handleExternalExecutionSubmit} className="bg-slate-900 text-white border border-slate-800 p-5 text-xs space-y-4 font-sans rounded-2xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <h4 className="font-bold text-indigo-300 flex items-center gap-2 text-xs sm:text-sm">
                      <Wrench className="w-4.5 h-4.5 text-indigo-400" />
                      <span>إدخال بيانات وتكاليف الورشة الخارجية (المرحلة الميدانية):</span>
                    </h4>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                      معتمد من المدير العام ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">اسم الورشة الخارجية المكلفة</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: ورشة الشرق للخرطة والهيدروليك"
                        value={extWorkshopName}
                        onChange={(e) => setExtWorkshopName(e.target.value)}
                        className="w-full border border-slate-700 rounded-xl px-3 py-2.5 bg-slate-800 text-white font-sans focus:ring-2 focus:ring-indigo-500/30 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">أجور أيدي عاملة/تكلفة الورشة ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="مثال: 250"
                        value={extLaborCost}
                        onChange={(e) => setExtLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-slate-700 rounded-xl px-3 py-2.5 bg-slate-800 text-amber-300 font-bold font-mono focus:ring-2 focus:ring-indigo-500/30 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">توصيف الإجراء المتخذ وتفاصيل الصيانة بالورشة</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="اكتب التقرير الفني والتفاصيل الصادرة من الورشة..."
                      value={extReportText}
                      onChange={(e) => setExtReportText(e.target.value)}
                      className="w-full border border-slate-700 rounded-xl p-3 bg-slate-800 text-slate-100 font-sans focus:ring-2 focus:ring-indigo-500/30 text-xs"
                    />
                  </div>

                  {/* External Spare Parts Sub-Form (Independent from Warehouse) */}
                  <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-3">
                    <span className="font-bold text-indigo-300 block border-b border-slate-700 pb-1.5 text-xs">
                      إدخال قطع الغيار التي وضعتها الورشة الخارجية:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 text-[10px] mb-0.5">اسم قطعة الغيار الخارجية</label>
                        <input
                          type="text"
                          placeholder="مثال: مضخة هيدروليك زيت 5 بار"
                          value={extPartNameInput}
                          onChange={(e) => setExtPartNameInput(e.target.value)}
                          className="w-full border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-900 text-white font-sans text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">العدد</label>
                        <input
                          type="number"
                          min="1"
                          value={extPartQtyInput}
                          onChange={(e) => setExtPartQtyInput(Number(e.target.value))}
                          className="w-full border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-900 text-white font-bold text-center text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">سعر القطعة المفردة ($)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="120"
                          value={extPartUnitPriceInput}
                          onChange={(e) => setExtPartUnitPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-900 text-amber-300 font-bold text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddExternalSparePart}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      + إضافة قطعة غيار من الورشة
                    </button>

                    {/* Staged External Spare Parts List */}
                    {extSpareParts.length > 0 && (
                      <div className="overflow-x-auto border border-slate-700 rounded-xl mt-2">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-900 text-slate-400">
                            <tr>
                              <th className="p-2 border-b border-slate-700">القطعة</th>
                              <th className="p-2 border-b border-slate-700 text-center">الكمية</th>
                              <th className="p-2 border-b border-slate-700 text-center">سعر القطعة ($)</th>
                              <th className="p-2 border-b border-slate-700 text-left">الإجمالي ($)</th>
                              <th className="p-2 border-b border-slate-700 text-center">حذف</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {extSpareParts.map((item) => (
                              <tr key={item.id}>
                                <td className="p-2 font-bold">{item.name}</td>
                                <td className="p-2 text-center font-bold font-mono">{item.quantity}</td>
                                <td className="p-2 text-center font-mono text-amber-300">{item.unitPrice} $</td>
                                <td className="p-2 text-left font-bold text-amber-300 font-mono">{item.totalPrice} $</td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExternalSparePart(item.id)}
                                    className="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Upload Invoice Image */}
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-2">
                    <label className="block font-bold text-indigo-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>تحميل صورة الفاتورة الخارجية (إجباري / اختياري مع أرشفة السند):</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInvoiceImageUpload}
                        className="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                      />
                      {extInvoicePhoto && (
                        <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-500/50">
                          <img src={extInvoicePhoto} alt="فاتورة الورشة" className="w-8 h-8 object-cover rounded-md border border-slate-700" />
                          <span className="text-[10px] text-emerald-400 font-bold">تم تحميل صورة الفاتورة ✓</span>
                          <button
                            type="button"
                            onClick={() => setExtInvoicePhoto('')}
                            className="text-rose-400 text-xs hover:text-rose-300 font-bold ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Automatic Cost Sum Banner */}
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block text-[11px]">حساب التكلفة النهائية تلقائياً:</span>
                      <span className="text-slate-200 font-mono">
                        أجور الورشة (<span className="text-amber-300 font-bold">{extLaborVal} $</span>) + قطع غيار الورشة (<span className="text-amber-300 font-bold">{extPartsTotalSum} $</span>)
                      </span>
                    </div>
                    <div className="bg-emerald-950 border border-emerald-500/60 px-4 py-2 rounded-xl text-emerald-300 font-extrabold font-mono text-sm shadow-xs text-center">
                      التكلفة الإجمالية: {extTotalFinalVal} $
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إرسال تقرير الورشة الخارجية لمدير الصيانة للمعاينة والتوقيع بعد الإصلاح</span>
                  </button>
                </form>
              );
            })()}

            {/* Manager Signed Verification Badge (If already signed by Maintenance Manager) */}
            {activeModalReq.managerSigned && (
              <div className="bg-emerald-50/90 border border-emerald-300 p-4 rounded-2xl space-y-2 shadow-2xs font-sans text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-xs sm:text-sm">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>توقيع واعتماد مدير الصيانة بعد الإصلاح (معتمد وموقع):</span>
                  </div>
                  {activeModalReq.managerSignedDate && (
                    <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg">
                      {activeModalReq.managerSignedDate}
                    </span>
                  )}
                </div>
                <div className="bg-white/90 border border-emerald-200 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span>موقّع من قِبل:</span>
                    <span className="text-emerald-900 font-extrabold">{activeModalReq.managerSignedBy || 'م. أحمد النجار (مدير الصيانة)'}</span>
                  </div>
                  {activeModalReq.managerNotes && (
                    <p className="text-slate-600 text-xs leading-relaxed">
                      <strong className="text-slate-800">توجيهات وملاحظات مدير الصيانة:</strong> "{activeModalReq.managerNotes}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Workflow Action 3: Maintenance Manager Review & Sign after Repair (Status: pending_approval) */}
            {activeModalReq.status === 'pending_approval' && (
              (activeRole === 'admin' || activeRole === 'maintenance_manager' || currentUser?.role === 'maintenance_manager') ? (
                <div className="bg-amber-50/90 border-2 border-amber-300 p-5 text-xs space-y-3.5 font-sans rounded-2xl shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-700 shrink-0" />
                      <span>معاينة وتوقيع مدير الصيانة بعد اكتمال الإصلاح:</span>
                    </h4>
                    <span className="bg-amber-200 text-amber-950 font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                      بانتظار توقيعك للاعتماد
                    </span>
                  </div>

                  <p className="font-sans text-amber-950 leading-relaxed text-xs">
                    <strong>مهمة مدير الصيانة:</strong> معاينة ومراجعة التقرير الفني المرفوع وتفاصيل قطع الغيار والتكاليف والتأكد من جودة الإصلاح، والتوقيع بالاعتماد لإحالة الطلب مباشرة إلى <strong>طالب الصيانة</strong> ليقوم بتجربة الآلة واستلامها وإغلاق الطلب نهائياً.
                  </p>

                  {activeModalReq.usedSpareParts && activeModalReq.usedSpareParts.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                        <Package className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>تكلفة قطع الغيار المسجلة بالطلب (تضاف لسجل صيانة الآلة):</span>
                      </div>
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-1 rounded-lg text-xs font-mono">
                        {formatPartsCostSummary(activeModalReq.usedSpareParts)}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold mb-1.5 text-slate-800 text-xs">
                      ملاحظات وتوجيهات مدير الصيانة بعد الإصلاح (اختياري):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: تمت معاينة وتجربة الآلة فنياً، الإصلاح مطابق للمواصفات وموقع بالاعتماد..."
                      value={managerSignNotes}
                      onChange={(e) => setManagerSignNotes(e.target.value)}
                      className="w-full border border-amber-300 rounded-xl p-2.5 bg-white font-sans text-xs focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <button
                    onClick={() => handleManagerSign(activeModalReq.id)}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs text-xs"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>✍️ التوقيع والاعتماد بعد الإصلاح (وإحالته لطالب الصيانة للإغلاق)</span>
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <strong className="block font-bold text-amber-950">الطلب بانتظار مراجعة وتوقيع مدير الصيانة:</strong>
                    <span className="text-amber-800">أنهى الفني أعمال الصيانة، والطلب معروض حالياً على مدير الصيانة لمعاينة الإصلاح والتوقيع عليه قبل تحويله لطالب الصيانة للإغلاق.</span>
                  </div>
                </div>
              )
            )}

            {/* Workflow Action 4: Requester Closes the Request & Confirms Receipt (Status: pending_closure) */}
            {activeModalReq.status === 'pending_closure' && (() => {
              const isRequester = currentUser && (
                activeModalReq.requesterId === currentUser.id ||
                (activeModalReq.requesterName && currentUser.name && (
                  activeModalReq.requesterName.toLowerCase().trim().includes(currentUser.name.toLowerCase().trim()) ||
                  currentUser.name.toLowerCase().trim().includes(activeModalReq.requesterName.toLowerCase().trim())
                ))
              );
              const canRequesterClose = isRequester || activeRole === 'admin';

              if (canRequesterClose) {
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-300 p-5 text-xs space-y-4 font-sans rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-200/80 pb-3">
                      <div className="flex items-center gap-2 text-indigo-950 font-black text-xs sm:text-sm">
                        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span>إغلاق طلب الصيانة وتأكيد استلام الآلة (طالب الصيانة):</span>
                      </div>
                      <span className="bg-indigo-600 text-white font-bold px-3 py-1 rounded-lg text-xs shadow-2xs">
                        مهمة طالب الصيانة الحصرية
                      </span>
                    </div>

                    <p className="font-sans text-indigo-950 leading-relaxed text-xs">
                      قام مدير الصيانة (<strong className="text-indigo-900">{activeModalReq.managerSignedBy || 'مدير الصيانة'}</strong>) بمعاينة جودة الإصلاح والتوقيع عليه. بصفتك <strong>طالب الصيانة ({activeModalReq.requesterName})</strong>، يرجى تجربة الآلة والتأكد من زوال العطل، ثم تقييم الخدمة وإغلاق الطلب رسمياً وتأكيد استلام الآلة.
                    </p>

                    {/* Rating & Feedback Form */}
                    <div className="bg-white/90 p-4 rounded-xl border border-indigo-200 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-slate-800">تقييمك لجودة وسرعة الصيانة:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingStars(star)}
                              className="p-1 cursor-pointer transition-transform hover:scale-125"
                              title={`${star} نجوم`}
                            >
                              <Star className={`w-5 h-5 ${star <= ratingStars ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                          {ratingStars} من 5 نجوم
                        </span>
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-slate-800">ملاحظاتك بعد تجربة الآلة (اختياري):</label>
                        <input
                          type="text"
                          placeholder="مثال: تم تجربة الآلة وتعمل بكفاءة ممتازة، شكراً لفريق الصيانة..."
                          value={ratingFeedback}
                          onChange={(e) => setRatingFeedback(e.target.value)}
                          className="w-full border border-indigo-200 rounded-xl p-2.5 bg-white font-sans text-xs focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    {/* Close Request Button */}
                    <button
                      type="button"
                      onClick={() => handleRequesterCloseRequest(activeModalReq.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>✓ إغلاق طلب الصيانة وتأكيد استلام الآلة (طالب الصيانة)</span>
                    </button>
                  </div>
                );
              } else {
                return (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center gap-2 text-blue-950 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                      <span>تم توقيع واعتماد الطلب من قبل مدير الصيانة</span>
                    </div>
                    <p className="text-blue-900 leading-relaxed">
                      وفقاً لنظام الصيانة، <strong>طالب الصيانة ({activeModalReq.requesterName})</strong> هو المسؤول الحصري عن تجربة الآلة وإغلاق الطلب وتأكيد الاستلام. الطلب الآن بانتظار إغلاقه من قِبله.
                    </p>
                  </div>
                );
              }
            })()}

            {/* Workflow Action 5: Display Closed & Received Status */}
            {(activeModalReq.status === 'closed' || activeModalReq.status === 'received') && (
              <div className="bg-emerald-50/90 border border-emerald-300 p-4.5 rounded-2xl font-sans text-xs space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>تم إغلاق طلب الصيانة وتأكيد استلام الآلة بنجاح</span>
                  </div>
                  {activeModalReq.closureDate && (
                    <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg">
                      تاريخ الإغلاق: {activeModalReq.closureDate}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 block text-[11px]">أغلق من قِبل:</span>
                    <span className="font-extrabold text-slate-900">{activeModalReq.closedByRequesterName || activeModalReq.requesterName} (طالب الصيانة)</span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 block text-[11px]">تقييم طالب الصيانة للخدمة:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-black">{'⭐'.repeat(activeModalReq.rating || 5)}</span>
                      <span className="font-bold text-slate-700">({activeModalReq.rating || 5} من 5)</span>
                    </div>
                  </div>
                </div>

                {activeModalReq.ratingFeedback && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 text-xs text-slate-700">
                    <strong className="text-slate-900">ملاحظات طالب الصيانة:</strong> "{activeModalReq.ratingFeedback}"
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setPdfTargetReq(activeModalReq);
                  setShowPDFModal(true);
                }}
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer transition-colors flex items-center gap-2 shadow-2xs"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>طباعة تقرير الصيانة PDF (النموذج الرسمي)</span>
              </button>

              <button
                onClick={() => setActiveModalReq(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Official ACDIVET Maintenance Report PDF Modal */}
      {showPDFModal && (
        <MaintenanceReportPDF
          request={pdfTargetReq}
          onClose={() => {
            setShowPDFModal(false);
            setPdfTargetReq(null);
          }}
        />
      )}

    </div>
  );
};

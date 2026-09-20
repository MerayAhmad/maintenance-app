import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  Department,
  User,
  RolePermission,
  DeviceType,
  FaultType,
  Asset,
  TechnicianSpecialization,
  Technician,
  SparePart,
  Supplier,
  MaintenanceRequest,
  RequestStatus,
  OperationLog,
  SystemSettings,
  UsedSparePart,
  ExternalSparePart,
  PriorityLevel,
  AppNotification,
  NotificationType
} from '../types';

import {
  initialDepartments,
  initialDeviceTypes,
  initialFaultTypes,
  initialUsers,
  initialSpecializations,
  initialTechnicians,
  initialAssets,
  initialSpareParts,
  initialSuppliers,
  initialMaintenanceRequests,
  initialRolePermissions,
  initialOperationLogs,
  initialSystemSettings,
  initialNotifications,
  inferMachineType
} from '../data/initialData';

interface AppContextType {
  // Navigation & Role Simulation
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  subView: string | null;
  setSubView: (subView: string | null) => void;

  // Entities State
  departments: Department[];
  deviceTypes: DeviceType[];
  faultTypes: FaultType[];
  users: User[];
  specializations: TechnicianSpecialization[];
  technicians: Technician[];
  assets: Asset[];
  spareParts: SparePart[];
  suppliers: Supplier[];
  requests: MaintenanceRequest[];
  rolePermissions: RolePermission[];
  operationLogs: OperationLog[];
  systemSettings: SystemSettings;

  // Actions - Departments
  addDepartment: (name: string) => Department;
  updateDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;

  // Actions - Users
  addUser: (userData: Omit<User, 'id' | 'createdDate'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Actions - Permissions
  updateRolePermission: (roleId: UserRole, updatedPermission: RolePermission) => void;

  // Actions - Assets & Master Data
  addAsset: (assetData: Omit<Asset, 'id'>) => Asset;
  updateAsset: (id: string, assetData: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addDeviceType: (name: string, code: string) => DeviceType;
  deleteDeviceType: (id: string) => void;

  addFaultType: (name: string, category?: string) => FaultType;
  deleteFaultType: (id: string) => void;
  resetFaultTypesToDefault: () => void;

  // Actions - Technicians
  addTechnician: (techData: Omit<Technician, 'id' | 'activeRequestsCount' | 'completedRequestsCount'>) => Technician;
  updateTechnician: (id: string, techData: Partial<Technician>) => void;
  deleteTechnician: (id: string) => void;
  addSpecialization: (name: string) => void;

  // Actions - Warehouse
  addSparePart: (partData: Omit<SparePart, 'id'>) => SparePart;
  updateSparePart: (id: string, partData: Partial<SparePart>) => void;
  addStockQuantity: (id: string, qtyToAdd: number) => void;
  deleteSparePart: (id: string) => void;

  // Actions - Suppliers
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Actions - Requests Workflow
  createRequest: (requestData: {
    assetId: string;
    description: string;
    faultTypeId?: string;
    priority?: PriorityLevel;
    faultOccurrenceDate?: string;
    requesterId?: string;
    requesterName?: string;
    faultTypeIds?: string[];
    faultTypeNames?: string[];
    isRecurring?: boolean;
  }) => MaintenanceRequest;

  assignTechnicianToRequest: (
    requestId: string,
    technicianId: string,
    estimatedTimeHours?: number,
    extra?: {
      faultTypeIds?: string[];
      faultTypeNames?: string[];
      faultTypeId?: string;
      faultTypeName?: string;
      priority?: PriorityLevel;
    }
  ) => void;

  updateRequestFaultAndPriority: (
    requestId: string,
    data: {
      faultTypeIds?: string[];
      faultTypeNames?: string[];
      faultTypeId?: string;
      faultTypeName?: string;
      priority?: PriorityLevel;
    }
  ) => void;

  updateRequestWorkflow: (requestId: string, payload: {
    status: RequestStatus;
    technicalReport?: string;
    photos?: string[];
    usedSpareParts?: UsedSparePart[];
    partsCurrency?: '$' | 'ل.س' | string;
    maintenanceType?: 'internal' | 'external';
    externalWorkshopName?: string;
    externalLaborCost?: number;
    externalPartsCost?: number;
    externalSpareParts?: ExternalSparePart[];
    externalTotalCost?: number;
    requiresExternalWorkshop?: boolean;
    externalWorkshopNotes?: string;
    externalWorkshopCost?: number;
  }) => void;

  approveExternalWorkshop: (requestId: string, status: 'approved' | 'rejected', notes?: string, cost?: number) => void;

  signAndApproveByManager: (requestId: string, notes?: string, signature?: string) => void;
  closeRequestByRequester: (requestId: string, rating?: number, feedback?: string) => void;
  approveRequestClosure: (requestId: string) => void;
  rateRequestService: (requestId: string, rating: number, feedback: string) => void;
  markRequestAsReceived: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  deleteRequest: (requestId: string) => void;

  // System Settings & Backup
  updateSettings: (settings: Partial<SystemSettings>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  restoreFromBackup: (jsonData: string) => boolean;
  exportBackupJSON: () => string;
  resetDemoData: () => void;

  // Helpers & Alerts
  lowStockAlerts: SparePart[];
  addLog: (action: string, module: string, details: string) => void;

  // Real-time In-App Notifications
  notifications: AppNotification[];
  userNotifications: AppNotification[];
  unreadNotificationsCount: number;
  toastNotification: AppNotification | null;
  addNotification: (data: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  clearToastNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const sortRequestsNewestFirst = (list: MaintenanceRequest[]): MaintenanceRequest[] => {
  return [...list].sort((a, b) => {
    const parseDate = (d?: string): number => {
      if (!d) return 0;
      
      // Clean standard separators
      const cleaned = d.replace(' | ', ' ').trim();
      
      // Try native JS Date.parse
      let parsed = Date.parse(cleaned);
      if (!isNaN(parsed) && parsed > 0) return parsed;

      // Extract parts: YYYY-MM-DD HH:mm:ss
      const match = d.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s*\|\s*|\s+|T)?(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?\s*(AM|PM|ص|م)?/i);
      if (match) {
        let [_, y, m, day, h, min, sec, ampm] = match;
        let hour = parseInt(h || '0', 10);
        if (ampm) {
          const ampmUpper = ampm.toUpperCase();
          if ((ampmUpper === 'PM' || ampmUpper === 'م') && hour < 12) hour += 12;
          if ((ampmUpper === 'AM' || ampmUpper === 'ص') && hour === 12) hour = 0;
        }
        const dt = new Date(
          parseInt(y, 10),
          parseInt(m, 10) - 1,
          parseInt(day, 10),
          hour,
          parseInt(min || '0', 10),
          parseInt(sec || '0', 10)
        );
        return dt.getTime();
      }
      return 0;
    };

    const timeA = parseDate(a.creationDate) || parseDate(a.faultOccurrenceDate);
    const timeB = parseDate(b.creationDate) || parseDate(b.faultOccurrenceDate);
    if (timeB !== timeA) return timeB - timeA;

    const numA = parseInt((a.code || a.id).replace(/\D/g, '') || '0', 10);
    const numB = parseInt((b.code || b.id).replace(/\D/g, '') || '0', 10);
    if (numB !== numA) return numB - numA;

    return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or Fallback
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cmms_activeRole');
    return saved ? JSON.parse(saved) : 'admin';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cmms_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeView, setActiveView] = useState<string>(() => {
    const saved = localStorage.getItem('cmms_activeView');
    return saved ? JSON.parse(saved) : 'dashboard';
  });

  const [subView, setSubView] = useState<string | null>(() => {
    const saved = localStorage.getItem('cmms_subView');
    return saved ? JSON.parse(saved) : null;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('cmms_departments');
    return saved ? JSON.parse(saved) : initialDepartments;
  });

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>(() => {
    const saved = localStorage.getItem('cmms_deviceTypes');
    return saved ? JSON.parse(saved) : initialDeviceTypes;
  });

  const [faultTypes, setFaultTypes] = useState<FaultType[]>(() => {
    const saved = localStorage.getItem('cmms_faultTypes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback to initial
      }
    }
    return initialFaultTypes;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('cmms_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [specializations, setSpecializations] = useState<TechnicianSpecialization[]>(() => {
    const saved = localStorage.getItem('cmms_specializations');
    return saved ? JSON.parse(saved) : initialSpecializations;
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('cmms_technicians');
    return saved ? JSON.parse(saved) : initialTechnicians;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('cmms_assets');
    const rawList: Asset[] = saved ? JSON.parse(saved) : initialAssets;
    return rawList.map(a => ({
      ...a,
      machineType: a.machineType || inferMachineType(a)
    }));
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    const saved = localStorage.getItem('cmms_spareParts');
    return saved ? JSON.parse(saved) : initialSpareParts;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('cmms_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [requests, setRequests] = useState<MaintenanceRequest[]>(() => {
    const saved = localStorage.getItem('cmms_requests');
    const rawList: MaintenanceRequest[] = saved ? JSON.parse(saved) : initialMaintenanceRequests;
    return sortRequestsNewestFirst(rawList);
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem('cmms_rolePermissions');
    return saved ? JSON.parse(saved) : initialRolePermissions;
  });

  const [operationLogs, setOperationLogs] = useState<OperationLog[]>(() => {
    const saved = localStorage.getItem('cmms_operationLogs');
    return saved ? JSON.parse(saved) : initialOperationLogs;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('cmms_systemSettings');
    return saved ? JSON.parse(saved) : initialSystemSettings;
  });

  // Auto-migrate to new departments, users and technicians data version if needed
  useEffect(() => {
    const currentVer = localStorage.getItem('cmms_data_version');
    if (currentVer !== 'v15_machine_types_and_code_focus') {
      const sortedReqs = sortRequestsNewestFirst(initialMaintenanceRequests);
      setDepartments(initialDepartments);
      setUsers(initialUsers);
      setTechnicians(initialTechnicians);
      setAssets(initialAssets);
      setRequests(sortedReqs);
      setRolePermissions(initialRolePermissions);
      localStorage.setItem('cmms_departments', JSON.stringify(initialDepartments));
      localStorage.setItem('cmms_users', JSON.stringify(initialUsers));
      localStorage.setItem('cmms_technicians', JSON.stringify(initialTechnicians));
      localStorage.setItem('cmms_assets', JSON.stringify(initialAssets));
      localStorage.setItem('cmms_requests', JSON.stringify(sortedReqs));
      localStorage.setItem('cmms_rolePermissions', JSON.stringify(initialRolePermissions));
      localStorage.setItem('cmms_data_version', 'v15_machine_types_and_code_focus');

      // Update current user if already logged in to match new admin/manager name or Mohammad Zaghmout role
      if (currentUser && currentUser.username === 'admin') {
        setCurrentUser(initialUsers[0]);
      } else if (currentUser && currentUser.username === 'maint_mgr') {
        setCurrentUser(initialUsers[1]);
      } else if (currentUser && (currentUser.username === 'm_zaghmoot' || currentUser.id === 'USR-101')) {
        const found = initialUsers.find(u => u.username === 'm_zaghmoot');
        if (found) setCurrentUser(found);
      }
    }
  }, []);

  // Real-time Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('cmms_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    localStorage.setItem('cmms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((data: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const timestamp = `${dateStr} | ${timeStr}`;

    const newNotif: AppNotification = {
      ...data,
      id: `NOTIF-${Date.now()}`,
      timestamp,
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    setToastNotification(newNotif);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearToastNotification = useCallback(() => {
    setToastNotification(null);
  }, []);

  // Filter notifications relevant to current user role and user id
  const userNotifications = notifications.filter(n => {
    if (n.targetRole) {
      if (activeRole === 'admin' || activeRole === 'maintenance_manager') {
        if (n.targetRole === 'technician' || n.targetRole === 'employee') {
          return false;
        }
        return true;
      }
      if (activeRole === 'technician') {
        if (n.targetRole !== 'technician') return false;
        if (n.targetUserId && currentUser) {
          const currentTech = technicians.find(t => t.username.toLowerCase() === currentUser.username.toLowerCase());
          const isMatch = n.targetUserId === currentUser.id ||
                          n.targetUserId.toLowerCase() === currentUser.username.toLowerCase() ||
                          (currentTech && n.targetUserId === currentTech.id);
          return isMatch;
        }
        return true;
      }
      if (activeRole === 'employee') {
        if (n.targetRole !== 'employee') return false;
        if (n.targetUserId && currentUser) {
          return n.targetUserId === currentUser.id || n.targetUserId.toLowerCase() === currentUser.username.toLowerCase();
        }
        return true;
      }
      return n.targetRole === activeRole;
    }

    if (n.targetUserId && currentUser) {
      const currentTech = technicians.find(t => t.username.toLowerCase() === currentUser.username.toLowerCase());
      return n.targetUserId === currentUser.id || n.targetUserId.toLowerCase() === currentUser.username.toLowerCase() || (currentTech && n.targetUserId === currentTech.id);
    }

    return true;
  });

  const unreadNotificationsCount = userNotifications.filter(n => !n.read).length;

  // Save to local storage on state updates
  useEffect(() => { localStorage.setItem('cmms_isAuthenticated', JSON.stringify(isAuthenticated)); }, [isAuthenticated]);
  useEffect(() => { localStorage.setItem('cmms_currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('cmms_activeRole', JSON.stringify(activeRole)); }, [activeRole]);
  useEffect(() => { localStorage.setItem('cmms_activeView', JSON.stringify(activeView)); }, [activeView]);
  useEffect(() => { localStorage.setItem('cmms_subView', JSON.stringify(subView)); }, [subView]);

  useEffect(() => { localStorage.setItem('cmms_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('cmms_deviceTypes', JSON.stringify(deviceTypes)); }, [deviceTypes]);
  useEffect(() => { localStorage.setItem('cmms_faultTypes', JSON.stringify(faultTypes)); }, [faultTypes]);
  useEffect(() => { localStorage.setItem('cmms_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('cmms_specializations', JSON.stringify(specializations)); }, [specializations]);
  useEffect(() => { localStorage.setItem('cmms_technicians', JSON.stringify(technicians)); }, [technicians]);
  useEffect(() => { localStorage.setItem('cmms_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('cmms_spareParts', JSON.stringify(spareParts)); }, [spareParts]);
  useEffect(() => { localStorage.setItem('cmms_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('cmms_requests', JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem('cmms_rolePermissions', JSON.stringify(rolePermissions)); }, [rolePermissions]);
  useEffect(() => { localStorage.setItem('cmms_operationLogs', JSON.stringify(operationLogs)); }, [operationLogs]);
  useEffect(() => { localStorage.setItem('cmms_systemSettings', JSON.stringify(systemSettings)); }, [systemSettings]);

  // Helper log function
  const addLog = (action: string, moduleName: string, details: string) => {
    const roleLabels: Record<UserRole, string> = {
      admin: 'مدير النظام',
      maintenance_manager: 'مدير الصيانة',
      technician: 'فني صيانة',
      employee: 'طالب صيانة',
      external_approver: 'مسؤول اعتماد الورشة الخارجية'
    };

    const newLog: OperationLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser?.name || (activeRole === 'admin' ? 'مدير النظام' : activeRole === 'maintenance_manager' ? 'مدير الصيانة' : activeRole === 'technician' ? 'فني الصيانة' : activeRole === 'external_approver' ? 'مسؤول اعتماد الورشة الخارجية' : 'الموظف / طالب الصيانة'),
      userRole: roleLabels[activeRole] || activeRole,
      action,
      module: moduleName,
      details
    };
    setOperationLogs(prev => [newLog, ...prev]);
  };

  // Low stock alerts
  const lowStockAlerts = spareParts.filter(part => part.quantity <= part.minThreshold);

  // --- Department Actions ---
  const addDepartment = (name: string, managerName?: string): Department => {
    const nextNum = departments.length + 101;
    const newDept: Department = {
      id: `DEPT-${nextNum}`,
      name,
      managerName: managerName || '',
      createdDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      userCount: 0,
      assetCount: 0
    };
    setDepartments(prev => [...prev, newDept]);
    addLog('إضافة قسم جديد', 'الأقسام', `تم إضافة القسم: ${name} (الرقم ${newDept.id}) ${managerName ? `مدير القسم: ${managerName}` : ''}`);
    return newDept;
  };

  const updateDepartment = (id: string, name: string, managerName?: string) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, name, managerName: managerName !== undefined ? managerName : d.managerName } : d));
    addLog('تعديل قسم', 'الأقسام', `تم تعديل بيانات القسم ${id}`);
  };

  const deleteDepartment = (id: string) => {
    const target = departments.find(d => d.id === id);
    setDepartments(prev => prev.filter(d => d.id !== id));
    addLog('حذف قسم', 'الأقسام', `تم حذف القسم: ${target?.name || id}`);
  };

  // --- User Actions ---
  const addUser = (userData: Omit<User, 'id' | 'createdDate'>): User => {
    const nextId = `USR-${(users.length + 1).toString().padStart(3, '0')}`;
    const newUser: User = {
      ...userData,
      id: nextId,
      createdDate: new Date().toISOString().slice(0, 10)
    };
    setUsers(prev => [...prev, newUser]);

    // If role is technician, automatically create in technicians table if not present
    if (newUser.role === 'technician') {
      const defaultSpec = specializations[0];
      setTechnicians(prevTechs => {
        if (!prevTechs.some(t => t.username.toLowerCase() === newUser.username.toLowerCase())) {
          const techId = `TECH-${301 + prevTechs.length}`;
          const newTechObj: Technician = {
            id: techId,
            name: newUser.name.replace(/^الفني\s+/, ''),
            specializationId: defaultSpec?.id || 'SPEC-01',
            specializationName: defaultSpec?.name || 'فني صيانة عام',
            phone: newUser.phone,
            email: newUser.email,
            username: newUser.username.toLowerCase(),
            password: newUser.password || '123456',
            departmentId: newUser.departmentId,
            departmentName: newUser.departmentName,
            activeRequestsCount: 0,
            completedRequestsCount: 0
          };
          return [...prevTechs, newTechObj];
        }
        return prevTechs;
      });
    }

    addLog('إضافة مستخدم جديد', 'المستخدمين', `تم إضافة المستخدم: ${newUser.name} بدور ${newUser.role}`);
    return newUser;
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
    setCurrentUser(prev => prev?.id === id ? { ...prev, ...userData } : prev);
    addLog('تعديل بيانات مستخدم', 'المستخدمين', `تم تعديل بيانات أو كلمة مرور المستخدم ${id}`);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addLog('حذف مستخدم', 'المستخدمين', `تم حذف المستخدم ${id}`);
  };

  // --- Role Permissions ---
  const updateRolePermission = (roleId: UserRole, updatedPermission: RolePermission) => {
    setRolePermissions(prev => prev.map(r => r.roleId === roleId ? updatedPermission : r));
    addLog('تحديث مصفوفة الصلاحيات', 'الصلاحيات', `تم تحديث صلاحيات الدور ${roleId}`);
  };

  // --- Assets Actions ---
  const addAsset = (assetData: Omit<Asset, 'id'>): Asset => {
    const nextId = `AST-${1000 + assets.length + 1}`;
    const mType = assetData.machineType?.trim() || inferMachineType(assetData);
    const newAsset: Asset = {
      ...assetData,
      id: nextId,
      code: assetData.code?.trim() || `AST-${(assets.length + 1).toString().padStart(3, '0')}`,
      machineType: mType
    };
    setAssets(prev => [...prev, newAsset]);
    addLog('إضافة أصل جديد', 'إدارة الأصول', `تم إضافة الجهاز/الآلة: ${newAsset.name} كود (${newAsset.code}) - نوع الآلة: (${mType})`);
    return newAsset;
  };

  const updateAsset = (id: string, assetData: Partial<Asset>) => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...assetData };
        if (assetData.machineType !== undefined) {
          updated.machineType = assetData.machineType.trim() || inferMachineType(updated);
        }
        return updated;
      }
      return a;
    }));
    addLog('تعديل أصل', 'إدارة الأصول', `تم تعديل بيانات الأصل ${id}`);
  };

  const deleteAsset = (id: string) => {
    const target = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    addLog('حذف أصل', 'إدارة الأصول', `تم حذف الأصل ${target?.name || id}`);
  };

  const addDeviceType = (name: string, code: string): DeviceType => {
    const newType: DeviceType = {
      id: `TYPE-${(deviceTypes.length + 1).toString().padStart(2, '0')}`,
      name,
      code
    };
    setDeviceTypes(prev => [...prev, newType]);
    addLog('إضافة نوع جهاز جديد', 'إدارة الأصول', `تم إضافة النوع: ${name}`);
    return newType;
  };

  const deleteDeviceType = (id: string) => {
    setDeviceTypes(prev => prev.filter(t => t.id !== id));
    addLog('حذف نوع جهاز', 'إدارة الأصول', `تم حذف نوع الجهاز ${id}`);
  };

  const addFaultType = (name: string, category?: string): FaultType => {
    const newFault: FaultType = {
      id: `FLT-${(faultTypes.length + 1).toString().padStart(2, '0')}`,
      name,
      category: category || name
    };
    setFaultTypes(prev => [...prev, newFault]);
    addLog('إضافة نوع عطل جديد', 'إدارة الأعطال', `تم إضافة نوع العطل: ${name}`);
    return newFault;
  };

  const deleteFaultType = (id: string) => {
    setFaultTypes(prev => prev.filter(f => f.id !== id));
    addLog('حذف نوع عطل', 'إدارة الأعطال', `تم حذف نوع العطل ${id}`);
  };

  const resetFaultTypesToDefault = () => {
    setFaultTypes(initialFaultTypes);
    localStorage.setItem('cmms_faultTypes', JSON.stringify(initialFaultTypes));
    addLog('استعادة أنواع الأعطال الأساسية', 'إدارة الأعطال', 'تم ضبط أنواع الأعطال إلى (ميكانيك، كهرباء، برمجي (IT)، غيرها)');
  };

  // --- Technicians ---
  const addTechnician = (techData: Omit<Technician, 'id' | 'activeRequestsCount' | 'completedRequestsCount'>): Technician => {
    const nextId = `TECH-${301 + technicians.length}`;
    const newTech: Technician = {
      ...techData,
      id: nextId,
      activeRequestsCount: 0,
      completedRequestsCount: 0
    };
    setTechnicians(prev => [...prev, newTech]);

    // Automatically create a corresponding user account in users array
    const newUser: User = {
      id: `USR-${(users.length + 1).toString().padStart(3, '0')}`,
      name: newTech.name.startsWith('الفني') ? newTech.name : `الفني ${newTech.name}`,
      username: newTech.username.toLowerCase(),
      role: 'technician',
      departmentId: newTech.departmentId || 'DEPT-105',
      departmentName: newTech.departmentName || 'قسم إدارة الصيانة والتشغيل',
      phone: newTech.phone,
      email: newTech.email,
      password: newTech.password || '123456',
      createdDate: new Date().toISOString().slice(0, 10)
    };

    setUsers(prev => {
      if (prev.some(u => u.username.toLowerCase() === newUser.username)) {
        return prev;
      }
      return [...prev, newUser];
    });

    addLog('إضافة فني جديد ومستخدم', 'الفنيين والمستخدمين', `تم إضافة الفني: ${newTech.name} وإضافته كمستخدم جديد بدور فني صيانة تلقائياً`);
    return newTech;
  };

  const updateTechnician = (id: string, techData: Partial<Technician>) => {
    setTechnicians(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...techData };
        // Sync matching user account if exists
        setUsers(usersPrev => usersPrev.map(u => {
          if (u.username.toLowerCase() === t.username.toLowerCase() || (updated.username && u.username.toLowerCase() === updated.username.toLowerCase())) {
            return {
              ...u,
              name: updated.name.startsWith('الفني') ? updated.name : `الفني ${updated.name}`,
              username: updated.username,
              email: updated.email || u.email,
              phone: updated.phone || u.phone,
              ...(updated.password ? { password: updated.password } : {})
            };
          }
          return u;
        }));
        return updated;
      }
      return t;
    }));
    addLog('تعديل بيانات فني', 'الفنيين', `تم تعديل بيانات وكلمة مرور الفني ${id}`);
  };

  const deleteTechnician = (id: string) => {
    const tech = technicians.find(t => t.id === id);
    if (tech) {
      setUsers(prev => prev.filter(u => u.username.toLowerCase() !== tech.username.toLowerCase()));
    }
    setTechnicians(prev => prev.filter(t => t.id !== id));
    addLog('حذف فني ومستخدمه', 'الفنيين والمستخدمين', `تم حذف الفني ${id} وحذف حسابه المقترن من قائمة المستخدمين`);
  };

  const addSpecialization = (name: string) => {
    const newSpec: TechnicianSpecialization = {
      id: `SPEC-${(specializations.length + 1).toString().padStart(2, '0')}`,
      name
    };
    setSpecializations(prev => [...prev, newSpec]);
    addLog('إضافة اختصاص فني', 'الفنيين', `تم إضافة الاختصاص: ${name}`);
  };

  // --- Warehouse ---
  const addSparePart = (partData: Omit<SparePart, 'id'>): SparePart => {
    const newPart: SparePart = {
      ...partData,
      id: `SP-${501 + spareParts.length}`
    };
    setSpareParts(prev => [...prev, newPart]);
    addLog('إضافة قطعة غيار جديدة', 'مستودع الصيانة', `تم إضافة قطعة الغيار: ${newPart.name} بكمية ${newPart.quantity}`);
    return newPart;
  };

  const updateSparePart = (id: string, partData: Partial<SparePart>) => {
    setSpareParts(prev => prev.map(p => p.id === id ? { ...p, ...partData } : p));
    addLog('تحديث قطعة غيار', 'مستودع الصيانة', `تم تحديث بيانات قطعة الغيار ${id}`);
  };

  const addStockQuantity = (id: string, qtyToAdd: number) => {
    setSpareParts(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = p.quantity + qtyToAdd;
        return { ...p, quantity: newQty };
      }
      return p;
    }));
    const part = spareParts.find(p => p.id === id);
    addLog('تزويد المخزون', 'مستودع الصيانة', `تم زيادة كمية ${part?.name} بمقدار ${qtyToAdd}`);
  };

  const deleteSparePart = (id: string) => {
    setSpareParts(prev => prev.filter(p => p.id !== id));
    addLog('حذف قطعة غيار', 'مستودع الصيانة', `تم حذف قطعة الغيار ${id}`);
  };

  // --- Suppliers ---
  const addSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
    const newSup: Supplier = {
      ...supplierData,
      id: `SUP-${(suppliers.length + 1).toString().padStart(2, '0')}`
    };
    setSuppliers(prev => [...prev, newSup]);
    addLog('إضافة مورد جديد', 'إدارة الموردين', `تم إضافة المورد: ${newSup.companyName}`);
    return newSup;
  };

  const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplierData } : s));
    addLog('تعديل مورد', 'إدارة الموردين', `تم تعديل بيانات المورد ${id}`);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    addLog('حذف مورد', 'إدارة الموردين', `تم حذف المورد ${id}`);
  };

  // --- Maintenance Requests Workflow ---
  const createRequest = (requestData: {
    assetId: string;
    description: string;
    faultTypeId?: string;
    priority?: PriorityLevel;
    faultOccurrenceDate?: string;
    requesterId?: string;
    requesterName?: string;
    faultTypeIds?: string[];
    faultTypeNames?: string[];
    isRecurring?: boolean;
  }): MaintenanceRequest => {
    const asset = assets.find(a => a.id === requestData.assetId);
    const fault = requestData.faultTypeId ? faultTypes.find(f => f.id === requestData.faultTypeId) : undefined;
    const num = requests.length + 1;
    const reqCode = `REQ-${num.toString().padStart(3, '0')}`;
    const reqId = `REQ-2026-${num.toString().padStart(3, '0')}`;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fullCreationDateTime = `${dateStr} | ${timeStr}`;

    let formattedFaultDate = requestData.faultOccurrenceDate;
    if (formattedFaultDate && formattedFaultDate.includes('T')) {
      const [dPart, tPart] = formattedFaultDate.split('T');
      formattedFaultDate = `${dPart} | ${tPart}`;
    }

    const assignedPriority: PriorityLevel = requestData.priority || 'medium';
    const fNames = requestData.faultTypeNames || (fault ? [fault.name] : []);
    const fIds = requestData.faultTypeIds || (fault ? [fault.id] : (requestData.faultTypeId ? [requestData.faultTypeId] : []));
    const combinedFaultName = fNames.length > 0 
      ? fNames.join(' + ') 
      : (fault?.name || 'بانتظار تحديد مدير الصيانة');

    // Recurring Fault Logic: If true, system matches previous cases and auto-assigns
    let isAutoAssigned = false;
    let autoFaultTypeId = fIds[0] || '';
    let autoFaultTypeName = combinedFaultName;
    let autoFaultTypeIds = fIds;
    let autoFaultTypeNames = fNames;
    let autoTechId: string | undefined = undefined;
    let autoTechName: string | undefined = undefined;
    let autoPriority: PriorityLevel = assignedPriority;
    let autoRecurringNote: string | undefined = undefined;

    if (requestData.isRecurring) {
      // 1. Search prior requests for this specific asset that have technician and diagnosed fault
      const prevAssetReqs = requests.filter(r => 
        r.assetId === requestData.assetId && 
        r.technicianId && 
        (r.faultTypeName || (r.faultTypeIds && r.faultTypeIds.length > 0))
      );

      let matchedPriorReq: MaintenanceRequest | undefined = undefined;

      if (prevAssetReqs.length > 0) {
        matchedPriorReq = prevAssetReqs[0];
      } else {
        // 2. Search other assets in same department or of same machine type
        const prevSameType = requests.filter(r => {
          const oAsset = assets.find(a => a.id === r.assetId);
          return oAsset && 
            (oAsset.typeId === asset?.typeId || oAsset.machineType === asset?.machineType) && 
            r.technicianId;
        });
        if (prevSameType.length > 0) {
          matchedPriorReq = prevSameType[0];
        } else {
          // 3. Fallback to any past request with a technician and diagnosed fault
          matchedPriorReq = requests.find(r => r.technicianId && r.faultTypeName);
        }
      }

      if (matchedPriorReq) {
        const foundTech = technicians.find(t => t.id === matchedPriorReq?.technicianId) || technicians[0];
        if (foundTech) {
          autoTechId = foundTech.id;
          autoTechName = foundTech.name;
        }

        if (matchedPriorReq.faultTypeIds && matchedPriorReq.faultTypeIds.length > 0) {
          autoFaultTypeIds = matchedPriorReq.faultTypeIds;
          autoFaultTypeNames = matchedPriorReq.faultTypeNames || [];
          autoFaultTypeId = autoFaultTypeIds[0];
          autoFaultTypeName = matchedPriorReq.faultTypeName || autoFaultTypeNames.join(' + ');
        } else if (matchedPriorReq.faultTypeId || matchedPriorReq.faultTypeName) {
          autoFaultTypeId = matchedPriorReq.faultTypeId || '';
          autoFaultTypeName = matchedPriorReq.faultTypeName || 'عطل تقني متكرر';
          autoFaultTypeIds = autoFaultTypeId ? [autoFaultTypeId] : [];
          autoFaultTypeNames = [autoFaultTypeName];
        } else if (faultTypes.length > 0) {
          autoFaultTypeId = faultTypes[0].id;
          autoFaultTypeName = faultTypes[0].name;
          autoFaultTypeIds = [autoFaultTypeId];
          autoFaultTypeNames = [autoFaultTypeName];
        }

        autoPriority = matchedPriorReq.priority || 'medium';
        isAutoAssigned = true;
        autoRecurringNote = `عطل متكرر: تم استرجاع تشخيص العطل (${autoFaultTypeName}) وتكليف الفني (${autoTechName}) آلياً بواسطة النظام استناداً إلى سابقة الصيانة رقم (${matchedPriorReq.code}) للأصل، وتم توجيه الطلب للفني مباشرة دون الحاجة لإجراء يدوي من مدير الصيانة.`;
      } else {
        const defaultTech = technicians[0];
        const defaultFault = faultTypes[0];
        autoTechId = defaultTech?.id;
        autoTechName = defaultTech?.name;
        autoFaultTypeId = defaultFault?.id || '';
        autoFaultTypeName = defaultFault?.name || 'عطل ميكانيكي / كهربائي متكرر';
        autoFaultTypeIds = autoFaultTypeId ? [autoFaultTypeId] : [];
        autoFaultTypeNames = [autoFaultTypeName];
        autoPriority = 'medium';
        isAutoAssigned = true;
        autoRecurringNote = `عطل متكرر: قام النظام آلياً بتكليف الفني المختص (${autoTechName}) وتحديد العطل استناداً للحالات السابقة ونقله للفني مباشرة.`;
      }
    }

    const newReq: MaintenanceRequest = {
      id: reqId,
      code: reqCode,
      assetId: requestData.assetId,
      assetName: asset?.name || 'جهاز غير معروف',
      assetCode: asset?.code || 'N/A',
      departmentId: asset?.departmentId || currentUser?.departmentId || 'DEPT-101',
      departmentName: asset?.departmentName || currentUser?.departmentName || 'القسم العام',
      requesterId: requestData.requesterId || currentUser?.id || 'USR-005',
      requesterName: currentUser?.name || requestData.requesterName || 'سامي الخالد (مشرف الإنتاج)',
      status: isAutoAssigned ? 'assigned' : 'new',
      priority: isAutoAssigned ? autoPriority : assignedPriority,
      creationDate: fullCreationDateTime,
      faultOccurrenceDate: formattedFaultDate || fullCreationDateTime,
      description: requestData.description,
      faultTypeId: isAutoAssigned ? autoFaultTypeId : (fIds[0] || ''),
      faultTypeName: isAutoAssigned ? autoFaultTypeName : combinedFaultName,
      faultTypeIds: isAutoAssigned ? autoFaultTypeIds : fIds,
      faultTypeNames: isAutoAssigned ? autoFaultTypeNames : fNames,
      technicianId: isAutoAssigned ? autoTechId : undefined,
      technicianName: isAutoAssigned ? autoTechName : undefined,
      assignedDate: isAutoAssigned ? fullCreationDateTime : undefined,
      isRecurring: !!requestData.isRecurring,
      recurringMatchNote: autoRecurringNote
    };

    setRequests(prev => [newReq, ...prev]);

    // Update technician active workload if auto assigned
    if (isAutoAssigned && autoTechId) {
      setTechnicians(prev => prev.map(t => t.id === autoTechId ? {
        ...t,
        activeRequestsCount: (t.activeRequestsCount || 0) + 1
      } : t));
    }

    // Update asset status to maintenance if critical/high or in maintenance
    if (asset && (newReq.priority === 'critical' || newReq.priority === 'high' || isAutoAssigned)) {
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'maintenance' } : a));
    }

    if (isAutoAssigned) {
      // Informative notification for Maintenance Manager (Passes by without requiring action)
      addNotification({
        title: `🔄 عطل متكرر مُحال آلياً: ${newReq.code}`,
        message: `عطل متكرر للجهاز (${newReq.assetName}). قام النظام آلياً بتشخيص العطل (${newReq.faultTypeName}) وتكليف الفني (${newReq.technicianName}) استناداً لسوابق الصيانة (للاطلاع - لا يتطلب إجراء).`,
        type: 'status_updated',
        targetRole: 'maintenance_manager',
        requestId: newReq.id,
        requestCode: newReq.code
      });

      // Direct assignment notification for the assigned Technician
      addNotification({
        title: `🛠️ مهمة صيانة لعطل متكرر: ${newReq.code}`,
        message: `تم تكليفك آلياً بمهمة صيانة متكررة للجهاز (${newReq.assetName}) في ${newReq.departmentName}. التشخيص: ${newReq.faultTypeName}`,
        type: 'status_updated',
        targetRole: 'technician',
        requestId: newReq.id,
        requestCode: newReq.code
      });

      addLog('إدراج وتكليف طلب متكرر آلياً', 'طلبات الصيانة', `تم إدراج طلب الصيانة المتكرر ${newReq.code} وتكليفه آلياً للفني ${newReq.technicianName} بناءً على سابقة صيانة للأصل`);
    } else {
      // Standard notification for New Requests (Sent to Maintenance Manager for diagnosis and assignment)
      addNotification({
        title: assignedPriority === 'critical' || assignedPriority === 'high' 
          ? `🚨 تنبيه عطل حرج جديد: ${newReq.code}` 
          : `📋 طلب صيانة جديد: ${newReq.code}`,
        message: `تم تقديم طلب صيانة جديد للجهاز (${newReq.assetName}) في ${newReq.departmentName} بواسطة ${newReq.requesterName} (بانتظار تشخيص العطل والأولوية وتكليف الفني)`,
        type: assignedPriority === 'critical' || assignedPriority === 'high' ? 'critical_fault' : 'status_updated',
        targetRole: 'maintenance_manager',
        requestId: newReq.id,
        requestCode: newReq.code
      });

      addLog('إنشاء طلب صيانة جديد', 'طلبات الصيانة', `تم إدراج طلب الصيانة ${newReq.code} للأصل: ${newReq.assetName} (بانتظار مراجعة مدير الصيانة)`);
    }

    return newReq;
  };

  const assignTechnicianToRequest = (
    requestId: string,
    technicianId: string,
    estimatedTimeHours?: number,
    extra?: {
      faultTypeIds?: string[];
      faultTypeNames?: string[];
      faultTypeId?: string;
      faultTypeName?: string;
      priority?: PriorityLevel;
    }
  ) => {
    const tech = technicians.find(t => t.id === technicianId);
    const techUser = users.find(u => u.username.toLowerCase() === tech?.username.toLowerCase() || u.id === technicianId);
    const targetReq = requests.find(r => r.id === requestId);

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'assigned',
          technicianId,
          technicianName: tech?.name || 'فني الصيانة',
          assignedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
          estimatedTimeHours: estimatedTimeHours || r.estimatedTimeHours || 2,
          ...(extra?.priority ? { priority: extra.priority } : {}),
          ...(extra?.faultTypeIds ? { faultTypeIds: extra.faultTypeIds } : {}),
          ...(extra?.faultTypeNames ? { faultTypeNames: extra.faultTypeNames } : {}),
          ...(extra?.faultTypeId !== undefined ? { faultTypeId: extra.faultTypeId } : {}),
          ...(extra?.faultTypeName ? { faultTypeName: extra.faultTypeName } : {})
        };
      }
      return r;
    }));

    // Update tech active requests count
    if (tech) {
      setTechnicians(prev => prev.map(t => t.id === technicianId ? { ...t, activeRequestsCount: t.activeRequestsCount + 1 } : t));
    }

    // Trigger Notification for Technician Assignment
    if (targetReq) {
      const priorityLabelMap: Record<string, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', critical: 'حرجة جداً' };
      const priorityStr = priorityLabelMap[extra?.priority || targetReq.priority] || targetReq.priority;

      // Notification for Technician
      addNotification({
        title: `🛠️ إسناد طلب صيانة جديد: ${targetReq.code}`,
        message: `تم تكليفك بصيانة الجهاز (${targetReq.assetName}) في ${targetReq.departmentName} - الأولوية: ${priorityStr}`,
        type: 'request_assigned',
        targetRole: 'technician',
        targetUserId: techUser?.id || tech?.id || technicianId,
        requestId: targetReq.id,
        requestCode: targetReq.code
      });

      // Notification for Admin / System Manager
      addNotification({
        title: `🛠️ تم تكليف فني بالصيانة: ${targetReq.code}`,
        message: `تم تكليف الفني: ${tech?.name || 'فني الصيانة'} بصيانة الجهاز (${targetReq.assetName}) في ${targetReq.departmentName} - الأولوية: ${priorityStr}`,
        type: 'request_assigned',
        targetRole: 'admin',
        requestId: targetReq.id,
        requestCode: targetReq.code
      });

      // Notification for Maintenance Manager
      addNotification({
        title: `🛠️ تم تكليف فني بالصيانة: ${targetReq.code}`,
        message: `تم تكليف الفني: ${tech?.name || 'فني الصيانة'} بصيانة الجهاز (${targetReq.assetName}) في ${targetReq.departmentName} - الأولوية: ${priorityStr}`,
        type: 'request_assigned',
        targetRole: 'maintenance_manager',
        requestId: targetReq.id,
        requestCode: targetReq.code
      });
    }

    addLog('تعيين فني للطلب', 'طلبات الصيانة', `تم تكليف الفني ${tech?.name} بطلب الصيانة ${requestId}`);
  };

  const updateRequestFaultAndPriority = (
    requestId: string,
    data: {
      faultTypeIds?: string[];
      faultTypeNames?: string[];
      faultTypeId?: string;
      faultTypeName?: string;
      priority?: PriorityLevel;
    }
  ) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          ...(data.priority ? { priority: data.priority } : {}),
          ...(data.faultTypeIds ? { faultTypeIds: data.faultTypeIds } : {}),
          ...(data.faultTypeNames ? { faultTypeNames: data.faultTypeNames } : {}),
          ...(data.faultTypeId !== undefined ? { faultTypeId: data.faultTypeId } : {}),
          ...(data.faultTypeName ? { faultTypeName: data.faultTypeName } : {})
        };
      }
      return r;
    }));
    addLog('تحديث تصنيف العطل والأولوية', 'إدارة الصيانة', `تم تحديث تشخيص العطل والأولوية للطلب ${requestId}`);
  };

  const updateRequestWorkflow = (requestId: string, payload: {
    status: RequestStatus;
    technicalReport?: string;
    photos?: string[];
    usedSpareParts?: UsedSparePart[];
    partsCurrency?: '$' | 'ل.س' | string;
    maintenanceType?: 'internal' | 'external';
    externalWorkshopName?: string;
    externalLaborCost?: number;
    externalPartsCost?: number;
    externalSpareParts?: ExternalSparePart[];
    externalTotalCost?: number;
    requiresExternalWorkshop?: boolean;
    externalWorkshopNotes?: string;
    externalWorkshopCost?: number;
  }) => {
    const targetReq = requests.find(r => r.id === requestId);

    // Document used spare parts for maintenance record and logs (manual entry without warehouse dependency)
    if (payload.usedSpareParts && payload.usedSpareParts.length > 0) {
      const partsSummary = payload.usedSpareParts.map(p => `${p.partName} (${p.quantity}) [${p.unitPrice} ${p.currency || '$'}]`).join('، ');
      addLog('توثيق قطع غيار صيانة', 'سجل صيانة الآلة', `تم تسجيل قطع غيار يدوياً لطلب ${targetReq?.code || requestId}: ${partsSummary} وتوثيقها بسجل صيانة الآلة`);
    }

    // Update target asset's cumulative maintenance cost & spare parts cost
    if (targetReq?.assetId && payload.usedSpareParts && payload.usedSpareParts.length > 0) {
      const addedPartsCost = payload.usedSpareParts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
      setAssets(prev => prev.map(a => {
        if (a.id === targetReq.assetId || a.code === targetReq.assetCode) {
          const prevMaintCost = a.maintenanceCost || 0;
          const prevPartsCost = a.totalPartsCost || 0;
          return {
            ...a,
            maintenanceCost: prevMaintCost + addedPartsCost,
            totalPartsCost: prevPartsCost + addedPartsCost
          };
        }
        return a;
      }));
    }

    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fullDateTimeStr = `${dateStr} | ${timeStr}`;

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const updatedParts = payload.usedSpareParts !== undefined ? payload.usedSpareParts : r.usedSpareParts;
        const calcPartsCost = updatedParts ? updatedParts.reduce((s, p) => s + (p.unitPrice * p.quantity), 0) : r.totalPartsCost;

        return {
          ...r,
          status: payload.status,
          technicalReport: payload.technicalReport !== undefined ? payload.technicalReport : r.technicalReport,
          photos: payload.photos ? [...(r.photos || []), ...payload.photos] : r.photos,
          usedSpareParts: updatedParts,
          partsCurrency: payload.partsCurrency !== undefined ? payload.partsCurrency : r.partsCurrency,
          totalPartsCost: calcPartsCost,
          maintenanceType: payload.maintenanceType !== undefined ? payload.maintenanceType : r.maintenanceType,
          externalWorkshopName: payload.externalWorkshopName !== undefined ? payload.externalWorkshopName : r.externalWorkshopName,
          externalLaborCost: payload.externalLaborCost !== undefined ? payload.externalLaborCost : r.externalLaborCost,
          externalPartsCost: payload.externalPartsCost !== undefined ? payload.externalPartsCost : r.externalPartsCost,
          externalSpareParts: payload.externalSpareParts !== undefined ? payload.externalSpareParts : r.externalSpareParts,
          externalTotalCost: payload.externalTotalCost !== undefined ? payload.externalTotalCost : r.externalTotalCost,
          requiresExternalWorkshop: payload.requiresExternalWorkshop !== undefined ? payload.requiresExternalWorkshop : (payload.maintenanceType === 'external' ? true : r.requiresExternalWorkshop),
          externalWorkshopNotes: payload.externalWorkshopNotes !== undefined ? payload.externalWorkshopNotes : r.externalWorkshopNotes,
          externalWorkshopCost: payload.externalWorkshopCost !== undefined ? payload.externalWorkshopCost : r.externalWorkshopCost,
          executionDate: r.executionDate || dateStr,
          executionTime: r.executionTime || timeStr,
          executionDateTime: r.executionDateTime || fullDateTimeStr
        };
      }
      return r;
    }));

    // Trigger Notification on Status Update
    if (targetReq) {
      if (payload.status === 'external_pending_maint_mgr') {
        addNotification({
          title: `🏭 طلب صيانة ورشة خارجية جديد: ${targetReq.code}`,
          message: `طلب الفني (${targetReq.technicianName || 'الفني'}) تحويل الجهاز (${targetReq.assetName}) لورشة خارجية، بانتظار مراجعتك ورفع الطلب للمدير العام.`,
          type: 'status_updated',
          targetRole: 'maintenance_manager',
          requestId: targetReq.id,
          requestCode: targetReq.code
        });
      } else if (payload.status === 'external_pending_gm') {
        addNotification({
          title: `🏛️ طلب اعتماد ورشة خارجية للمدير العام: ${targetReq.code}`,
          message: `رفع مدير الصيانة طلب صيانة الورشة الخارجية للجهاز (${targetReq.assetName}) بانتظار موافقة واعتماد المدير العام (أ. محمد زغموت).`,
          type: 'status_updated',
          targetRole: 'external_approver',
          requestId: targetReq.id,
          requestCode: targetReq.code
        });
      } else if (payload.status === 'external_approved_by_gm') {
        addNotification({
          title: `✅ تمت موافقة المدير العام على الورشة الخارجية: ${targetReq.code}`,
          message: `اعتمد المدير العام طلب الصيانة الخارجية للجهاز (${targetReq.assetName})، يرجى توجيه الفني للتنفيذ.`,
          type: 'status_updated',
          targetRole: 'maintenance_manager',
          requestId: targetReq.id,
          requestCode: targetReq.code
        });
      } else if (payload.status === 'external_in_execution') {
        addNotification({
          title: `🔧 توجيه تنفيذ الورشة الخارجية: ${targetReq.code}`,
          message: `تم توجيه طلب الورشة الخارجية للجهاز (${targetReq.assetName}) للفني للتنفيذ وإدخال التكاليف وقطع غيار الورشة.`,
          type: 'status_updated',
          targetRole: 'technician',
          targetUserId: targetReq.technicianId,
          requestId: targetReq.id,
          requestCode: targetReq.code
        });
      } else if (payload.status === 'pending_approval') {
        addNotification({
          title: `📝 تم إنجاز الصيانة وبانتظار توقيع مدير الصيانة: ${targetReq.code}`,
          message: `أتم الفني (${targetReq.technicianName || 'الفني'}) إصلاح عطل الجهاز (${targetReq.assetName}) وبانتظار مراجعتك والتوقيع على الطلب بعد الإصلاح.`,
          type: 'status_updated',
          targetRole: 'maintenance_manager',
          requestId: targetReq.id,
          requestCode: targetReq.code
        });
      } else if (payload.status === 'pending_closure') {
        addNotification({
          title: `✍️ تم توقيع الطلب من مدير الصيانة وبانتظار إغلاقك: ${targetReq.code}`,
          message: `تمت مراجعة وتوقيع إصلاح الجهاز (${targetReq.assetName}) من قبل مدير الصيانة، يرجى تجربة الجهاز وإغلاق الطلب وتأكيد الاستلام.`,
          type: 'status_updated',
          targetRole: 'employee',
          targetUserId: targetReq.requesterId,
          requestId: targetReq.id,
          requestCode: targetReq.code
        });
      } else {
        const statusLabels: Record<string, string> = {
          new: 'جديد',
          assigned: 'تم التكليف',
          in_progress: 'قيد التنفيذ والعمل',
          external_pending_maint_mgr: 'طلب ورشة خارجية بانتظار مدير الصيانة',
          external_pending_gm: 'طلب ورشة خارجية بانتظار المدير العام',
          external_approved_by_gm: 'معتمد من المدير العام - بانتظار التوجيه',
          external_in_execution: 'قيد التنفيذ بالورشة الخارجية',
          pending_approval: 'بانتظار توقيع مدير الصيانة بعد الإصلاح',
          pending_closure: 'بانتظار إغلاق طالب الصيانة',
          closed: 'مغلق ومكتمل بنجاح (بواسطة طالب الصيانة)',
          received: 'مستلم من طالب الصيانة',
          cancelled: 'ملغى'
        };
        addNotification({
          title: `🔔 تحديث حالة طلبك: ${targetReq.code}`,
          message: `تغيرت حالة طلب الصيانة للجهاز (${targetReq.assetName}) إلى: "${statusLabels[payload.status] || payload.status}"`,
          type: 'status_updated',
          targetRole: 'employee',
          targetUserId: targetReq.requesterId,
          requestId: targetReq.id,
          requestCode: targetReq.code
        });
      }
    }

    addLog('تحديث حالة طلب صيانة', 'طلبات الصيانة', `تم تغيير حالة الطلب ${targetReq?.code || requestId} إلى ${payload.status}`);
  };

  const approveExternalWorkshop = (requestId: string, status: 'approved' | 'rejected', notes?: string, cost?: number) => {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fullDateTimeStr = `${dateStr} | ${timeStr}`;

    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: status === 'approved' ? 'external_approved_by_gm' : 'in_progress',
        requiresExternalWorkshop: status === 'approved',
        maintenanceType: status === 'approved' ? 'external' : 'internal',
        externalWorkshopStatus: status,
        externalWorkshopApprovedBy: currentUser?.name || 'الأستاذ محمد زغموت',
        externalWorkshopApprovalDate: fullDateTimeStr,
        externalWorkshopNotes: notes !== undefined ? notes : r.externalWorkshopNotes,
        externalWorkshopCost: cost !== undefined ? cost : r.externalWorkshopCost
      };
    }));

    const targetReq = requests.find(r => r.id === requestId);
    const code = targetReq?.code || requestId;
    const actionName = status === 'approved' ? 'اعتماد صيانة ورشة خارجية' : 'رفض صيانة ورشة خارجية';
    const statusTextAr = status === 'approved' ? 'تمت الموافقة على تحويل الطلب إلى ورشة خارجية' : 'تم رفض تحويل الطلب إلى ورشة خارجية';

    addLog(actionName, 'طلبات الصيانة', `${statusTextAr} للطلب ${code}`);
    addNotification({
      title: `${actionName}: ${code}`,
      message: `${statusTextAr} بواسطة ${currentUser?.name || 'الأستاذ محمد زغموت'}`,
      type: 'status_updated',
      targetRole: 'maintenance_manager',
      requestId: requestId,
      requestCode: code
    });
  };

  // Maintenance Manager views the request after repair and signs off
  const signAndApproveByManager = (requestId: string, notes?: string, signature?: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const signerName = currentUser?.name || 'م. أحمد النجار (مدير الصيانة)';

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'pending_closure',
          managerSigned: true,
          managerSignedBy: signerName,
          managerSignedDate: now,
          managerNotes: notes !== undefined ? notes : (r.managerNotes || 'تمت معاينة ومراجعة نتائج الإصلاح الفني والتوقيع بالاعتماد'),
          managerSignature: signature || `${signerName} - اعتماد إلكتروني معتمد`
        };
      }
      return r;
    }));

    if (targetReq) {
      addNotification({
        title: `✍️ تم توقيع واعتماد الصيانة من مدير الصيانة: ${targetReq.code}`,
        message: `قام مدير الصيانة (${signerName}) بمراجعة الإصلاح والتوقيع عليه للطلب (${targetReq.code}). يرجى من طالب الصيانة (${targetReq.requesterName}) تجربة الجهاز وإغلاق الطلب وتأكيد الاستلام.`,
        type: 'status_updated',
        targetRole: 'employee',
        targetUserId: targetReq.requesterId,
        requestId: targetReq.id,
        requestCode: targetReq.code
      });
    }

    addLog('توقيع واعتماد مدير الصيانة', 'طلبات الصيانة', `تمت مراجعة نتائج الإصلاح والتوقيع عليها للطلب ${targetReq?.code || requestId} وإحالته لطالب الصيانة للإغلاق`);
  };

  // Maintenance Requester closes the maintenance request
  const closeRequestByRequester = (requestId: string, rating?: number, feedback?: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const requesterName = currentUser?.name || targetReq?.requesterName || 'طالب الصيانة';

    // Calculate approximate repair time in hours
    let repairHours = 2.5;
    if (targetReq?.creationDate) {
      const created = new Date(targetReq.creationDate).getTime();
      const closed = new Date().getTime();
      const diffMs = closed - created;
      repairHours = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
    }

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'closed',
          closureDate: now,
          receivedDate: now,
          closedByRequester: true,
          closedByRequesterName: requesterName,
          rating: rating !== undefined ? rating : r.rating,
          ratingFeedback: feedback !== undefined ? feedback : r.ratingFeedback,
          repairTimeHours: repairHours
        };
      }
      return r;
    }));

    // Reset asset status to working and synchronize total maintenance and parts costs into machine's asset profile
    if (targetReq?.assetId) {
      setAssets(prev => prev.map(a => {
        if (a.id === targetReq.assetId || a.code === targetReq.assetCode) {
          const allAssetReqs = requests.map(r => r.id === requestId ? { ...r, status: 'closed' as RequestStatus } : r)
            .filter(r => r.assetId === a.id || r.assetCode === a.code);
          const totalSpareParts = allAssetReqs.reduce((sum, r) => {
            const pCost = (r.usedSpareParts || []).reduce((s, p) => s + (p.unitPrice * p.quantity), 0);
            return sum + pCost;
          }, 0);
          const totalExtCost = allAssetReqs.reduce((sum, r) => {
            const ext = r.externalTotalCost || ((r.externalLaborCost || 0) + (r.externalPartsCost || 0));
            return sum + ext;
          }, 0);
          return {
            ...a,
            status: 'working',
            totalPartsCost: totalSpareParts,
            maintenanceCost: totalSpareParts + totalExtCost
          };
        }
        return a;
      }));
    }

    // Update technician completed count
    if (targetReq?.technicianId) {
      setTechnicians(prev => prev.map(t => {
        if (t.id === targetReq.technicianId) {
          return {
            ...t,
            activeRequestsCount: Math.max(0, t.activeRequestsCount - 1),
            completedRequestsCount: t.completedRequestsCount + 1
          };
        }
        return t;
      }));
    }

    // Trigger Notification for Manager & Technician on Closure by Requester
    if (targetReq) {
      addNotification({
        title: `✅ تم إغلاق طلب الصيانة بواسطة طالب الصيانة: ${targetReq.code}`,
        message: `قام طالب الصيانة (${requesterName}) بإغلاق الطلب وتأكيد استلام وتجربة الجهاز (${targetReq.assetName}) بنجاح${rating ? ` وتقييم الخدمة بـ ${rating} نجوم` : ''}.`,
        type: 'status_updated',
        targetRole: 'maintenance_manager',
        requestId: targetReq.id,
        requestCode: targetReq.code
      });
    }

    addLog('إغلاق طلب الصيانة', 'طلبات الصيانة', `قام طالب الصيانة (${requesterName}) بإغلاق الطلب ${targetReq?.code || requestId} وتأكيد استلام الآلة المصلحة`);
  };

  const approveRequestClosure = (requestId: string) => {
    closeRequestByRequester(requestId);
  };

  const rateRequestService = (requestId: string, rating: number, feedback: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, rating, ratingFeedback: feedback };
      }
      return r;
    }));

    if (targetReq) {
      const starsStr = '⭐'.repeat(rating);
      addNotification({
        title: `⭐ تقييم جديد لخدمة الصيانة: ${targetReq.code}`,
        message: `قام طالب الصيانة (${targetReq.requesterName}) بتقديم تقييم للطلب (${targetReq.code}) بمعدل ${starsStr} (${rating}/5)${feedback ? ` - الملاحظات: "${feedback}"` : ''}`,
        type: 'status_updated',
        targetRole: 'maintenance_manager',
        requestId: targetReq.id,
        requestCode: targetReq.code
      });
    }

    addLog('تقييم خدمة الصيانة', 'طلبات الصيانة', `تم تقييم الخدمة للطلب ${requestId} بـ ${rating} نجوم`);
  };

  const markRequestAsReceived = (requestId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'received',
          receivedDate: nowStr
        };
      }
      return r;
    }));

    if (targetReq) {
      addNotification({
        title: `📦 تم استلام الجهاز من قبل طالب الصيانة: ${targetReq.code}`,
        message: `قام طالب الصيانة (${targetReq.requesterName}) بتأكيد استلام الجهاز (${targetReq.assetName}) وتعديل الحالة إلى "مستلم".`,
        type: 'status_updated',
        targetRole: 'maintenance_manager',
        requestId: targetReq.id,
        requestCode: targetReq.code
      });
    }

    addLog('تأكيد استلام الطلب', 'طلبات الصيانة', `تم تغيير حالة الطلب ${targetReq?.code || requestId} إلى "مستلم" بواسطة طالب الصيانة`);
  };

  const cancelRequest = (requestId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'cancelled' } : r));

    if (targetReq) {
      addNotification({
        title: `❌ تم إلغاء طلب الصيانة: ${targetReq.code}`,
        message: `تم إلغاء طلب الصيانة الخاص بالجهاز (${targetReq.assetName}).`,
        type: 'status_updated',
        targetRole: 'employee',
        targetUserId: targetReq.requesterId,
        requestId: targetReq.id,
        requestCode: targetReq.code
      });
    }

    addLog('إلغاء طلب صيانة', 'طلبات الصيانة', `تم إلغاء طلب الصيانة ${requestId}`);
  };

  const deleteRequest = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    addLog('حذف طلب صيانة', 'طلبات الصيانة', `تم حذف طلب الصيانة ${requestId}`);
  };

  // --- Settings & Backup ---
  const updateSettings = (settingsData: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...settingsData }));
    addLog('تحديث إعدادات النظام', 'الإعدادات', 'تم تعديل الإعدادات العامة للنظام');
  };

  const exportBackupJSON = (): string => {
    const fullBackup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      departments,
      deviceTypes,
      faultTypes,
      users,
      specializations,
      technicians,
      assets,
      spareParts,
      suppliers,
      requests,
      rolePermissions,
      operationLogs,
      systemSettings
    };
    addLog('تصدير نسخة احتياطية', 'النسخ الاحتياطي', 'تم تصدير ملف النسخة الاحتياطية JSON');
    return JSON.stringify(fullBackup, null, 2);
  };

  const restoreFromBackup = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.departments) setDepartments(data.departments);
      if (data.deviceTypes) setDeviceTypes(data.deviceTypes);
      if (data.faultTypes) setFaultTypes(data.faultTypes);
      if (data.users) setUsers(data.users);
      if (data.specializations) setSpecializations(data.specializations);
      if (data.technicians) setTechnicians(data.technicians);
      if (data.assets) setAssets(data.assets);
      if (data.spareParts) setSpareParts(data.spareParts);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.requests) setRequests(data.requests);
      if (data.rolePermissions) setRolePermissions(data.rolePermissions);
      if (data.operationLogs) setOperationLogs(data.operationLogs);
      if (data.systemSettings) setSystemSettings(data.systemSettings);

      addLog('استعادة نسخة احتياطية', 'النسخ الاحتياطي', 'تم استعادة النظام بنجاح من ملف النسخة الاحتياطية');
      return true;
    } catch (e) {
      console.error('Backup restore failed:', e);
      return false;
    }
  };

  const resetDemoData = () => {
    setDepartments(initialDepartments);
    setDeviceTypes(initialDeviceTypes);
    setFaultTypes(initialFaultTypes);
    setUsers(initialUsers);
    setSpecializations(initialSpecializations);
    setTechnicians(initialTechnicians);
    setAssets(initialAssets);
    setSpareParts(initialSpareParts);
    setSuppliers(initialSuppliers);
    setRequests(initialMaintenanceRequests);
    setRolePermissions(initialRolePermissions);
    setOperationLogs(initialOperationLogs);
    setSystemSettings(initialSystemSettings);
    addLog('إعادة ضبط البيانات الافتراضية', 'النسخ الاحتياطي', 'تمت إعادة ضبط كافة بيانات التطبيق');
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        isAuthenticated,
        setIsAuthenticated,
        currentUser,
        setCurrentUser,
        activeView,
        setActiveView,
        subView,
        setSubView,

        departments,
        deviceTypes,
        faultTypes,
        users,
        specializations,
        technicians,
        assets,
        spareParts,
        suppliers,
        requests,
        rolePermissions,
        operationLogs,
        systemSettings,

        addDepartment,
        updateDepartment,
        deleteDepartment,

        addUser,
        updateUser,
        deleteUser,

        updateRolePermission,

        addAsset,
        updateAsset,
        deleteAsset,
        addDeviceType,
        deleteDeviceType,
        addFaultType,
        deleteFaultType,
        resetFaultTypesToDefault,

        addTechnician,
        updateTechnician,
        deleteTechnician,
        addSpecialization,

        addSparePart,
        updateSparePart,
        addStockQuantity,
        deleteSparePart,

        addSupplier,
        updateSupplier,
        deleteSupplier,

        createRequest,
        assignTechnicianToRequest,
        updateRequestFaultAndPriority,
        updateRequestWorkflow,
        approveExternalWorkshop,
        signAndApproveByManager,
        closeRequestByRequester,
        approveRequestClosure,
        rateRequestService,
        markRequestAsReceived,
        cancelRequest,
        deleteRequest,

        updateSettings,
        updateSystemSettings: updateSettings,
        restoreFromBackup,
        exportBackupJSON,
        resetDemoData,

        lowStockAlerts,
        addLog,

        notifications,
        userNotifications,
        unreadNotificationsCount,
        toastNotification,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        clearToastNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

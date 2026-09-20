export type UserRole = 'admin' | 'maintenance_manager' | 'technician' | 'employee' | 'external_approver';

export interface Department {
  id: string;
  name: string;
  managerName?: string;
  createdDate: string;
  userCount?: number;
  assetCount?: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  phone: string;
  email?: string;
  password?: string;
  createdDate: string;
}

export interface PermissionCapabilities {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  assignTech?: boolean;
  approveClosure?: boolean;
}

export interface RolePermission {
  roleId: UserRole;
  roleName: string;
  description: string;
  modules: {
    departments: PermissionCapabilities;
    users: PermissionCapabilities;
    assets: PermissionCapabilities;
    requests: PermissionCapabilities;
    technicians: PermissionCapabilities;
    reports: PermissionCapabilities;
    backup: PermissionCapabilities;
    settings: PermissionCapabilities;
  };
}

export interface DeviceType {
  id: string;
  name: string;
  code: string;
}

export interface FaultType {
  id: string;
  name: string;
  category?: string; // Optional: e.g. 'ميكانيك', 'كهرباء', 'برمجي (IT)', 'غيرها'
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Asset {
  id: string;
  seqNumber?: number;
  code: string;
  name: string;
  model: string;
  manufacturer: string;
  typeId: string;
  typeName: string;
  machineType?: string; // نوع الآلة (مثل: حقن، بودرة، حب، شراب، مراهم، تغليف، إلخ)
  location: string;
  departmentId: string;
  departmentName: string;
  purchaseDate: string;
  purchasePrice?: number;
  maintenanceCost?: number;
  totalPartsCost?: number;
  status: 'working' | 'maintenance' | 'broken' | 'needs_inspection';
}

export interface TechnicianSpecialization {
  id: string;
  name: string;
}

export interface Technician {
  id: string;
  name: string;
  specializationId: string;
  specializationName: string;
  phone: string;
  email?: string;
  username: string;
  password?: string;
  departmentId: string;
  departmentName: string;
  activeRequestsCount: number;
  completedRequestsCount: number;
}

export interface SparePart {
  id: string;
  name: string;
  code: string;
  quantity: number;
  location: string;
  purchasePrice: number;
  minThreshold: number;
}

export interface UsedSparePart {
  partId: string;
  partName: string;
  partCode?: string;
  quantity: number;
  unitPrice: number;
  currency?: '$' | 'ل.س' | string;
}

export interface ExternalSparePart {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Supplier {
  id: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
}

export type RequestStatus = 
  | 'new' 
  | 'assigned' 
  | 'in_progress' 
  | 'external_pending_maint_mgr'
  | 'external_pending_gm'
  | 'external_approved_by_gm'
  | 'external_in_execution'
  | 'pending_approval' 
  | 'pending_closure'
  | 'closed' 
  | 'received' 
  | 'cancelled';

export interface MaintenanceRequest {
  id: string;
  code: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  departmentId: string;
  departmentName: string;
  requesterId: string;
  requesterName: string;
  status: RequestStatus;
  priority: PriorityLevel;
  creationDate: string;
  faultOccurrenceDate?: string;
  executionDate?: string;
  executionTime?: string;
  executionDateTime?: string;
  description: string;
  faultTypeId?: string;
  faultTypeName?: string;
  faultTypeIds?: string[];
  faultTypeNames?: string[];
  technicianId?: string;
  technicianName?: string;
  assignedDate?: string;
  technicalReport?: string;
  photos?: string[];
  usedSpareParts?: UsedSparePart[];
  partsCurrency?: '$' | 'ل.س' | string;
  totalPartsCost?: number;
  maintenanceType?: 'internal' | 'external';
  externalWorkshopName?: string;
  externalLaborCost?: number;
  externalPartsCost?: number;
  externalSpareParts?: ExternalSparePart[];
  externalTotalCost?: number;
  externalInvoicePhoto?: string;
  estimatedTimeHours?: number;
  estimatedRepairHours?: number;
  repairTimeHours?: number;
  actualRepairHours?: number;
  completionDate?: string;
  closureDate?: string;
  receivedDate?: string;
  rating?: number;
  ratingFeedback?: string;
  managerSigned?: boolean;
  managerSignedBy?: string;
  managerSignedDate?: string;
  managerSignature?: string;
  managerNotes?: string;
  closedByRequester?: boolean;
  closedByRequesterName?: string;
  requiresExternalWorkshop?: boolean;
  externalWorkshopStatus?: 'pending' | 'approved' | 'rejected';
  externalWorkshopCost?: number;
  externalWorkshopReason?: string;
  externalWorkshopNotes?: string;
  externalWorkshopApprovedBy?: string;
  externalWorkshopApprovalDate?: string;
  isRecurring?: boolean;
  recurringMatchNote?: string;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
}

export interface SystemSettings {
  companyName: string;
  logoUrl?: string;
  themeColor: 'blue' | 'teal' | 'indigo' | 'emerald' | 'amber';
  language: 'ar' | 'en';
  timezone: string;
  dateFormat: string;
  pageSize: number;
  currency?: string;
  adminEmail?: string;
  enableEmailNotifications?: boolean;
  autoBackupIntervalDays?: number;
}

export type NotificationType = 'critical_fault' | 'request_assigned' | 'status_updated' | 'general';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  targetRole?: UserRole;
  targetUserId?: string;
  requestId?: string;
  requestCode?: string;
  read: boolean;
}

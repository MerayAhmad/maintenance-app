import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Box,
  Wrench,
  ClipboardList,
  History,
  DatabaseBackup,
  BarChart3,
  Settings,
  ChevronDown,
  User,
  LogOut
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[]; // If specified, allowed roles
  subItems?: { id: string; label: string }[];
}

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    subView,
    setSubView,
    activeRole,
    setIsAuthenticated,
    systemSettings
  } = useApp();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    departments: true,
    users: true,
    assets: true,
    technicians: true,
    requests: true
  });

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم والمؤشرات',
      icon: LayoutDashboard,
      roles: ['admin', 'maintenance_manager', 'technician', 'employee', 'external_approver']
    },
    {
      id: 'departments',
      label: 'أقسام الشركة',
      icon: Building2,
      roles: ['admin', 'maintenance_manager'],
      subItems: [
        { id: 'add', label: 'إضافة قسم جديد' },
        { id: 'view', label: 'قائمة الأقسام' }
      ]
    },
    {
      id: 'users',
      label: 'المستخدمين',
      icon: Users,
      roles: ['admin'],
      subItems: [
        { id: 'add', label: 'إضافة مستخدم جديد' },
        { id: 'view', label: 'دليل المستخدمين' }
      ]
    },
    {
      id: 'roles',
      label: 'الأدوار والصلاحيات (RBAC)',
      icon: ShieldCheck,
      roles: ['admin']
    },
    {
      id: 'assets',
      label: 'إدارة الأصول والآلات',
      icon: Box,
      roles: ['admin', 'maintenance_manager', 'technician', 'employee', 'external_approver'],
      subItems: [
        { id: 'view', label: 'عرض جميع الآلات والأصول' },
        ...(activeRole === 'admin' || activeRole === 'maintenance_manager'
          ? [
              { id: 'add', label: 'تسجيل آلة/أصل جديد' },
              { id: 'types', label: 'تصنيفات الأجهزة' },
              { id: 'faults', label: 'أنواع الأعطال' }
            ]
          : [])
      ]
    },
    {
      id: 'technicians',
      label: 'فنيي الصيانة',
      icon: Wrench,
      roles: ['admin', 'maintenance_manager'],
      subItems: [
        { id: 'view', label: 'دليل الفنيين' },
        { id: 'add', label: 'إضافة فني جديد' },
        { id: 'specializations', label: 'اختصاصات الفنيين' }
      ]
    },
    {
      id: 'requests',
      label: 'طلبات وأوامر الصيانة',
      icon: ClipboardList,
      roles: ['admin', 'maintenance_manager', 'technician', 'employee', 'external_approver'],
      subItems: [
        { id: 'create', label: 'تقديم طلب صيانة جديدة' },
        { id: 'view', label: 'جدول متابعة جميع الطلبات' }
      ]
    },
    {
      id: 'machine_history',
      label: 'سجل الآلات والتبدلات',
      icon: History,
      roles: ['admin', 'maintenance_manager', 'external_approver']
    },
    {
      id: 'reports',
      label: 'التقارير والإحصائيات',
      icon: BarChart3,
      roles: ['admin', 'maintenance_manager', 'external_approver']
    },
    {
      id: 'backup',
      label: 'النسخ الاحتياطي',
      icon: DatabaseBackup,
      roles: ['admin']
    },
    {
      id: 'settings',
      label: 'إعدادات النظام',
      icon: Settings,
      roles: ['admin', 'maintenance_manager']
    }
  ];

  // Filter menu items allowed for active role
  const allowedMenuItems = allMenuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(activeRole);
  });

  const roleLabels: Record<UserRole, string> = {
    admin: 'مدير النظام (Full Admin)',
    maintenance_manager: 'واجهة مدير الصيانة',
    technician: 'واجهة فني الصيانة',
    employee: 'واجهة طالب الصيانة',
    external_approver: 'واجهة اعتماد الورشة الخارجية'
  };

  return (
    <aside className="w-64 sm:w-70 bg-white text-slate-800 border-l border-slate-200/90 min-h-[calc(100vh-4rem)] flex flex-col shrink-0 no-print dir-rtl shadow-xs">
      
      {/* Sidebar Top Profile Badge */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-blue-50/40 to-white space-y-1.5">
        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg inline-block">
          {roleLabels[activeRole]}
        </span>
        <h2 className="text-base font-black text-slate-900 truncate">
          شركة أكبيطرة
        </h2>
        <p className="text-xs text-slate-500 truncate font-semibold">
          نظام الصيانة والتشغيل CMMS
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = openMenus[item.id];

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  setActiveView(item.id);
                  if (hasSubItems) {
                    toggleMenu(item.id);
                    if (!subView && item.subItems) {
                      setSubView(item.subItems[0].id);
                    }
                  } else {
                    setSubView(null);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-[15px] font-bold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#1746c8] to-[#1d4ed8] text-white shadow-sm font-extrabold'
                    : 'text-slate-700 hover:bg-blue-50/70 hover:text-blue-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {hasSubItems && (
                  <ChevronDown
                    className={`w-4 h-4 opacity-70 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Submenu List */}
              {hasSubItems && isOpen && (
                <div className="pr-4 pl-2 py-1.5 space-y-1.5 my-1 border-r-2 border-blue-600 mr-2.5">
                  {item.subItems?.map((sub) => {
                    const isSubActive = isActive && (subView === sub.id || (!subView && sub.id === item.subItems![0].id));
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveView(item.id);
                          setSubView(sub.id);
                        }}
                        className={`w-full text-right px-3 py-2 text-xs sm:text-[13px] font-bold rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer ${
                          isSubActive
                            ? 'text-blue-700 bg-blue-50/90 font-extrabold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSubActive ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span className="text-xs font-mono font-bold text-slate-600">AKBITRA CMMS</span>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج</span>
        </button>
      </div>

    </aside>
  );
};

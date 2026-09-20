import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Wrench,
  Bell,
  User,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Building2,
  CheckCircle2,
  LogOut,
  UserCheck,
  Check,
  Trash2,
  ExternalLink,
  Clock
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeRole,
    setActiveRole,
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    systemSettings,
    requests,
    activeView,
    setActiveView,
    setSubView,
    users,
    userNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications
  } = useApp();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const criticalRequests = requests.filter(r => r.priority === 'critical' && r.status !== 'closed' && r.status !== 'cancelled');
  const totalAlertsBadge = unreadNotificationsCount;

  const filteredNotifications = userNotifications.filter(n => {
    if (notifFilter === 'unread') return !n.read;
    return true;
  });

  const roleUserProfiles: Record<UserRole, { name: string; title: string; badgeBg: string }> = {
    admin: {
      name: 'المهندس أحمد العلي',
      title: 'مدير النظام',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    maintenance_manager: {
      name: 'المهندس خليل السعيد',
      title: 'مدير الصيانة',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    technician: {
      name: 'الفني محمود الخطيب',
      title: 'فني الصيانة',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    employee: {
      name: 'سامي الخالد (مشرف الإنتاج)',
      title: 'طالب صيانة',
      badgeBg: 'bg-purple-100 text-purple-900 border-purple-300'
    },
    external_approver: {
      name: 'الأستاذ محمد زغموت',
      title: 'مسؤول اعتماد الورشة الخارجية',
      badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300'
    }
  };

  const currentProfile = roleUserProfiles[activeRole] || roleUserProfiles.admin;

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <header className="bg-gradient-to-r from-[#1746c8] via-[#1d4ed8] to-[#0c2770] text-white sticky top-0 z-30 shadow-md no-print dir-rtl border-b border-blue-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
          
          {/* Right Section: System Logo, Title, Role Pill & Subtitle matching Capture2.JPG */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-white/15 text-white rounded-2xl flex items-center justify-center font-bold shadow-inner border border-white/30 shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-blue-100 font-bold">
                نظام إدارة الصيانة الشاملة (CMMS)
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeRole === 'admin'
                    ? 'لوحة المدير العام'
                    : activeRole === 'maintenance_manager'
                    ? 'لوحة مدير الصيانة'
                    : activeRole === 'technician'
                    ? 'لوحة فني الصيانة'
                    : 'لوحة طلبات الموظف'}
                </h1>
                <span className="bg-white/20 text-white border border-white/35 rounded-full px-3 py-0.5 text-xs sm:text-sm font-extrabold backdrop-blur-xs">
                  {activeRole === 'admin'
                    ? 'المدير العام'
                    : activeRole === 'maintenance_manager'
                    ? 'مدير الصيانة'
                    : activeRole === 'technician'
                    ? 'فني صيانة'
                    : 'طالب صيانة'}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-blue-100/90 font-semibold hidden sm:block mt-0.5">
                مرحباً {currentUser?.name || currentProfile.name} — {systemSettings.companyName || 'شركة أكبيطرة لصناعة الأدوية البيطرية'}
              </p>
            </div>
          </div>

          {/* Left Section: Glass Navigation Tabs, Notifications, New Request, and User controls */}
          <div className="flex items-center flex-wrap justify-between lg:justify-end gap-2.5">
            
            {/* Horizontal Glass Navigation Tabs matching Capture2.JPG */}
            <nav className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <button
                onClick={() => { setActiveView('dashboard'); setSubView(null); }}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs border whitespace-nowrap shadow-xs ${
                  activeView === 'dashboard'
                    ? 'bg-white text-blue-900 border-white shadow-md font-black'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/25 hover:border-white/40'
                }`}
              >
                <span>لوحة التحكم</span>
              </button>

              <button
                onClick={() => { setActiveView('requests'); setSubView('view'); }}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs border whitespace-nowrap shadow-xs ${
                  activeView === 'requests'
                    ? 'bg-white text-blue-900 border-white shadow-md font-black'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/25 hover:border-white/40'
                }`}
              >
                <span>طلبات الصيانة</span>
              </button>

              {(activeRole === 'admin' || activeRole === 'maintenance_manager') && (
                <>
                  <button
                    onClick={() => { setActiveView('assets'); setSubView('view'); }}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs border whitespace-nowrap shadow-xs ${
                      activeView === 'assets'
                        ? 'bg-white text-blue-900 border-white shadow-md font-black'
                        : 'bg-white/15 hover:bg-white/25 text-white border-white/25 hover:border-white/40'
                    }`}
                  >
                    <span>الآلات والمعدات</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('departments'); setSubView('view'); }}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs border whitespace-nowrap shadow-xs ${
                      activeView === 'departments'
                        ? 'bg-white text-blue-900 border-white shadow-md font-black'
                        : 'bg-white/15 hover:bg-white/25 text-white border-white/25 hover:border-white/40'
                    }`}
                  >
                    <span>الأقسام</span>
                  </button>
                </>
              )}

              {activeRole === 'admin' && (
                <>
                  <button
                    onClick={() => { setActiveView('users'); setSubView('view'); }}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs border whitespace-nowrap shadow-xs ${
                      activeView === 'users'
                        ? 'bg-white text-blue-900 border-white shadow-md font-black'
                        : 'bg-white/15 hover:bg-white/25 text-white border-white/25 hover:border-white/40'
                    }`}
                  >
                    <span>المستخدمين</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('backup'); setSubView(null); }}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs border whitespace-nowrap shadow-xs ${
                      activeView === 'backup'
                        ? 'bg-white text-blue-900 border-white shadow-md font-black'
                        : 'bg-white/15 hover:bg-white/25 text-white border-white/25 hover:border-white/40'
                    }`}
                  >
                    <span>النسخ الاحتياطي</span>
                  </button>
                </>
              )}
            </nav>

            <div className="flex items-center gap-2.5">
              {/* Quick Create Request Button matching Capture2.JPG (White button with dark text) */}
              <button
                onClick={() => {
                  setActiveView('requests');
                  setSubView('create');
                }}
                className="bg-white hover:bg-slate-100 text-slate-900 text-sm sm:text-base font-extrabold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 text-blue-700" />
                <span>تسجيل طلب صيانة</span>
              </button>

              {/* System Alerts & Real-Time Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                  className="relative p-2 rounded-xl border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="مركز التنبيهات والإشعارات الفورية"
                >
                  <Bell className="w-4 h-4 text-white" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-blue-900">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {showAlertsDropdown && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header & Quick Action Buttons */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-extrabold text-slate-900">مركز الإشعارات والتنبيهات</h3>
                        {unreadNotificationsCount > 0 && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadNotificationsCount} جديد
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {unreadNotificationsCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer"
                            title="قراءة الجميع"
                          >
                            <Check className="w-3 h-3" />
                            <span>قراءة الكل</span>
                          </button>
                        )}
                        <button
                          onClick={() => setShowAlertsDropdown(false)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          إغلاق
                        </button>
                      </div>
                    </div>

                    {/* Filter Sub-Bar */}
                    <div className="flex items-center justify-between mt-2.5 mb-2 px-1 text-[11px]">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                        <button
                          onClick={() => setNotifFilter('all')}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            notifFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          الكل ({userNotifications.length})
                        </button>
                        <button
                          onClick={() => setNotifFilter('unread')}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            notifFilter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          غير مقروء ({unreadNotificationsCount})
                        </button>
                      </div>

                      {userNotifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>مسح</span>
                        </button>
                      )}
                    </div>

                    {/* Notification List Body */}
                    <div className="space-y-2 max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs font-medium pl-1">
                      {filteredNotifications.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-blue-500 opacity-60" />
                          <span>لا توجد إشعارات {notifFilter === 'unread' ? 'غير مقروءة' : 'حالياً'}</span>
                        </div>
                      ) : (
                        filteredNotifications.map(notif => {
                          const isCritical = notif.type === 'critical_fault';
                          const isTechAssign = notif.type === 'request_assigned';

                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationAsRead(notif.id);
                                if (notif.requestId) {
                                  setActiveView('requests');
                                  setSubView('view');
                                }
                                setShowAlertsDropdown(false);
                              }}
                              className={`pt-2.5 pb-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 border my-1 ${
                                !notif.read
                                  ? isCritical
                                    ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/80'
                                    : isTechAssign
                                    ? 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/80'
                                    : 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/80'
                                  : 'bg-white border-slate-100 hover:bg-slate-50 opacity-80'
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {isCritical ? (
                                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                                ) : isTechAssign ? (
                                  <Wrench className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Bell className="w-4 h-4 text-blue-600" />
                                )}
                              </div>

                              <div className="flex-1 text-right">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`font-bold text-xs ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {notif.title}
                                  </span>
                                  {!notif.read && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-600 mt-1 leading-normal font-sans">
                                  {notif.message}
                                </p>

                                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {notif.timestamp}
                                  </span>
                                  {notif.requestId && (
                                    <span className="text-blue-600 font-bold flex items-center gap-0.5 hover:underline">
                                      عرض الطلب <ExternalLink className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl border border-white/25 bg-white/10 text-white hover:bg-rose-600 hover:border-rose-400 transition-all cursor-pointer flex items-center gap-1.5"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">خروج</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

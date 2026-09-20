import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { DepartmentsView } from './components/DepartmentsView';
import { UsersView } from './components/UsersView';
import { RolesPermissionsView } from './components/RolesPermissionsView';
import { AssetsView } from './components/AssetsView';
import { TechniciansView } from './components/TechniciansView';
import { RequestsView } from './components/RequestsView';
import { ReportsView } from './components/ReportsView';
import { MachineHistoryView } from './components/MachineHistoryView';
import { BackupView } from './components/BackupView';
import { SettingsView } from './components/SettingsView';
import { NotificationToast } from './components/NotificationToast';

const MainContent: React.FC = () => {
  const { activeView, isAuthenticated, systemSettings } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderTabContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'departments':
        return <DepartmentsView />;
      case 'users':
        return <UsersView />;
      case 'roles':
        return <RolesPermissionsView />;
      case 'assets':
        return <AssetsView />;
      case 'technicians':
        return <TechniciansView />;
      case 'requests':
        return <RequestsView />;
      case 'reports':
        return <ReportsView />;
      case 'machine_history':
      case 'logs':
        return <MachineHistoryView />;
      case 'backup':
        return <BackupView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dir-rtl selection:bg-blue-600 selection:text-white">
      {/* Top Navbar Header */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Content Workspace Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-50/70">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Real-time In-App Notification Toast */}
      <NotificationToast />

      {/* Technical System Status Footer */}
      <footer className="h-9 bg-gradient-to-r from-[#0c2770] via-[#103399] to-[#0c2770] text-blue-100 border-t border-blue-900/40 flex items-center justify-between px-4 sm:px-6 text-[11px] font-medium shrink-0 no-print z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white">{systemSettings.companyName || 'شركة أكبيطرة لصناعة الأدوية البيطرية'}</span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-blue-200">
          <span>نظام إدارة الصيانة الشامل (CMMS)</span>
          <span>•</span>
          <span className="text-emerald-300 font-semibold">حالة النظام: نشط وسليم</span>
        </div>

        <div className="text-blue-200 font-mono text-[10px]">
          v3.0.0 ENTERPRISE
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

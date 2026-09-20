import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, User } from '../types';
import {
  ShieldCheck,
  Building2,
  Lock,
  KeyRound,
  UserCheck,
  Wrench,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, setActiveRole, setIsAuthenticated, setCurrentUser, systemSettings, setActiveView } = useApp();

  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [usernameInput, setUsernameInput] = useState<string>('admin');
  const [passwordInput, setPasswordInput] = useState<string>('123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const selectedUser = users.find(u => u.id === selectedUserId) || users.find(u => u.username === usernameInput) || users[0];

  const handleSelectUserChange = (uId: string) => {
    setSelectedUserId(uId);
    const u = users.find(usr => usr.id === uId);
    if (u) {
      setUsernameInput(u.username);
      setPasswordInput('123456');
      setError('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setError('يرجى كتابة اسم المستخدم');
      return;
    }

    // Match existing user from system users state by username or id
    const foundUser = users.find(
      u => u.username.toLowerCase() === usernameInput.toLowerCase().trim() || u.id === selectedUserId
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setActiveRole(foundUser.role);
      setIsAuthenticated(true);
      if (foundUser.role === 'employee') {
        setActiveView('requests');
      } else {
        setActiveView('dashboard');
      }
    } else {
      // Create a temporary user object if logged in with custom username
      const customUser: User = {
        id: `USR-${Date.now()}`,
        name: usernameInput,
        username: usernameInput,
        role: usernameInput.toLowerCase() === 'admin' ? 'admin' : 'employee',
        departmentId: 'DEPT-101',
        departmentName: 'قسم الإنتاج والتصنيع',
        phone: '0500000000',
        createdDate: new Date().toISOString().slice(0, 10)
      };
      setCurrentUser(customUser);
      setActiveRole(customUser.role);
      setIsAuthenticated(true);
      if (customUser.role === 'employee') {
        setActiveView('requests');
      } else {
        setActiveView('dashboard');
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'مدير النظام (Admin)', bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: ShieldCheck };
      case 'maintenance_manager':
        return { label: 'مدير الصيانة', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300', icon: UserCheck };
      case 'technician':
        return { label: 'فني الصيانة', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: Wrench };
      case 'external_approver':
        return { label: 'مسؤول اعتماد الورشة الخارجية', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: ShieldCheck };
      default:
        return { label: 'طالب صيانة / موظف', bg: 'bg-purple-100 text-purple-900 border-purple-300', icon: UserIcon };
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 dir-rtl">
      
      {/* Login Card Matching Capture.JPG */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/90 space-y-0">
        
        {/* Top Royal Blue Header Banner */}
        <div className="bg-gradient-to-b from-[#1b52db] via-[#1a4ed8] to-[#0d2a84] text-white p-7 sm:p-8 text-center relative overflow-hidden">
          {/* Subtle ambient light curves */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            {/* Shield Icon in rounded container */}
            <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl border border-white/40 bg-white/15 flex items-center justify-center shadow-inner text-white">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <p className="text-xs font-semibold text-blue-100/90 tracking-wide">
              {systemSettings.companyName || 'شركة أكبيطرة لصناعة الأدوية البيطرية'}
            </p>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              تسجيل دخول الموظفين
            </h1>

            <p className="text-xs text-blue-100/90 max-w-xs mx-auto leading-relaxed">
              ادخل باسم المستخدم وكلمة المرور اللذين خصصهما لك مدير النظام.
            </p>

            {/* Translucent Security Pill */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-white/40 bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>دخول محلي آمن</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card Body with Welcome Alert & Form */}
        <div className="p-6 sm:p-8 space-y-5 bg-white">
          
          {/* Welcome Alert Box Matching Capture.JPG */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-slate-700 space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>مرحباً بك</span>
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              تستخدم هذه الصفحة حساب العمل الذي أنشأه لك المدير العام أو مدير النظام لمتابعة طلبات وأعمال الصيانة.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Quick Registered Account Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                اختر الحساب الجاهز للتجربة السريعة:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleSelectUserChange(e.target.value)}
                className="w-full border border-slate-300 bg-slate-50 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                {users.map(u => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.username}) - [{badge.label}]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Username Input with User Icon */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-800">
                <span>اسم المستخدم</span>
                <UserIcon className="w-4 h-4 text-blue-600" />
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="مثال: admin"
                className="w-full border-2 border-blue-400/90 rounded-xl px-4 py-2.5 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-right placeholder:text-slate-400"
              />
            </div>

            {/* Password Input with Key Icon */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-800">
                <span>كلمة المرور</span>
                <KeyRound className="w-4 h-4 text-blue-600" />
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 pl-10 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-right placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button Matching Capture.JPG (Deep Navy) */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#0a2540] hover:bg-[#071a2e] text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-blue-300" />
                <span>دخول إلى النظام</span>
              </button>
            </div>
          </form>

          {/* Footer info & Credits */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <div className="bg-slate-50 py-2 px-3 rounded-xl border border-slate-200/70">
              <p className="text-[11px] font-bold text-slate-500 mb-0.5">
                تصميم وتطوير:
              </p>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-800 dir-rtl">
                <span>م.مرعي محمد الأحمد</span>
                <span className="text-slate-400">•</span>
                <span>م.م. خلدون آغا</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              شركة أكبيطرة لصناعة الأدوية البيطرية © 2026 - جميع الحقوق محفوظة
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

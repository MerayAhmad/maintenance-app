import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Wrench, Bell, CheckCircle2, X, ExternalLink } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toastNotification, clearToastNotification, markNotificationAsRead, setActiveView, setSubView } = useApp();

  useEffect(() => {
    if (!toastNotification) return;

    // Auto dismiss after 6 seconds
    const timer = setTimeout(() => {
      clearToastNotification();
    }, 6000);

    return () => clearTimeout(timer);
  }, [toastNotification, clearToastNotification]);

  if (!toastNotification) return null;

  const handleOpenRequest = () => {
    if (toastNotification) {
      markNotificationAsRead(toastNotification.id);
      setActiveView('requests');
      setSubView('view');
      clearToastNotification();
    }
  };

  const getIcon = () => {
    switch (toastNotification.type) {
      case 'critical_fault':
        return <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />;
      case 'request_assigned':
        return <Wrench className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'status_updated':
        return <Bell className="w-5 h-5 text-blue-600 shrink-0" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toastNotification.type) {
      case 'critical_fault':
        return 'border-rose-500 bg-rose-50/95 text-rose-950';
      case 'request_assigned':
        return 'border-emerald-500 bg-emerald-50/95 text-emerald-950';
      case 'status_updated':
        return 'border-blue-500 bg-blue-50/95 text-blue-950';
      default:
        return 'border-purple-500 bg-purple-50/95 text-purple-950';
    }
  };

  return (
    <div className="fixed bottom-12 left-4 z-50 max-w-sm sm:max-w-md w-full dir-rtl no-print transition-all duration-300 animate-in slide-in-from-bottom-5">
      <div className={`p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-md relative overflow-hidden ${getBorderColor()}`}>
        {/* Animated Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/10">
          <div className="h-full bg-slate-900/40 animate-[shrink_6s_linear_forwards]" />
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-xl shadow-xs border border-black/5">
            {getIcon()}
          </div>

          <div className="flex-1 text-right">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                {toastNotification.title}
              </h4>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                {toastNotification.timestamp.split('|')[1] || toastNotification.timestamp}
              </span>
            </div>

            <p className="text-xs mt-1 text-slate-700 font-medium leading-relaxed">
              {toastNotification.message}
            </p>

            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
              {toastNotification.requestId ? (
                <button
                  onClick={handleOpenRequest}
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>عرض الطلب بالتفصيل</span>
                </button>
              ) : <div />}

              <button
                onClick={clearToastNotification}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-black/5 cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

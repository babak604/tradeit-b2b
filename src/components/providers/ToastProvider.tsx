'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-lg border text-xs font-medium shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200'
                : t.type === 'error'
                ? 'bg-red-950/90 border-red-800/80 text-red-200'
                : t.type === 'warning'
                ? 'bg-amber-950/90 border-amber-800/80 text-amber-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm">
                {t.type === 'success' && '✓'}
                {t.type === 'error' && '✕'}
                {t.type === 'warning' && '⚠️'}
                {t.type === 'info' && 'ℹ️'}
              </span>
              <p className="leading-tight">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors text-sm font-bold pl-2"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
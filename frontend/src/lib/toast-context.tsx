'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast container in fixed overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
        {toasts.map((t) => {
          let bgColor = 'bg-[#ffffff] border-[#000000] text-[#000000]';
          let Icon = Info;
          let iconColor = 'text-[#000000]';

          if (t.type === 'success') {
            bgColor = 'bg-tint-sage border-[#000000] text-[#000000]';
            Icon = CheckCircle;
            iconColor = 'text-[#8e8a25]';
          } else if (t.type === 'error') {
            bgColor = 'bg-[#ffffff] border-[#e91d2a] text-[#e91d2a] font-bold';
            Icon = AlertTriangle;
            iconColor = 'text-[#e91d2a]';
          }

          return (
            <div
              key={t.id}
              className={`flex items-center justify-between gap-3 p-[12px_16px] rounded-none border pointer-events-auto transition-none animate-slide-in-right font-times-new-roman ${bgColor}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                <span className="text-body-sm">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[#000000] p-0.5 rounded-none border border-transparent cursor-pointer font-helvetica font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
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

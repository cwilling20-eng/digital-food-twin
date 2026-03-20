import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  onDismiss?: () => void;
  duration?: number;
}

export function Toast({ message, type, icon, onDismiss, duration = 4000 }: ToastProps) {
  const bgColors = {
    info: 'bg-blue-600',
    success: 'bg-nm-signature',
    warning: 'bg-amber-600',
    error: 'bg-red-600'
  };

  useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 ${bgColors[type]} text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-down max-w-[90vw]`}>
      {icon}
      <span className="text-sm font-medium">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 hover:bg-white/20 rounded-full p-1">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <Toast
      message={message}
      type="error"
      icon={<AlertCircle className="w-4 h-4 flex-shrink-0" />}
      onDismiss={onDismiss}
      duration={5000}
    />
  );
}

export function useErrorToast() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (msg: string) => setErrorMessage(msg);
  const clearError = () => setErrorMessage(null);

  return { errorMessage, showError, clearError };
}

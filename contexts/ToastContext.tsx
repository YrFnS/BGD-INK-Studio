
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import gsap from 'gsap';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<Toast> = ({ message, type }) => {
  const elRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    gsap.fromTo(elRef.current,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' }
    );
  }, []);

  const getColors = () => {
    switch(type) {
      case 'success': return 'bg-green-500 text-white';
      case 'error': return 'bg-red-500 text-white';
      default: return 'bg-white dark:bg-zinc-800 text-black dark:text-white border border-gray-200 dark:border-zinc-700';
    }
  };

  return (
    <div 
      ref={elRef}
      className={`${getColors()} px-6 py-4 rounded-xl shadow-2xl min-w-[300px] flex items-center gap-3 backdrop-blur-md font-medium text-sm`}
    >
      {type === 'success' && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {type === 'error' && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {type === 'info' && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

// @ts-ignore;
import React from 'react';

const ToastContext = React.createContext(null);
let toastId = 0;
function ToastProvider({
  children
}) {
  const [toasts, setToasts] = React.useState([]);
  const addToast = React.useCallback(({
    title,
    description,
    variant = 'default',
    duration = 3000
  }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, {
      id,
      title,
      description,
      variant,
      duration
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);
  const removeToast = React.useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  return <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => <div key={t.id} onClick={() => removeToast(t.id)} className={`
              px-4 py-3 rounded-lg shadow-lg border text-sm cursor-pointer transition-all animate-in slide-in-from-right
              ${t.variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-800'}
            `}>
            {t.title && <p className="font-medium">{t.title}</p>}
            {t.description && <p className="text-xs mt-0.5 opacity-80">{t.description}</p>}
          </div>)}
      </div>
    </ToastContext.Provider>;
}
function useToast() {
  const addToast = React.useContext(ToastContext);
  if (!addToast) {
    return {
      toast: ({
        title,
        description,
        variant,
        duration
      }) => {
        console.warn('ToastProvider not found');
      }
    };
  }
  return {
    toast: ({
      title,
      description,
      variant,
      duration
    }) => addToast({
      title,
      description,
      variant,
      duration
    })
  };
}
function toast({
  title,
  description,
  variant,
  duration
}) {
  // 全局 toast 调用
  const event = new CustomEvent('toast', {
    detail: {
      title,
      description,
      variant,
      duration
    }
  });
  window.dispatchEvent(event);
}
export { ToastProvider, useToast, toast };
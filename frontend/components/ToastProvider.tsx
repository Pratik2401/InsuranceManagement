'use client';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster 
      position="bottom-right" 
      toastOptions={{ 
        style: { 
          background: '#282a30', 
          color: '#e2e2eb',
          border: '1px solid rgba(70, 69, 85, 0.4)'
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }} 
    />
  );
}

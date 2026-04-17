import type { Metadata } from 'next';
import './auth.css';

export const metadata: Metadata = {
  title: 'InsureFlow – Auth',
  description: 'Login or create your InsureFlow account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      {children}
    </div>
  );
}

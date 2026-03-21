import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageLayout({ children, className = '', noPadding = false }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-nm-bg ${noPadding ? '' : 'px-6'} pt-0 pb-40 ${className}`}>
      {children}
    </div>
  );
}

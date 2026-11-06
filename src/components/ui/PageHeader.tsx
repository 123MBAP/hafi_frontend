import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
  actions?: React.ReactNode;
  darkMode?: boolean;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs,
  action,
  actions,
  darkMode = false,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs mb-3 text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-red-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={darkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight uppercase ${
              darkMode ? 'text-white' : 'text-[#0A0A0A]'
            }`}>
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className={`mt-2 text-sm sm:text-base max-w-2xl leading-relaxed ${
              darkMode ? 'text-gray-300' : 'text-[#666666]'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        {(action || actions) && <div className="flex items-center gap-2 flex-shrink-0">{action || actions}</div>}
      </div>
    </div>
  );
}

export { PageHeader };


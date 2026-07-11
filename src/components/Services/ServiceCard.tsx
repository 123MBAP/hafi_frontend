// ServiceCard.tsx
import { useState } from 'react';
import type { Service } from '@/api/types';

interface ServiceCardProps {
  service: Service;
  darkMode: boolean;
}

export default function ServiceCard({ service, darkMode }: ServiceCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const hasLongDescription = (service.description?.length ?? 0) > 90;

  return (
  <div
      className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'} border-0 shadow-sm`}
      style={{ borderRadius: '2px' }}
    >
      {/* Image section - fixed height */}
      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Content - compact */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className={`text-sm font-semibold line-clamp-1 mb-1 ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors`}>
          {service.title}
        </h3>
        
        <p className={`text-xs mb-1 ${isDescriptionExpanded ? '' : 'line-clamp-2'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {service.description}
        </p>

        {hasLongDescription && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsDescriptionExpanded((prev) => !prev);
            }}
            className={`self-start text-[11px] font-medium mb-2 transition-colors ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
          >
            {isDescriptionExpanded ? 'View less' : 'View more'}
          </button>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-0.5 text-xs text-gray-400">
  
            </div>
            <span className="text-xs font-medium text-emerald-500 group-hover:text-emerald-600 transition-colors">
              Browse service providers →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
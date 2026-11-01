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
      className={`group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex flex-col h-full ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100 shadow-sm'}`}
    >
      {/* Image section with 1:1 Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
          Service
        </div>
      </div>

      {/* Content - compact */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`text-sm font-semibold line-clamp-2 leading-snug mb-1.5 ${darkMode ? 'text-white group-hover:text-red-400' : 'text-black group-hover:text-red-600'} transition-colors`}>
            {service.title}
          </h3>
          
          <p className={`text-xs leading-relaxed mb-2 ${isDescriptionExpanded ? '' : 'line-clamp-2'} ${darkMode ? 'text-gray-300' : 'text-black/80'}`}>
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
              className={`self-start text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            >
              {isDescriptionExpanded ? 'View less' : 'View more'}
            </button>
          )}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Browse Providers →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
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
      className={`group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full ${
        darkMode ? 'bg-zinc-900 border border-zinc-800 hover:border-[#E5252A]' : 'bg-white border border-gray-200 hover:border-[#E5252A] shadow-sm'
      }`}
    >
      {/* Image section with 1:1 Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 bg-[#0A0A0A]/80 backdrop-blur-sm px-2.5 py-0.5 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
          Service
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`text-sm font-bold line-clamp-2 leading-snug mb-1.5 transition-colors ${
            darkMode ? 'text-white group-hover:text-red-400' : 'text-[#151515] group-hover:text-[#E5252A]'
          }`}>
            {service.title}
          </h3>
          
          <p className={`text-xs font-normal leading-relaxed mb-2 ${isDescriptionExpanded ? '' : 'line-clamp-2'} ${
            darkMode ? 'text-gray-400' : 'text-[#666666]'
          }`}>
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
              className={`text-[11px] font-bold uppercase tracking-wider mb-2 transition-colors ${
                darkMode ? 'text-red-400 hover:text-red-300' : 'text-[#E5252A] hover:text-[#C81E23]'
              }`}
            >
              {isDescriptionExpanded ? 'View less' : 'View more'}
            </button>
          )}
        </div>

        <div className="mt-auto pt-2.5 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5252A] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Browse Providers →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
// ServiceCard.tsx
import type { Service } from '@/api/types';
import { Eye } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  darkMode: boolean;
}

export default function ServiceCard({ service, darkMode }: ServiceCardProps) {
  return (
    <div
      className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} border-0 shadow-sm`}
      style={{ borderRadius: '2px' }}
    >
      {/* Image section - fixed height */}
      <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-gray-700">
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
        
        <p className={`text-xs line-clamp-2 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {service.description}
        </p>

        <div className="mt-auto">
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-0.5 text-xs text-gray-400">
              <Eye className="w-3 h-3" />
              <span>{Math.floor(Math.random() * 1000)} views</span>
            </div>
            <span className="text-xs font-medium text-emerald-500 group-hover:text-emerald-600 transition-colors">
              Learn more →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
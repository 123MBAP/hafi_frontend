// Updated SearchBar component (if needed)
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  darkMode?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = "Search...", darkMode = false }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-4 py-2 text-sm border-0 ${darkMode ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'} shadow-sm focus:ring-1 focus:ring-emerald-500`}
        style={{ borderRadius: '2px' }}
      />
    </div>
  );
}
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
        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`}
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
        className={`w-full pl-9 pr-4 py-2 text-sm border ${darkMode ? 'bg-black border-white text-white placeholder-white' : 'bg-white border-black text-black placeholder-black'} shadow-sm focus:ring-1 focus:ring-red-600`}
        style={{ borderRadius: '2px' }}
      />
    </div>
  );
}
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
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-600"
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
        className="w-full pl-9 pr-4 py-2 text-sm border border-red-600 bg-black text-white placeholder-white/60 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-600"
        style={{ borderRadius: '2px' }}
      />
    </div>
  );
}
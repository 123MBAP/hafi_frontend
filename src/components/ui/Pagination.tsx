// Shared Pagination component
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  darkMode?: boolean;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
  darkMode = false
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex justify-center items-center gap-1.5 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border ${
          darkMode
            ? 'border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800'
            : 'border-[#E5E5E5] text-[#151515] hover:bg-gray-100'
        }`}
      >
        Previous
      </button>
      
      {getPageNumbers().map((page, idx) => (
        <button
          key={idx}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center ${
            page === currentPage
              ? 'bg-[#E5252A] text-white shadow-xs'
              : typeof page === 'number'
                ? darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800 border border-transparent'
                  : 'text-[#151515] hover:bg-gray-100 border border-transparent'
                : darkMode
                  ? 'text-gray-500'
                  : 'text-gray-400'
          }`}
          disabled={typeof page !== 'number'}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border ${
          darkMode
            ? 'border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800'
            : 'border-[#E5E5E5] text-[#151515] hover:bg-gray-100'
        }`}
      >
        Next
      </button>
    </div>
  );
}

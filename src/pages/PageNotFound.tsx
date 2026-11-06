import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] bg-[#F5F5F5] dark:bg-gray-950 text-center px-4">
      <div className="max-w-md w-full p-8 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col items-center">
        <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-4 shadow-xs">
          Page Not Found
        </div>
        <h1 className="text-7xl font-extrabold tracking-tight text-[#E5252A] mb-3">404</h1>
        <h2 className="text-xl font-bold uppercase tracking-tight text-[#151515] dark:text-white mb-2">
          Lost in Discovery
        </h2>
        <p className="text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400 mb-6">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#E5252A] hover:bg-[#c91d22] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all active:scale-[0.99]"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

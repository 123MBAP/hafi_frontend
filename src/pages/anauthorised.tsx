import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const Unauthorized: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[75vh] bg-[#F5F5F5] dark:bg-gray-950 text-center px-4">
    <div className="max-w-md w-full p-8 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#E5252A] mb-4">
        <ShieldAlert className="w-7 h-7 text-[#E5252A]" />
      </div>
      <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-3 shadow-xs">
        Access Restricted
      </div>
      <h1 className="text-xl font-extrabold uppercase tracking-tight text-[#151515] dark:text-white mb-2">
        Unauthorized Access
      </h1>
      <p className="text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400 mb-6">
        You do not have the required permissions or role privileges to view this section. Please sign in with an authorized account or return to the main platform.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          to="/"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#151515] dark:text-gray-200 hover:bg-[#F5F5F5] text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
        <Link
          to="/login"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  </div>
);

export default Unauthorized;

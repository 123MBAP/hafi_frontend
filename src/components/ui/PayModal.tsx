import { useDarkMode } from "@/context/DarkMode";
import { ReactNode } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string; 
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { darkMode } = useDarkMode();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex justify-center items-start overflow-auto z-50 ${darkMode ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"}`}
      onClick={onClose}
    >
      <div
        className={`max-w-md w-full rounded-lg shadow-lg p-6 m-6 ${darkMode ? "bg-gray-800 text-gray-100 border border-gray-700" : "bg-white text-gray-900"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-start justify-between mb-4">
            <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{title}</h3>
            <button
              onClick={() => onClose()}
              aria-label="Close"
              className={`ml-2 px-2 py-1 rounded ${darkMode ? "text-gray-200 hover:text-red-400" : "text-gray-700 hover:text-red-500"}`}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

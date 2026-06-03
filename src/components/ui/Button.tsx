import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  onClick
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 text-white hover:bg-blue-700' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${(disabled || isLoading) ? disabledClasses : ''}`}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
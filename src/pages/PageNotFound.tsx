// src/pages/NotFound.tsx
import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 text-center px-4">
      <h1 className="text-6xl font-bold text-emerald-600 mb-4">404</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
        Oops! The page you are looking for is not found. Please adjust your search.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-hafi-teal text-white rounded-lg shadow-md hover:bg-hafi-green transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;

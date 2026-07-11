import { ChangeEvent } from 'react';
import { useDarkMode } from '@/context/DarkMode';

interface CategoryFilterProps {
  categories: Array<{ id: number; name: string }>;
  selectedCategory: number | undefined;
  onCategoryChange: (categoryId: number | undefined) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange
}: CategoryFilterProps) {
  const { darkMode } = useDarkMode();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(e.target.value ? Number(e.target.value) : undefined);
  };

  return (
    <select
      value={selectedCategory || ''}
      onChange={handleChange}
      className={`px-3 py-2 border rounded-md text-sm w-full transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-400'
          : 'bg-white border-gray-300 text-gray-800'
      }`}
    >
      <option value="">All Categories</option>
      {categories.map(category => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

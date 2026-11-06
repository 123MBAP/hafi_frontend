import { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkMode";
import { ArrowLeft, ShoppingBag } from "lucide-react";

// Example: You should replace this with your API fetch for real products
const fakeProductsAPI = (category: string) =>
  new Promise<{ id: number; name: string; image: string; price: number }[]>(resolve =>
    setTimeout(
      () =>
        resolve(
          Array.from({ length: 8 }).map((_, i) => ({
            id: i + 1,
            name: `${category.charAt(0).toUpperCase() + category.slice(1)} Product ${i + 1}`,
            image:
              "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
            price: Math.round(Math.random() * 25000 + 5000),
          }))
        ),
      700
    )
  );

interface CategoryProductsPageProps {
  category: string; // category key
  onBack?: () => void; // optional back handler
}

export default function CategoryProductsPage({ category, onBack }: CategoryProductsPageProps) {
  const { darkMode } = useDarkMode();
  const [products, setProducts] = useState<
    { id: number; name: string; image: string; price: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fakeProductsAPI(category).then(items => {
      setProducts(items);
      setLoading(false);
    });
  }, [category]);

  const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-200 ${darkMode ? 'bg-gray-950 text-white' : 'bg-[#F5F5F5] text-[#151515]'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E5E5] dark:border-gray-800">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                  darkMode
                    ? 'border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800'
                    : 'border-[#E5E5E5] bg-white text-[#151515] hover:bg-[#F5F5F5]'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <div>
              <div className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-1 shadow-xs">
                Category Showcase
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                {formattedCategory} Products<span className="text-[#E5252A]">.</span>
              </h1>
            </div>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {products.length} Products Available
          </div>
        </div>

        {loading ? (
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 py-20 text-center">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-xs font-bold uppercase tracking-wider text-[#E5252A] py-20 text-center">
            No products found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(prod => (
              <div
                key={prod.id}
                className={`group rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                  darkMode ? 'bg-gray-900 border-gray-800 hover:border-[#E5252A]/40' : 'bg-white border-[#E5E5E5] hover:border-[#E5252A]/40'
                }`}
              >
                <div>
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-[#F5F5F5] dark:bg-gray-950 mb-3.5 flex items-center justify-center">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-[#151515] dark:text-white line-clamp-1 group-hover:text-[#E5252A] transition-colors">
                    {prod.name}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E5E5] dark:border-gray-800">
                  <div className="text-base font-extrabold text-[#E5252A] mb-3">
                    RWF {prod.price.toLocaleString()}
                  </div>
                  <button
                    className="w-full py-2.5 px-3 rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

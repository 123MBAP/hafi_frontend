import { useEffect, useState } from "react";

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
            price: Math.round(Math.random() * 100 + 10),
          }))
        ),
      700
    )
  );


  

const mainBlue = "#2563eb";
const mainBlack = "#121212";
const mainWhite = "#fff";

interface CategoryProductsPageProps {
  category: string; // category key
  onBack?: () => void; // optional back handler
}

export default function CategoryProductsPage({ category, onBack }: CategoryProductsPageProps) {
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

  return (
    <div style={{ background: mainWhite, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-4 px-3 py-1.5 rounded text-base font-semibold"
              style={{
                background: mainBlue,
                color: mainWhite,
                border: "none",
                boxShadow: "0 1px 4px rgba(37,99,235,0.10)",
              }}
            >
              ← Back
            </button>
          )}
          <h2 className="text-3xl font-bold" style={{ color: mainBlack }}>
            {category.charAt(0).toUpperCase() + category.slice(1)} Products
          </h2>
        </div>
        {loading ? (
          <div className="text-xl text-gray-600 py-20 text-center">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-red-600 text-lg py-20 text-center">No products found for this category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
            {products.map(prod => (
              <div
                key={prod.id}
                className="rounded-xl bg-white shadow flex flex-col items-center p-4 border hover:shadow-lg transition"
                style={{ borderColor: "#e0e7ef" }}
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  style={{
                    width: 130,
                    height: 130,
                    objectFit: "cover",
                    borderRadius: 14,
                    marginBottom: 15,
                  }}
                />
                <div className="font-semibold text-lg mb-2 text-center" style={{ color: mainBlack }}>
                  {prod.name}
                </div>
                <div className="text-blue-700 font-bold text-lg mb-4">${prod.price}</div>
                <button
                  className="w-full py-2 rounded text-base font-semibold"
                  style={{
                    background: mainBlue,
                    color: mainWhite,
                    border: "none",
                    boxShadow: "0 1px 4px rgba(37,99,235,0.09)",
                  }}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
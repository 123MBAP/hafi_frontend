// src/utils/marketFunctions.ts

import { MarketProductCat } from "../pages/MarketPage"; // adjust the import if needed

export const showProducts = async (
  cat: MarketProductCat,
  API_BASE: string,
  setSelectedCategory: React.Dispatch<React.SetStateAction<MarketProductCat | null>>,
  setLoadingProducts: React.Dispatch<React.SetStateAction<boolean>>,
  setProducts: React.Dispatch<React.SetStateAction<any[]>>
) => {
  setSelectedCategory(cat);
  setLoadingProducts(true);
  try {
    const res = await fetch(`${API_BASE}/api/marketPage/product/cats/${cat.id}/products`);
    const data = await res.json();
    setProducts(data.products || []);
  } catch (err) {
    setProducts([]);
  } finally {
    setLoadingProducts(false);
  }
};

export const backToCategories = (
  setSelectedCategory: React.Dispatch<React.SetStateAction<MarketProductCat | null>>,
  setProducts: React.Dispatch<React.SetStateAction<any[]>>
) => {
  setSelectedCategory(null);
  setProducts([]);
};

// context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  size?: string;
  quantity: number;
  oldPrice?: number;
  shipping: number;
  checked: boolean;
  providerId: string; // <-- Added provider ID for seller/service provider check
  type: string;
  description?: string;
  serviceCustomization?: {
    needsCustomization: boolean;
    customizationRequest?: string;
    noCustomizationNeeded?: boolean;
    originalPrice?: number;
    quotedPrice?: number;
    quoteStatus?: 'quoted' | 'accepted';
  };
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleCheck: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

const addToCart = (item: CartItem) => {
  console.log("➕ Adding to cart:", item);

  // Ensure productId exists
  const newItem = { ...item, productId: item.productId  };

  setCart((prev) => {
    if (prev.length > 0) {
      const currentProvider = prev[0].providerId;

      if (newItem.providerId !== currentProvider) {
        // Different provider — replace cart with only new item
        return [newItem];
      }
    }

    // For services, treat different customizations as different items
    // For products, check if same product with same size already exists
    const existing = prev.find((i) => {
      const sameBaseItem = i.id === newItem.id && i.size === newItem.size;
      if (!sameBaseItem) return false;

      // If both are services, only match if customizations are the same
      if (i.type === "service" && newItem.type === "service") {
        return (
          JSON.stringify(i.serviceCustomization) === JSON.stringify(newItem.serviceCustomization)
        );
      }

      // For non-services, just match on id and size
      return true;
    });

    if (existing) {
      return prev.map((i) =>
        i.id === newItem.id && i.size === newItem.size
          ? i.type === "service" && newItem.type === "service"
            ? JSON.stringify(i.serviceCustomization) === JSON.stringify(newItem.serviceCustomization)
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
            : { ...i, quantity: i.quantity + newItem.quantity }
          : i
      );
    }

    return [...prev, newItem];
  });
};

  const updateQuantity = (id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const toggleCheck = (id: string) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        toggleCheck,
        removeItem,
        clearCart,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

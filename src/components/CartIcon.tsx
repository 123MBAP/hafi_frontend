import { useCart } from "../context/CartContext"; // ✅ adjust path as needed

export default function CartIconWithCount() {
  const { cart } = useCart(); // ✅ context consumption

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ position: "relative", display: "inline-block", width: 42, height: 38 }}>
      {/* Cart SVG Icon */}
      <svg
        width="38"
        height="38"
        viewBox="0 0 38 38"
        fill="none"
        style={{ display: "block", margin: "0 auto" }}
        xmlns="http://www.w3.org/2000/svg"
        className="text-black dark:text-white"
      >
        <g stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="31" r="1.9" fill="currentColor" />
          <circle cx="27" cy="31" r="1.9" fill="currentColor" />
          <path d="M5 9.5H7.7L10.8 25.5H29.2L32 13.5H9" strokeLinejoin="round" />
        </g>
      </svg>

      {/* Item Count Badge */}
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1 bg-red-600 text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold text-[11px] shadow-sm pointer-events-none"
        >
          {count}
        </span>
      )}
    </div>
  );
}

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
      >
        <g stroke="#00838F" strokeWidth="2.2">
          <circle cx="12" cy="31" r="1.9" fill="#00838F" />
          <circle cx="27" cy="31" r="1.9" fill="#00838F" />
          <path d="M5 9.5H7.7L10.8 25.5H29.2L32 13.5H9" strokeLinejoin="round" />
        </g>
      </svg>

      {/* Item Count Badge */}
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -8,
            left: "60%",
            fontSize: 18,
            fontWeight: 700,
            color: "#F57C00",
            textShadow: "1px 1px 0 #fff",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

import { useRef, useState, useEffect } from "react";

interface Props {
  images: string[]; // [original, view1, view2, ...]
  alt?: string;
  API_BASE: string; // <--- REQUIRED
  className?: string;
}

export default function ImageCarouselCard({ images, alt, API_BASE, className }: Props) {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Desktop: auto-scroll on hover
  const onMouseEnter = () => {
    if (images.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, 1200);
  };
  const onMouseLeave = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIdx(0);
  };

  // Mobile: auto-scroll if card in viewport
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    let mobileInterval: NodeJS.Timeout | null = null;
    let observer: IntersectionObserver | null = null;

    if (window.matchMedia('(hover: none)').matches) {
      observer = new window.IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && images.length > 1) {
              if (mobileInterval) clearInterval(mobileInterval);
              mobileInterval = setInterval(() => {
                setIdx((i) => (i + 1) % images.length);
              }, 1500);
            } else {
              if (mobileInterval) clearInterval(mobileInterval);
              setIdx(0);
            }
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(node);
    }

    return () => {
      if (observer && node) observer.unobserve(node);
      if (mobileInterval) clearInterval(mobileInterval);
    };
    // eslint-disable-next-line
  }, [images.length]);

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: images.length > 1 ? "pointer" : undefined }}
    >
      <img
        src={images[idx].startsWith('http') ? images[idx] : `${API_BASE}${images[idx]}`}
        alt={alt || ""}
        className="object-cover w-full h-56 transition duration-300"
      />
    </div>
  );
}
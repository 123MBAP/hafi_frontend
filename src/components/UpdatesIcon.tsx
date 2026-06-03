

type Props = {
  count: number;
  onClick?: () => void;
};

export default function UpdatesIcon({ count, onClick }: Props) {
  return (
    <div className="relative cursor-pointer flex items-center" onClick={onClick}>
      <svg width={36} height={36} viewBox="0 0 40 40" fill="none">
        <path
          d="M20 36c2.2 0 4-1.8 4-4h-8c0 2.2 1.8 4 4 4zm10-10V18c0-5.1-3.3-9.3-8-10.6V6c0-.8-.7-1.5-1.5-1.5S19 5.2 19 6v1.4C14.3 8.7 11 12.9 11 18v8l-2 2v1h22v-1l-2-2z"
          fill="#00838F"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-hafi-orange text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-base border-2 border-white">
          {count}
        </span>
      )}

    </div>
  );
}
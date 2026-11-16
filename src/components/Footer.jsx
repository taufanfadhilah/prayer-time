export default function Footer({ footerText, countdown }) {
  return (
    <footer className="bg-prayer-green text-white px-4 py-2 flex-shrink-0 min-h-[90px] flex items-center justify-center">
      {footerText ? (
        <p
          className="text-center leading-tight whitespace-pre-line"
          style={{ fontSize: "18px" }}
        >
          {footerText}
        </p>
      ) : (
        <div className="text-center leading-tight flex flex-row flex-wrap items-center justify-center gap-x-2 w-full">
          <svg className="countdown-icon" aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><circle cx="24" cy="27" r="16"/><path d="M20 5h8M24 5v6M24 27l4-7"/></svg>
          <span style={{ fontSize: "27px" }}>Naredni ezan za:</span>
          <span
            className="font-bold tabular-nums"
            style={{ fontSize: "40px" }}
          >
            {countdown}
          </span>
        </div>
      )}
    </footer>
  );
}


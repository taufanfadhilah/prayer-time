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
        <div className="text-center leading-tight flex items-center justify-center gap-2 w-full">
          <span style={{ fontSize: "27px" }}>Naredni ezan za:</span>
          <span
            className="font-bold tabular-nums"
            style={{ fontSize: "36px" }}
          >
            {countdown}
          </span>
        </div>
      )}
    </footer>
  );
}


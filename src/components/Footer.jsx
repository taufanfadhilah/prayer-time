export default function Footer({ footerText }) {
  return (
    <footer className="bg-prayer-green text-white px-4 py-2 flex-shrink-0">
      <p
        className="text-center leading-tight"
        style={{ fontSize: "18px" }}
      >
        {footerText}
      </p>
    </footer>
  );
}


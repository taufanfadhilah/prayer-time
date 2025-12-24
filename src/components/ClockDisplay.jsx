export default function ClockDisplay({ clock }) {
  return (
    <div className="rounded-lg border border-light-border p-2 mx-auto w-[420px]">
      <div
        className="font-bold tracking-tight text-dark-text text-center tabular-nums"
        style={{ fontSize: "72px" }}
      >
        {clock}
      </div>
    </div>
  );
}


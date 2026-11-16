export default function ClockDisplay({ clock }) {
  return (
    <div className="p-2 mx-auto w-full">
      <div
        className="clock-display font-bold tracking-tight text-prayer-green text-center tabular-nums"
      >
        {clock}
      </div>
    </div>
  );
}


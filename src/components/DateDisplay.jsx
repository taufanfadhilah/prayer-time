import { useLayoutEffect, useRef } from "react";

export default function DateDisplay({ gregorianDate, hijriDate }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const columns = ref.current;
    const months = [...columns.querySelectorAll('.date-month')];
    let active = true;
    const fit = () => {
      if (!active) return;
      months.forEach((element) => { element.style.fontSize = "24px"; });
      const size = Math.min(24, ...months.map((element) => {
        const available = element.parentElement.clientWidth;
        return available > 0 ? 24 * Math.min(1, available / element.scrollWidth) : 24;
      }));
      months.forEach((element) => { element.style.fontSize = `${size}px`; });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(columns);
    window.addEventListener("resize", fit);
    fit();
    document.fonts?.ready.then(fit);
    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [gregorianDate.month, hijriDate.month]);
  return (
    <section className="mb-3">
      <div ref={ref} className="date-columns flex flex-row justify-center">
        {[{ date: gregorianDate, color: "text-prayer-green" }, { date: hijriDate, color: "text-islamic-date" }].map(({ date, color }) => (
          <div key={color} className={`date-column flex flex-col flex-1 min-w-0 items-center justify-center ${color}`}>
            <div className="font-bold leading-none whitespace-nowrap">
              <span style={{ fontSize: "54px" }}>{date.day}</span><span style={{ fontSize: "30px" }}>. {date.year}</span>
            </div>
            <div className="date-month font-bold leading-none whitespace-nowrap">{date.month}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

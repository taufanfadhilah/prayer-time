export default function DateDisplay({ gregorianDate, hijriDate, hijriMonthApi }) {
  return (
    <section className="mb-3">
      <div className="flex flex-row gap-2 justify-center">
        {/* Gregorian Date Box */}
        <div className="rounded-lg border border-light-border bg-transparent px-2 py-1 text-center flex flex-col items-center justify-center flex-1 max-w-xs">
          <div className="mb-0 leading-none">
            <span
              className="font-bold text-prayer-green"
              style={{ fontSize: "54px" }}
            >
              {gregorianDate.day}
            </span>
            <span
              className="font-bold text-prayer-green"
              style={{ fontSize: "30px" }}
            >
              .
            </span>
            <span
              className="font-bold text-prayer-green"
              style={{ fontSize: "30px" }}
            >
              {gregorianDate.year}
            </span>
          </div>
          <div
            className="font-bold text-prayer-green -mt-1 leading-none"
            style={{ fontSize: "32px" }}
          >
            {gregorianDate.month}
          </div>
        </div>

        {/* Islamic Date Box */}
        <div className="rounded-lg border border-light-border bg-transparent px-2 py-1 text-center flex flex-col items-center justify-center flex-1 max-w-xs">
          <div className="mb-0 leading-none">
            <span
              className="font-bold text-islamic-date"
              style={{ fontSize: "54px" }}
            >
              {hijriDate.day}
            </span>
            <span
              className="font-bold text-islamic-date"
              style={{ fontSize: "30px" }}
            >
              .
            </span>
            <span
              className="font-bold text-islamic-date"
              style={{ fontSize: "30px" }}
            >
              {hijriDate.year}
            </span>
          </div>
          <div
            className="font-bold text-islamic-date -mt-1 leading-none"
            style={{ fontSize: "32px" }}
          >
            {hijriMonthApi || hijriDate.month}
          </div>
        </div>
      </div>
    </section>
  );
}


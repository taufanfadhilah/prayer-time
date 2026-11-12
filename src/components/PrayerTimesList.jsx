import { labels } from "../utils/constants";
import { fontSize, spacing } from "../utils/platformConfig";

function PrayerIcon({ index }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="prayer-icon-svg" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5">
      {index === 5 ? <><path stroke="#00733b" d="M51 13C30 20 22 42 29 61C37 82 62 88 79 70C53 74 34 44 51 13Z"/><path stroke="#b09a76" d="M78 14l2.5 7.5L88 24l-7.5 2.5L78 34l-2.5-7.5L68 24l7.5-2.5Z"/></> : <>
        {index === 0 ? <><path stroke="#00733b" d="M57 8C46 12 43 25 48 33C53 41 65 42 72 32C59 35 50 20 57 8Z"/><path stroke="#00733b" d="M8 81 Q35 61 57 80 M29 76 Q56 53 92 79"/></> : <>
          <g stroke="#b09a76">
            {index === 2 || index === 3 ? <circle cx="50" cy="49" r="19"/> : <path d="M29 65a21 21 0 0 1 42 0"/>}
            {(index === 1 || index === 4 ? [270, 315, 0, 45, 90] : index === 3 ? [270, 315, 0, 45, 90, 225, 135] : rays).map((angle) => <path key={angle} d="M50 12v10" transform={`rotate(${angle} 50 49)`} />)}
          </g>
          {index === 1 || index === 3 ? <path stroke="#00733b" d="M9 80 Q50 55 91 80"/> : index === 4 ? <path stroke="#00733b" d="M8 67h84 M26 78h48 M40 88h20"/> : null}
        </>}
      </>}
      {index === 0 && <g stroke="#b09a76"><path d="M17 58l8 5M30 47l6 9M48 44v10M67 47l-5 9M80 58l-8 5"/></g>}
    </svg>
  );
}

export default function PrayerTimesList({ prayerTimes, activePrayerIndex, hasCustomFajrTime, hasCustomDhuhrTime, isFriday, landscape }) {
  return (
    <section className="mb-3 flex-1 min-h-0 flex flex-col">
      <div className="rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Title Bar */}
        <div className={`bg-prayer-green text-white px-4 ${spacing.titleBarPy} rounded-lg flex-shrink-0`}>
          <div
            className="font-bold text-center uppercase"
            style={{ fontSize: fontSize.listTitle }}
          >
            VRIJEME NAMAZA
          </div>
        </div>

        {/* Prayer List */}
        <div className="bg-transparent flex-1 min-h-0">
          <div className="flex flex-col h-full min-h-0">
            {prayerTimes.map((time, i) => {
              const isActive = activePrayerIndex === i;
              return (
                <div
                  key={i}
                  className={`prayer-row flex flex-1 flex-row items-center ${spacing.prayerRowPy} px-3 ${isActive ? "active-prayer" : ""} ${i + 1 === activePrayerIndex ? "before-active-prayer" : ""}`}
                >
                  <div className="prayer-icon" aria-hidden="true"><PrayerIcon index={landscape && i === 0 ? 5 : landscape && i === 3 ? 1 : i} /></div>
                  <div className="flex-1 text-left pr-3">
                    <div
                      className={`font-medium ${
                        isActive ? "text-prayer-green" : "text-dark-text"
                      } leading-tight`}
                      style={{ fontSize: fontSize.prayerName }}
                    >
                      {i === 0
                        ? hasCustomFajrTime
                          ? "Sabah u džamiji"
                          : "Zora"
                        : i === 2 && isFriday
                          ? "Džuma"
                          : i === 2 && hasCustomDhuhrTime
                            ? "Podne"
                            : labels.bs[i]}
                    </div>
                  </div>
                  <div className="text-right px-2">
                    <div
                      className={`font-semibold ${
                        isActive ? "text-prayer-green" : "text-dark-text"
                      }`}
                      style={{ fontSize: fontSize.prayerTime }}
                    >
                      {time ? time.replace(/^(\d):/, '0$1:') : time}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


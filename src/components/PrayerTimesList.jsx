import { labels } from "../utils/constants";

export default function PrayerTimesList({ prayerTimes, activePrayerIndex, hasCustomFajrTime }) {
  return (
    <section className="mb-3 flex-1 min-h-0 flex flex-col">
      <div className="rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Title Bar */}
        <div className="bg-prayer-green text-white px-4 py-2 rounded-lg flex-shrink-0">
          <div
            className="font-bold text-center uppercase"
            style={{ fontSize: "24px" }}
          >
            VRIJEME NAMAZA | PRAYER TIMES
          </div>
        </div>

        {/* Prayer List */}
        <div className="bg-transparent flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {prayerTimes.map((time, i) => {
              const isActive = activePrayerIndex === i;
              return (
                <div
                  key={i}
                  className={`prayer-row flex flex-row items-center py-2 px-3`}
                >
                  <div className="flex-1 text-left pr-3">
                    <div
                      className={`font-medium ${
                        isActive ? "text-prayer-green" : "text-dark-text"
                      } leading-tight`}
                      style={{ fontSize: "36px" }}
                    >
                      {i === 0
                        ? hasCustomFajrTime
                          ? "Sabah u dzamiji"
                          : "Zora"
                        : labels.bs[i]}
                    </div>
                  </div>
                  <div className="flex-1 text-center px-2">
                    <div
                      className={`font-semibold ${
                        isActive ? "text-prayer-green" : "text-dark-text"
                      }`}
                      style={{ fontSize: "72px" }}
                    >
                      {time}
                    </div>
                  </div>
                  <div className="flex-1 text-right pl-3">
                    <div
                      className={`font-medium ${
                        isActive ? "text-prayer-green" : "text-dark-text"
                      }`}
                      style={{ fontSize: "36px" }}
                    >
                      {labels.en[i]}
                    </div>
                    <div
                      className={`font-normal ${
                        isActive ? "text-prayer-green" : "text-dark-text"
                      } mt-0 opacity-90`}
                      style={{ fontSize: "36px" }}
                    >
                      {labels.ar[i]}
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


import ClockDisplay from "./ClockDisplay";
import { fontSize } from "../utils/platformConfig";

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen?.() || document.webkitExitFullscreen?.();
  } else {
    document.documentElement.requestFullscreen?.() ||
      document.documentElement.webkitRequestFullscreen?.();
  }
}

export default function Header({ masjidHeaderLine, clock }) {
  return (
    <header className="mb-3">
      <div className="flex items-center gap-2 mb-2 w-fit mx-auto">
        <img
          src="/images/logo.svg"
          alt="Logo"
          className="w-14 h-14 cursor-pointer"
          onClick={toggleFullscreen}
        />
        <div className="flex flex-col">
          <div className="flex flex-col text-dark-text">
            <p
              className="font-bold uppercase text-prayer-green"
              style={{ fontSize: fontSize.headerTitle }}
            >
              ISLAMSKA ZAJEDNICA U BOSNI I HERCEGOVINI
            </p>
          </div>
          <div
            className="font-normal text-islamic-date mt-1 text-center"
            style={{ fontSize: fontSize.headerSubtitle }}
          >
            {masjidHeaderLine}
          </div>
        </div>
      </div>
      <ClockDisplay clock={clock} />
    </header>
  );
}


import { useEffect, useRef, useState } from "react";
import { FitList } from "react-fit-list";
import type { FitListOverflowRenderArgs } from "react-fit-list";
import "./App.css";
import { FaGithub } from "react-icons/fa";
import { SiNpm } from "react-icons/si";

type Item = {
  id: number;
  label: string;
};

type PopoverState = {
  hiddenItems: Item[];
  left: number;
  top: number;
  anchorLeft: number;
  anchorTop: number;
  anchorBottom: number;
};

const items: Item[] = [
  { id: 1, label: "React" },
  { id: 2, label: "TypeScript" },
  { id: 3, label: "Accessibility" },
  { id: 4, label: "Testing" },
  { id: 5, label: "Performance" },
  { id: 6, label: "Design Systems" },
];

const githubUrl =
  "https://github.com/SincerelyFaust/react-fit-list?tab=readme-ov-file";
const npmUrl = "https://www.npmjs.com/package/react-fit-list";
const DESKTOP_FRAME_WIDTH = 360;
const MOBILE_FRAME_MIN_WIDTH = 220;

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}

function App() {
  const [frameWidth, setFrameWidth] = useState(320);
  const [mobileFrameWidth, setMobileFrameWidth] = useState(DESKTOP_FRAME_WIDTH);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const frameShellRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const syncViewportMode = () => setIsMobileViewport(mediaQuery.matches);

    syncViewportMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewportMode);
      return () => mediaQuery.removeEventListener("change", syncViewportMode);
    }

    mediaQuery.addListener(syncViewportMode);
    return () => mediaQuery.removeListener(syncViewportMode);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateWidth = () => {
      setFrameWidth(Math.round(frame.getBoundingClientRect().width));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(frame);

    return () => {
      observer.disconnect();
    };
  }, [isMobileViewport, mobileFrameWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncMobileWidth = () => {
      const nextWidth = Math.min(DESKTOP_FRAME_WIDTH, window.innerWidth - 32);
      setMobileFrameWidth((current) => {
        if (!isMobileViewport) return current;
        return Math.max(MOBILE_FRAME_MIN_WIDTH, nextWidth);
      });
    };

    syncMobileWidth();
    window.addEventListener("resize", syncMobileWidth);
    return () => window.removeEventListener("resize", syncMobileWidth);
  }, [isMobileViewport]);

  useEffect(() => {
    if (!popover) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!frameShellRef.current?.contains(event.target as Node)) {
        setPopover(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopover(null);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [popover]);

  useEffect(() => {
    if (!popover) return;

    const updatePopoverPosition = () => {
      const frameShell = frameShellRef.current;
      const node = popoverRef.current;
      if (!frameShell || !node) return;

      const shellRect = frameShell.getBoundingClientRect();
      const popoverWidth = node.offsetWidth;
      const popoverHeight = node.offsetHeight;
      const viewportPadding = 8;

      const minLeft = Math.max(viewportPadding - shellRect.left, 8);
      const maxLeft = Math.max(
        minLeft,
        window.innerWidth - viewportPadding - shellRect.left - popoverWidth
      );
      const nextLeft = Math.min(Math.max(popover.anchorLeft, minLeft), maxLeft);

      const spaceBelow =
        window.innerHeight - shellRect.top - popover.anchorBottom;
      const canPlaceBelow = spaceBelow >= popoverHeight + 10;

      const preferredTop = canPlaceBelow
        ? popover.anchorBottom + 10
        : Math.max(
            viewportPadding - shellRect.top,
            popover.anchorTop - popoverHeight - 10
          );

      const maxTop = Math.max(
        viewportPadding - shellRect.top,
        window.innerHeight - viewportPadding - shellRect.top - popoverHeight
      );

      const nextTop = Math.min(preferredTop, maxTop);

      setPopover((current) => {
        if (
          !current ||
          (current.left === nextLeft && current.top === nextTop)
        ) {
          return current;
        }

        return {
          ...current,
          left: nextLeft,
          top: nextTop,
        };
      });
    };

    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [popover]);

  const openOverflowPopover = (
    args: FitListOverflowRenderArgs<Item>,
    event: React.MouseEvent<HTMLElement>
  ) => {
    const frame = frameRef.current;
    const frameShell = frameShellRef.current;
    if (!frame || !frameShell) return;

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const frameRect = frameShell.getBoundingClientRect();
    const anchorLeft = Math.max(8, triggerRect.right - frameRect.left - 46);

    setPopover((current) => {
      const isSame =
        current &&
        current.hiddenItems.length === args.hiddenItems.length &&
        current.hiddenItems.every(
          (item, index) => item.id === args.hiddenItems[index]?.id
        );

      if (isSame) {
        return null;
      }

      return {
        hiddenItems: args.hiddenItems,
        left: anchorLeft,
        top: triggerRect.bottom - frameRect.top + 10,
        anchorLeft,
        anchorTop: triggerRect.top - frameRect.top,
        anchorBottom: triggerRect.bottom - frameRect.top,
      };
    });
  };

  const mobileSliderMax =
    typeof window === "undefined"
      ? DESKTOP_FRAME_WIDTH
      : Math.max(
          MOBILE_FRAME_MIN_WIDTH,
          Math.min(DESKTOP_FRAME_WIDTH, window.innerWidth - 32)
        );

  return (
    <main className="page">
      <div className="content">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              <span className="package-name">react-fit-list</span>
            </h1>
            <p className="description">
              A headless React primitive for keeping horizontal content on one
              line by fitting what can be shown and collapsing the rest behind
              an overflow button.
            </p>
          </div>

          <div className="hero-actions" aria-label="Project links">
            <a
              className="link-pill"
              href={npmUrl}
              target="_blank"
              rel="noreferrer"
            >
              <SiNpm />
              <span>NPM</span>
            </a>
            <a
              className="link-pill"
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              <FaGithub />
              <span>GitHub</span>
            </a>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div className="frame-meta">
              <span>Try the component</span>
              <span className="width-value">{frameWidth}px</span>
            </div>
            <p className="panel-description">
              {isMobileViewport
                ? "Use the slider to preview how the list behaves at smaller widths."
                : "Drag the resize handle to test how the list fits and when the overflow button appears."}
            </p>
          </div>

          {isMobileViewport && (
            <label className="mobile-width-control">
              <span>Preview width</span>
              <input
                type="range"
                min={MOBILE_FRAME_MIN_WIDTH}
                max={mobileSliderMax}
                step={1}
                value={Math.min(mobileFrameWidth, mobileSliderMax)}
                onChange={(event) => {
                  setMobileFrameWidth(Number(event.target.value));
                  setPopover(null);
                }}
                aria-label="Preview width"
              />
            </label>
          )}

          <div ref={frameShellRef} className="example-frame-shell">
            <div
              ref={frameRef}
              className="example-frame"
              style={{
                width: isMobileViewport
                  ? `min(100%, ${Math.min(
                      mobileFrameWidth,
                      mobileSliderMax
                    )}px)`
                  : "min(100%, 360px)",
              }}
            >
              <div className="frame-toolbar" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <FitList
                items={items}
                getKey={(item) => item.id}
                gap={8}
                className="fitlist"
                overflowButtonClassName="more"
                renderItem={(item) => <Tag>{item.label}</Tag>}
                renderOverflow={({ hiddenCount }) => <>{`+${hiddenCount}`}</>}
                onOverflowClick={openOverflowPopover}
              />
            </div>

            {popover && (
              <div
                ref={popoverRef}
                className="popover"
                style={{ left: `${popover.left}px`, top: `${popover.top}px` }}
                role="dialog"
                aria-label="Hidden items"
              >
                <div className="popover-title">Hidden items</div>
                <div className="popover-list">
                  {popover.hiddenItems.map((item) => (
                    <Tag key={item.id}>{item.label}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;

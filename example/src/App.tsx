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

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}

function App() {
  const [frameWidth, setFrameWidth] = useState(320);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const frameShellRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

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
  }, []);

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

  const openOverflowPopover = (
    args: FitListOverflowRenderArgs<Item>,
    event: React.MouseEvent<HTMLElement>
  ) => {
    const frame = frameRef.current;
    const frameShell = frameShellRef.current;
    if (!frame || !frameShell) return;

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const frameRect = frameShell.getBoundingClientRect();

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
        left: Math.max(8, triggerRect.right - frameRect.left - 46),
        top: triggerRect.bottom - frameRect.top + 10,
      };
    });
  };

  return (
    <main className="page">
      <div className="content">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              <span className="package-name">react-fit-list</span>
            </h1>
            <p className="description">
              A headless React component for rendering a single-line list that
              collapses overflowing items into a <code>+N</code> indicator.
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
              Drag the resize handle to test how the list fits and when the
              overflow button appears.
            </p>
          </div>

          <div ref={frameShellRef} className="example-frame-shell">
            <div
              ref={frameRef}
              className="example-frame"
              style={{ width: "min(100%, 360px)" }}
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
                overflowClassName="more"
                renderItem={(item) => <Tag>{item.label}</Tag>}
                renderOverflow={({ hiddenCount }) => <>{`+${hiddenCount}`}</>}
                onOverflowClick={openOverflowPopover}
              />
            </div>

            {popover && (
              <div
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

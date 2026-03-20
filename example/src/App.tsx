import { useEffect, useRef, useState } from "react";
import { FitList } from "react-fit-list";
import type { FitListOverflowRenderArgs } from "react-fit-list";
import "./App.css";

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

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="link-icon">
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.589 2 12.248c0 4.528 2.865 8.37 6.839 9.727.5.096.682-.222.682-.496 0-.245-.009-.893-.014-1.752-2.782.62-3.369-1.37-3.369-1.37-.455-1.173-1.11-1.486-1.11-1.486-.908-.636.069-.624.069-.624 1.004.072 1.532 1.054 1.532 1.054.892 1.566 2.341 1.114 2.91.852.091-.664.349-1.114.635-1.37-2.22-.259-4.555-1.138-4.555-5.063 0-1.118.39-2.033 1.029-2.75-.103-.26-.446-1.302.098-2.714 0 0 .84-.277 2.75 1.05A9.303 9.303 0 0 1 12 6.838a9.27 9.27 0 0 1 2.504.346c1.909-1.327 2.748-1.05 2.748-1.05.546 1.412.202 2.454.1 2.714.64.717 1.028 1.632 1.028 2.75 0 3.935-2.339 4.801-4.566 5.055.359.318.679.943.679 1.901 0 1.372-.012 2.479-.012 2.816 0 .276.18.596.688.495C19.138 20.614 22 16.774 22 12.248 22 6.589 17.523 2 12 2Z"
      />
    </svg>
  );
}

function NpmIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="link-icon">
      <path
        fill="currentColor"
        d="M2 7.5v9h10.5v-6h3v6H22v-9H2Zm18 7.5h-2.5v-6h-7.5v6H4v-6h16v6Z"
      />
    </svg>
  );
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
              <NpmIcon />
              <span>NPM</span>
            </a>
            <a
              className="link-pill"
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon />
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

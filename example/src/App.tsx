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
        <div className="intro">
          <p className="label">react-fit-list</p>
          <h1>Simple example</h1>
          <p className="description">
            Drag the resize handle on the demo window to see items collapse into
            a single <code>+N</code> button. Click it to open a popover with the
            hidden items.
          </p>
        </div>

        <section className="panel">
          <div className="frame-meta">
            <span>Resizable container</span>
            <span className="width-value">{frameWidth}px</span>
          </div>

          <div ref={frameShellRef} className="example-frame-shell">
            <div
              ref={frameRef}
              className="example-frame"
              style={{ width: "min(100%, 320px)" }}
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

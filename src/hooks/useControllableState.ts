import { useCallback, useState } from "react";

/**
 * Shared controlled/uncontrolled state helper.
 *
 * Mirrors the common React component API pattern:
 * - pass `value` to control state externally
 * - omit `value` and use `defaultValue` for internal state
 * - observe changes through `onChange`
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  /** Controlled value. When defined, internal state is ignored. */
  value: T | undefined;
  /** Initial value used for uncontrolled state. */
  defaultValue: T;
  /** Called whenever the state setter is invoked. */
  onChange?: (next: T) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : internal;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return [current, setValue] as const;
}

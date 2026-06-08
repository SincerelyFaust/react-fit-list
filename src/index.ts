/**
 * Public package entry point.
 *
 * `FitList` provides the ready-to-use component while `useFitList` exposes the
 * underlying fitting logic for custom renderers.
 */
export { FitList } from "./components/FitList";
export { useFitList } from "./hooks/useFitList";
export type {
  TrimFrom,
  DisclosurePlacement,
  FitListMeasurementMode,
  FitListDisclosureRenderArgs,
  FitListProps,
  UseFitListOptions,
  UseFitListResult,
} from "./types";

import React, { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type CandlestickData,
  type UTCTimestamp,
  type IChartApi,
  type ISeriesApi,
  type IRange,
  type Logical,
} from "lightweight-charts";
import type { ChartCandle } from "../types/chart";

type Props = {
  data?: ChartCandle[];
  height?: number;
  className?: string;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
};

export default function CandlestickChart({
  data = [],
  height = 380,
  className,
  onLoadMore,
  isLoadingMore = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const hasFitOnceRef = useRef(false);
  const lastTriggerTsRef = useRef(0);
  const onLoadMoreRef = useRef<Props["onLoadMore"]>(onLoadMore);
  const isLoadingMoreRef = useRef<boolean>(isLoadingMore);

  // Keep latest props in refs to avoid stale closures in the event handler
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Create chart once on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: { textColor: "black", background: { type: ColorType.Solid, color: "white" } },
      width: el.clientWidth,
      height,
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    seriesRef.current = candlestickSeries;

    // Initial data set + fit content once on mount
    const safeData: ChartCandle[] = Array.isArray(data)
      ? data.filter(
          (d) =>
            typeof d?.time === "number" &&
            typeof d?.open === "number" &&
            typeof d?.high === "number" &&
            typeof d?.low === "number" &&
            typeof d?.close === "number"
        )
      : [];

    const seriesData: CandlestickData<UTCTimestamp>[] = safeData.map((d) => ({
      time: d.time as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(seriesData);
    chart.timeScale().fitContent();
    hasFitOnceRef.current = true;

    // Detect when scrolled near the start to request more data
    const THRESHOLD = 2; // logical bars from the start
    const handler = (visibleRange: IRange<Logical> | null) => {
      try {
        const cb = onLoadMoreRef.current;
        if (!cb) return;
        if (isLoadingMoreRef.current) return;
        if (!visibleRange) return;
        // If the left edge is near the beginning, request older data
        if (visibleRange.from < THRESHOLD) {
          const now = Date.now();
          // simple throttle to avoid spamming
          if (now - lastTriggerTsRef.current < 1000) return;
          lastTriggerTsRef.current = now;
          cb();
        }
      } catch {
        /* ignore - fail safe */
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handler);

    let ro: ResizeObserver | null = null;
    let removeResizeListener: (() => void) | null = null;

    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          if (width > 0) {
            chart.applyOptions({ width: Math.floor(width), height });
          }
        }
      });
      ro.observe(el);
    } else {
      // Fallback for test/jsdom or older browsers without ResizeObserver
      const onResize = () => {
        const width = el.clientWidth || 0;
        if (width > 0) {
          chart.applyOptions({ width: Math.floor(width), height });
        }
      };
      window.addEventListener("resize", onResize);
      removeResizeListener = () => window.removeEventListener("resize", onResize);
      // Trigger once to sync size
      onResize();
    }

    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      } catch {
        /* noop */
      }
      if (ro) {
        ro.disconnect();
      }
      if (removeResizeListener) {
        removeResizeListener();
      }
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      hasFitOnceRef.current = false;
    };
    // We only want to run this on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update height on prop change
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.applyOptions({ height });
    }
  }, [height]);

  // Update data without recreating chart
  useEffect(() => {
    const candlestickSeries = seriesRef.current;
    const chart = chartRef.current;
    if (!candlestickSeries || !chart) return;

    const safeData: ChartCandle[] = Array.isArray(data)
      ? data.filter(
          (d) =>
            typeof d?.time === "number" &&
            typeof d?.open === "number" &&
            typeof d?.high === "number" &&
            typeof d?.low === "number" &&
            typeof d?.close === "number"
        )
      : [];

    const seriesData: CandlestickData<UTCTimestamp>[] = safeData.map((d) => ({
      time: d.time as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(seriesData);

    // Do not auto-fit on subsequent updates to preserve user viewport
    if (!hasFitOnceRef.current) {
      chart.timeScale().fitContent();
      hasFitOnceRef.current = true;
    }
  }, [data]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height }}
      data-testid="candlestick-container"
    />
  );
}

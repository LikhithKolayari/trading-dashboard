import React, { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type CandlestickData,
  type UTCTimestamp,
  type IChartApi,
  type ISeriesApi,
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
    const handler = () => {
      try {
        const cb = onLoadMoreRef.current;
        if (!cb) return;
        if (isLoadingMoreRef.current) return;
        const range = chart.timeScale().getVisibleLogicalRange();
        if (!range) return;
        // If the left edge is near the beginning, request older data
        if (range.from < THRESHOLD) {
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

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          chart.applyOptions({ width: Math.floor(width), height });
        }
      }
    });
    ro.observe(el);

    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      } catch {
        /* noop */
      }
      ro.disconnect();
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

  return <div ref={containerRef} className={className} style={{ width: "100%", height }} />;
}

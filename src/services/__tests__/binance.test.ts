import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUIKlines } from "../binance";
import { API_URLS } from "../../constants/urls";
import type { BinanceUIKline } from "../../types/binance";

const sampleKlines: BinanceUIKline[] = [
  [
    1765626525000,
    "90399.95000000",
    "90399.95000000",
    "90399.95000000",
    "90399.95000000",
    "0.01711000",
    1765626525999,
    "1546.74314450",
    2,
    "0.00000000",
    "0.00000000",
    "0",
  ],
  [
    1765626526000,
    "90399.96000000",
    "90399.96000000",
    "90399.95000000",
    "90399.96000000",
    "0.01331000",
    1765626526999,
    "1203.22341760",
    4,
    "0.00831000",
    "751.22366760",
    "0",
  ],
];

describe("getUIKlines", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("builds correct URL and returns klines", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => sampleKlines,
    } as unknown as Response);

    const params = {
      symbol: "usdtbtc", // lowercased to verify uppercasing
      interval: "1s" as const,
      startTime: 1765626525000,
      endTime: 1765626526999,
      limit: 500,
    };

    const data = await getUIKlines(params);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);

    // Validate request URL and query params
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      API_URLS.BINANCE.BASE + API_URLS.BINANCE.UI_KLINES
    );
    expect(calledUrl.searchParams.get("symbol")).toBe("USDTBTC");
    expect(calledUrl.searchParams.get("interval")).toBe("1s");
    expect(calledUrl.searchParams.get("startTime")).toBe(String(params.startTime));
    expect(calledUrl.searchParams.get("endTime")).toBe(String(params.endTime));
    expect(calledUrl.searchParams.get("limit")).toBe("500");
  });

  it("throws on invalid symbol format", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(getUIKlines({ symbol: "BTC/USDT", interval: "1s" })).rejects.toThrow(
      /Invalid symbol format/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on invalid interval", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      // @ts-expect-error testing invalid interval
      getUIKlines({ symbol: "BTCUSDT", interval: "2m" })
    ).rejects.toThrow(/Invalid interval/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on seconds-based timestamp (should be ms)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      getUIKlines({ symbol: "BTCUSDT", interval: "1s", startTime: 1700000000 })
    ).rejects.toThrow(/Unix ms/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

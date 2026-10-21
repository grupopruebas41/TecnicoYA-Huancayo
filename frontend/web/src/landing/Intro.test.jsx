import React from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../App";
import { CONTENT_REVEAL_SECONDS } from "../video-timing";
vi.mock("../features/administration/http", () => ({ request: vi.fn(async () => ({ data: [] })) }));
let motion;
beforeEach(() => {
 vi.useFakeTimers(); window.location.hash = "#inicio";
 motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
 vi.stubGlobal("matchMedia", () => motion);
 vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
 vi.stubGlobal("scrollTo", vi.fn());
 vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
 vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test("S02-TC-089 intro muestra solo video y después transición y contenido", async () => {
 const { container } = render(<App />); await act(async () => {});
 const video = container.querySelector("video");
 expect(screen.queryByRole("banner")).toBeNull(); expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
 expect(document.body.style.overflow).toBe("hidden");
 expect(container.querySelector(".ty-fixed-background")).toHaveAttribute("data-phase", "intro");
 expect(video.play).toHaveBeenCalled();
 video.currentTime = CONTENT_REVEAL_SECONDS; fireEvent.timeUpdate(video);
 expect(container.querySelector(".ty-fixed-background")).toHaveAttribute("data-phase", "transition");
 act(() => vi.advanceTimersByTime(799)); expect(screen.queryByRole("banner")).toBeNull();
 act(() => vi.advanceTimersByTime(1)); expect(screen.getByRole("banner")).toBeVisible();
 expect(screen.getByRole("heading", { level: 1 })).toBeVisible(); expect(document.body.style.overflow).toBe("");
 video.currentTime = 0; fireEvent.timeUpdate(video); expect(screen.getByRole("banner")).toBeVisible();
});
test("S02-TC-089 reduced motion omite intro y muestra poster y contenido inmediato", async () => {
 motion.matches = true; const { container } = render(<App />); await act(async () => {});
 expect(screen.getByRole("banner")).toBeVisible(); expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
 expect(container.querySelector("video").play).not.toHaveBeenCalled(); expect(container.querySelector("video")).toHaveAttribute("hidden");
});
test("S02-TC-089 carga detenida revela contenido a los 12 segundos como máximo", async () => {
 const { container } = render(<App />); await act(async () => {});
 act(() => vi.advanceTimersByTime(11999)); expect(screen.queryByRole("banner")).toBeNull();
 act(() => vi.advanceTimersByTime(1)); expect(screen.getByRole("banner")).toBeVisible(); expect(container.querySelector("video")).toHaveAttribute("hidden");
});
test("S02-TC-089 error de video libera la intro y el scroll sin esperar más", async () => {
 const { container } = render(<App />); await act(async () => {}); fireEvent.error(container.querySelector("video"));
 act(() => vi.advanceTimersByTime(12000)); expect(screen.getByRole("banner")).toBeVisible(); expect(document.body.style.overflow).toBe("");
});

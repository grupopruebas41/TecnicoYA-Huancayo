import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import HeroBackground from "./HeroBackground";
import { CONTENT_REVEAL_SECONDS } from "../video-timing";
let notify, motion, observe, disconnect;
beforeEach(() => {
  observe = vi.fn(); disconnect = vi.fn();
  motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => motion);
  vi.stubGlobal("IntersectionObserver", vi.fn(function(callback) { notify = callback; this.observe = observe; this.disconnect = disconnect; }));
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function setup() {
  const view = render(<><HeroBackground /><section id="inicio">Hero</section></>);
  return { ...view, video: view.container.querySelector("video") };
}
async function visibility(ratio) { await act(async () => notify([{ isIntersecting: ratio > 0, intersectionRatio: ratio }])); }
test("S02-TC-089 video pausa al salir y reanuda sin reiniciar el zoom", async () => {
  const { video } = setup();
  expect(observe).toHaveBeenCalledWith(document.getElementById("inicio"));
  expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { threshold: 0.15 });
  await visibility(1);
  expect(video.play).toHaveBeenCalledTimes(1);
  video.currentTime = 6;
  await visibility(0.1);
  expect(video.pause).toHaveBeenCalled();
  await visibility(0.8);
  expect(video.play).toHaveBeenCalledTimes(2);
  expect(video.currentTime).toBe(6);
  expect(video.muted).toBe(true);
  expect(video).toHaveAttribute("playsinline");
  expect(video).toHaveAttribute("poster", "/media/landing/habitacion-estatica.webp");
});
test("S02-TC-089 movimiento reducido conserva solo el poster sin reproducir", async () => {
  motion.matches = true;
  const { video } = setup();
  await visibility(1);
  expect(video.play).not.toHaveBeenCalled();
  expect(video).toHaveAttribute("hidden");
});
test("S02-TC-089 cambio a movimiento reducido pausa y muestra poster", async () => {
  const { video } = setup(); await visibility(1);
  motion.matches = true;
  act(() => motion.addEventListener.mock.calls[0][1]());
  expect(video.pause).toHaveBeenCalled(); expect(video).toHaveAttribute("hidden");
});
test("S02-TC-089 al terminar vuelve al tramo posterior a la entrada", async () => {
  const { video } = setup(); await visibility(1);
  expect(video.currentTime).toBe(0);
  video.currentTime = 10; fireEvent.ended(video);
  expect(video.currentTime).toBe(CONTENT_REVEAL_SECONDS);
  expect(video.loop).toBe(false);
});
test("S02-TC-089 error de carga o autoplay mantiene el poster", async () => {
  HTMLMediaElement.prototype.play.mockRejectedValue(new Error("Autoplay bloqueado"));
  const { video, container } = setup(); await visibility(1);
  expect(video).toHaveAttribute("hidden");
  expect(container.querySelector("img")).toHaveAttribute("src", video.poster.replace(window.location.origin, ""));
  fireEvent.error(video); expect(video.pause).toHaveBeenCalled();
});
test("S02-TC-089 desmontar desconecta observer y listeners y pausa", async () => {
  const { unmount, video } = setup(); await visibility(1); unmount();
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(video.pause).toHaveBeenCalled();
  expect(motion.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});

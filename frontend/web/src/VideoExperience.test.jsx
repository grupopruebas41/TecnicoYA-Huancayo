import React from 'react';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import VideoExperience from './VideoExperience';
import {CONTENT_REVEAL_SECONDS} from './video-timing';

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.stubGlobal('matchMedia', vi.fn(() => ({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
  vi.stubGlobal('IntersectionObserver', class {observe() {} disconnect() {}});
});
afterEach(() => {cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});

test('shows only the video until the cue, then keeps the content through subsequent loops', () => {
  const {container} = render(<VideoExperience revealAt={CONTENT_REVEAL_SECONDS}><h1>TecnicoYa</h1><button>Solicitar atención</button></VideoExperience>);
  const video = container.querySelector('video');
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  video.currentTime = CONTENT_REVEAL_SECONDS - 1 / 24;
  fireEvent.timeUpdate(video);
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  video.currentTime = CONTENT_REVEAL_SECONDS;
  fireEvent.timeUpdate(video);
  expect(screen.getByRole('heading')).toBeVisible();
  video.currentTime = 0;
  fireEvent.timeUpdate(video);
  expect(screen.getByRole('heading')).toBeVisible();
  expect(video.loop).toBe(true);
  expect(video).toHaveAttribute('tabindex','-1');
});

test('reduced motion immediately exposes the page and pauses playback', () => {
  matchMedia.mockReturnValue({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()});
  render(<VideoExperience revealAt={CONTENT_REVEAL_SECONDS}><h1>TecnicoYa</h1></VideoExperience>);
  expect(screen.getByRole('heading')).toBeVisible();
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
});

test('video failure does not trap visitors on an empty page', () => {
  const {container} = render(<VideoExperience revealAt={CONTENT_REVEAL_SECONDS}><h1>TecnicoYa</h1></VideoExperience>);
  fireEvent.error(container.querySelector('video'));
  expect(screen.getByRole('heading')).toBeVisible();
});

test('S02-TC-089 rediseño: el video sigue al nuevo hero al volver de Nosotros',()=>{
 const observe=vi.fn();vi.stubGlobal('IntersectionObserver',class{observe=observe;disconnect(){}});
 const view=render(<VideoExperience revealAt={0}><section id="inicio">Inicio</section></VideoExperience>);
 fireEvent.error(view.container.querySelector('video'));
 expect(observe).toHaveBeenCalledWith(document.getElementById('inicio'));
 view.rerender(<VideoExperience revealAt={0}><section>Nosotros</section></VideoExperience>);
 fireEvent(window,new Event('tecnicoya:hero-change'));
 expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
 view.rerender(<VideoExperience revealAt={0}><section id="inicio">Inicio nuevo</section></VideoExperience>);
 fireEvent(window,new Event('tecnicoya:hero-change'));
 expect(observe).toHaveBeenLastCalledWith(document.getElementById('inicio'));
});

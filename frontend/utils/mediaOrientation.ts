// Utility to detect orientation of an image or video
export type Orientation = 'portrait' | 'landscape' | 'square';

export function getMediaOrientation(width: number, height: number): Orientation {
  if (width === height) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

// For <img> or <video> elements, get orientation after load
type OnOrientationCallback = (orientation: Orientation, width: number, height: number) => void;

export function detectImageOrientation(src: string, cb: OnOrientationCallback) {
  const img = new window.Image();
  img.onload = function () {
    cb(getMediaOrientation(img.naturalWidth, img.naturalHeight), img.naturalWidth, img.naturalHeight);
  };
  img.src = src;
}

export function detectVideoOrientation(src: string, cb: OnOrientationCallback) {
  const video = document.createElement('video');
  video.onloadedmetadata = function () {
    cb(getMediaOrientation(video.videoWidth, video.videoHeight), video.videoWidth, video.videoHeight);
  };
  video.src = src;
}

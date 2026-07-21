// ============================================================
// AetherPaddle II - Mobile Fullscreen & Orientation Utilities
// ============================================================

/**
 * Attempts to enter fullscreen mode on the document element.
 * Must be called from a user-gesture handler (click/tap).
 */
export async function enterFullscreen(): Promise<boolean> {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the browser is currently in fullscreen mode.
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
  );
}

/**
 * Attempts to lock orientation to landscape.
 * Must be called from a user-gesture handler and usually requires fullscreen.
 */
export async function lockLandscape(): Promise<boolean> {
  try {
    const orientation = screen.orientation as unknown as {
      lock?: (orientation: string) => Promise<void>;
    };
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
      return true;
    }
  } catch {
    // Orientation lock is not supported on all browsers (e.g. iOS Safari)
  }
  return false;
}

/**
 * Combined helper: enters fullscreen + locks landscape orientation.
 * Best-effort — silently ignores unsupported features.
 */
export async function enterFullscreenLandscape(): Promise<void> {
  const didFullscreen = await enterFullscreen();
  if (didFullscreen) {
    // Orientation lock requires fullscreen on most browsers
    await lockLandscape();
  }
}

/**
 * Returns true if the device has a coarse (touch) primary pointer.
 */
export function isMobileDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

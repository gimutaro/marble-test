const KEY_MUTE = 'marble_test_mute_v1';

export function loadMuteState() {
  try {
    const v = localStorage.getItem(KEY_MUTE);
    if (v === null) return false;
    return v === '1';
  } catch {
    return false;
  }
}

export function saveMuteState(isMuted) {
  try {
    localStorage.setItem(KEY_MUTE, isMuted ? '1' : '0');
  } catch {
    // ignore
  }
}



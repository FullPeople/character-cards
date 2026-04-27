import OBR from "@owlbear-rodeo/sdk";

// Two floating toggle buttons that sit to the LEFT of the main 角色卡
// floating button. Each toggle is a small circular button that:
//   - reads/writes a localStorage key (shared across all panels via origin)
//   - broadcasts the same TOGGLE_MSG that the previous in-panel button sent
//   - shows full-color icon when ON; greyscale icon + red diagonal slash when OFF
//
// Both keys + broadcast IDs are kept identical to the originals so the
// bestiary background.ts and character-cards background.ts pick up the
// state change without any modification.

// --- Bestiary popup toggle ---
const BEST_KEY = "com.bestiary/auto-popup";
const BEST_MSG = "com.bestiary/auto-popup-toggled";

// --- Character-card popup toggle ---
const CARD_KEY = "character-cards/auto-info";
const CARD_MSG = "com.character-cards/auto-info-toggled";

function isOn(key: string): boolean {
  try {
    return localStorage.getItem(key) !== "0"; // default ON if missing
  } catch {
    return true;
  }
}

function setOn(key: string, next: boolean) {
  try {
    localStorage.setItem(key, next ? "1" : "0");
  } catch {}
}

function applyVisual(btn: HTMLElement, on: boolean, label: string) {
  btn.classList.toggle("off", !on);
  btn.classList.toggle("on", on);
  btn.setAttribute(
    "title",
    on
      ? `${label}已开启（点击关闭）`
      : `${label}已关闭（点击开启）`
  );
}

OBR.onReady(() => {
  const togBest = document.getElementById("togBest") as HTMLButtonElement | null;
  const togCard = document.getElementById("togCard") as HTMLButtonElement | null;
  if (!togBest || !togCard) return;

  // Initial visual state from persisted value.
  applyVisual(togBest, isOn(BEST_KEY), "怪物图鉴弹窗");
  applyVisual(togCard, isOn(CARD_KEY), "角色卡弹窗");

  togBest.addEventListener("click", () => {
    const next = !isOn(BEST_KEY);
    setOn(BEST_KEY, next);
    applyVisual(togBest, next, "怪物图鉴弹窗");
    try {
      OBR.broadcast.sendMessage(BEST_MSG, {}, { destination: "LOCAL" });
    } catch {}
  });

  togCard.addEventListener("click", () => {
    const next = !isOn(CARD_KEY);
    setOn(CARD_KEY, next);
    applyVisual(togCard, next, "角色卡弹窗");
    try {
      OBR.broadcast.sendMessage(CARD_MSG, {}, { destination: "LOCAL" });
    } catch {}
  });

  // If something else (a future panel button, another browser tab) flips the
  // localStorage value we re-render so visual state stays in sync. Listening
  // to our own broadcasts isn't useful (we just sent it) but the storage
  // event fires for cross-tab updates.
  window.addEventListener("storage", (e) => {
    if (e.key === BEST_KEY) applyVisual(togBest, isOn(BEST_KEY), "怪物图鉴弹窗");
    if (e.key === CARD_KEY) applyVisual(togCard, isOn(CARD_KEY), "角色卡弹窗");
  });
});

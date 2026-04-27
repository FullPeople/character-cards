import OBR from "@owlbear-rodeo/sdk";

const POPOVER_ID = "com.character-cards/panel";
const INFO_POPOVER_ID = "com.character-cards/info";
const CONTROLS_POPOVER_ID = "com.character-cards/controls";
const BIND_MODAL_ID = "com.character-cards/bind-picker";
const PANEL_URL = "https://obr.dnd.center/character-cards/panel.html";
const INFO_URL = "https://obr.dnd.center/character-cards/info.html";
const BIND_URL = "https://obr.dnd.center/character-cards/bind.html";
const CONTROLS_URL = "https://obr.dnd.center/character-cards/controls.html";
const ICON_URL = "https://obr.dnd.center/character-cards/icon.svg";

const BIND_META = "com.character-cards/boundCardId";
const SCENE_META_KEY = "com.character-cards/list";
const AUTO_INFO_KEY = "character-cards/auto-info";      // localStorage: "1" (default) / "0"
const TOGGLE_MSG = "com.character-cards/auto-info-toggled";
const INFO_SHOW_MSG = "com.character-cards/info-show";
const INFO_HIDE_MSG = "com.character-cards/info-hide";

const POPOVER_BOX = 64;
const BOTTOM_OFFSET = 160;
const RIGHT_OFFSET = 12;

// Floating "controls" popover (two toggle buttons) sits to the LEFT of the
// main 角色卡 button. 92×48; baseline aligned with the main button's
// bottom edge; 8px horizontal gap between the two popovers.
const CONTROLS_W = 92;
const CONTROLS_H = 48;
const CONTROLS_GAP = 8;

const INFO_WIDTH = 320;
const INFO_HEIGHT = 360;
const INFO_GAP = 8; // gap between main button top and info bottom

async function openPopover() {
  try {
    const [w, h] = await Promise.all([
      OBR.viewport.getWidth(),
      OBR.viewport.getHeight(),
    ]);
    await OBR.popover.open({
      id: POPOVER_ID,
      url: PANEL_URL,
      width: POPOVER_BOX,
      height: POPOVER_BOX,
      anchorReference: "POSITION",
      anchorPosition: { left: w - RIGHT_OFFSET, top: h - BOTTOM_OFFSET },
      anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      hidePaper: true,
      disableClickAway: true,
    });
  } catch (e) {
    console.error("[character-cards] openPopover failed", e);
  }
}

async function closePopover() {
  try { await OBR.popover.close(POPOVER_ID); } catch {}
}

// --- Controls popover (弹窗 toggles) — sits to the LEFT of the main button ---
async function openControlsPopover() {
  try {
    const [w, h] = await Promise.all([
      OBR.viewport.getWidth(),
      OBR.viewport.getHeight(),
    ]);
    // Anchor (RIGHT/BOTTOM) puts the popover's bottom-right corner here, so
    // the popover spans [w - left - W, w - left] horizontally. We want its
    // RIGHT edge to be (main button left) - GAP = (w - RIGHT_OFFSET - 64) - GAP.
    const anchorLeft = w - RIGHT_OFFSET - POPOVER_BOX - CONTROLS_GAP;
    await OBR.popover.open({
      id: CONTROLS_POPOVER_ID,
      url: CONTROLS_URL,
      width: CONTROLS_W,
      height: CONTROLS_H,
      anchorReference: "POSITION",
      anchorPosition: { left: anchorLeft, top: h - BOTTOM_OFFSET },
      anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      hidePaper: true,
      disableClickAway: true,
    });
  } catch (e) {
    console.error("[character-cards] openControlsPopover failed", e);
  }
}

async function closeControlsPopover() {
  try { await OBR.popover.close(CONTROLS_POPOVER_ID); } catch {}
}

// --- Info popover (bound-card preview above the main button) ---
// Open-on-demand: the info popover only exists while a bound character is
// selected. When nothing is selected the iframe is gone entirely, so the
// 320×360 region can't block mouse events on the map. While the popover is
// already open and the player selects a different bound character, we send
// an in-place SHOW broadcast for a 0-frame content swap.

let infoPopoverOpen = false;
let currentInfoCard: string | null = null;

function isAutoInfoEnabled(): boolean {
  try {
    return localStorage.getItem(AUTO_INFO_KEY) !== "0"; // default on
  } catch {
    return true;
  }
}

async function openInfoPopoverFor(cardId: string, roomId: string) {
  if (infoPopoverOpen) return;
  try {
    const [vw, vh] = await Promise.all([
      OBR.viewport.getWidth(),
      OBR.viewport.getHeight(),
    ]);
    const buttonTop = vh - (BOTTOM_OFFSET + 48 + 8);
    const anchorTop = buttonTop - INFO_GAP;
    await OBR.popover.open({
      id: INFO_POPOVER_ID,
      url: `${INFO_URL}?cardId=${encodeURIComponent(cardId)}&roomId=${encodeURIComponent(roomId)}`,
      width: INFO_WIDTH,
      height: INFO_HEIGHT,
      anchorReference: "POSITION",
      anchorPosition: { left: vw - RIGHT_OFFSET, top: anchorTop },
      anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      hidePaper: true,
      disableClickAway: true,
    });
    infoPopoverOpen = true;
  } catch (e) {
    console.error("[character-cards] openInfoPopoverFor failed", e);
  }
}

async function closeInfoPopover() {
  try { await OBR.popover.close(INFO_POPOVER_ID); } catch {}
  infoPopoverOpen = false;
  currentInfoCard = null;
}

async function showInfoFor(cardId: string) {
  if (currentInfoCard === cardId && infoPopoverOpen) return;
  const roomId = OBR.room.id || "default";
  if (!infoPopoverOpen) {
    await openInfoPopoverFor(cardId, roomId);
  } else {
    // Already open — in-place swap, 0 frames.
    try {
      await OBR.broadcast.sendMessage(INFO_SHOW_MSG, { cardId, roomId }, { destination: "LOCAL" });
    } catch {}
  }
  currentInfoCard = cardId;
}

async function hideInfo() {
  if (!infoPopoverOpen && currentInfoCard === null) return;
  await closeInfoPopover();
}

async function getSceneCardIds(): Promise<Set<string>> {
  try {
    const meta = await OBR.scene.getMetadata();
    const list = meta[SCENE_META_KEY];
    if (Array.isArray(list)) return new Set(list.map((c: any) => c.id).filter(Boolean));
  } catch {}
  return new Set();
}

async function handleSelection(selection: string[] | undefined) {
  if (!isAutoInfoEnabled()) {
    if (currentInfoCard) await hideInfo();
    return;
  }
  if (!selection || selection.length !== 1) {
    if (currentInfoCard) await hideInfo();
    return;
  }
  let boundId: string | null = null;
  try {
    const items = await OBR.scene.items.getItems(selection);
    const m = items[0]?.metadata?.[BIND_META];
    if (typeof m === "string") boundId = m;
  } catch {}
  if (!boundId) {
    if (currentInfoCard) await hideInfo();
    return;
  }
  const known = await getSceneCardIds();
  if (!known.has(boundId)) {
    if (currentInfoCard) await hideInfo();
    return;
  }
  if (currentInfoCard === boundId) return; // already showing this card
  await showInfoFor(boundId);
}

OBR.onReady(async () => {
  // Main button popover only — info popover is opened on-demand when a bound
  // character is selected so it doesn't block mouse events when empty.
  // Controls popover (弹窗 toggles) is opened alongside the main button
  // whenever the scene is ready, so the user always has the toggle visible.
  const showIfReady = async () => {
    try {
      if (await OBR.scene.isReady()) {
        await openPopover();
        await openControlsPopover();
      } else {
        await closePopover();
        await closeInfoPopover();
        await closeControlsPopover();
      }
    } catch {}
  };
  await showIfReady();
  OBR.scene.onReadyChange(async (ready) => {
    if (ready) {
      await openPopover();
      await openControlsPopover();
    } else {
      await closePopover();
      await closeInfoPopover();
      await closeControlsPopover();
    }
  });

  // Context menu (GM only) — bind / rebind / unbind a card on a character token
  OBR.contextMenu.create({
    id: "com.character-cards/bind-menu",
    icons: [
      {
        icon: ICON_URL,
        label: "绑定角色卡",
        filter: {
          roles: ["GM"],
          every: [{ key: "type", value: "IMAGE" }],
          max: 1,
        },
      },
    ],
    onClick: async (context) => {
      const id = context.items[0]?.id;
      if (!id) return;
      try {
        await OBR.modal.open({
          id: BIND_MODAL_ID,
          url: `${BIND_URL}?itemId=${encodeURIComponent(id)}`,
          width: 360,
          height: 480,
        });
      } catch (e) {
        console.error("[character-cards] open bind modal failed", e);
      }
    },
  });

  // Track selection to auto-show the info popover for bound characters.
  OBR.player.onChange(async (player) => {
    try { await handleSelection(player.selection); } catch {}
  });

  // Initial check (in case something was already selected at load)
  try {
    const sel = await OBR.player.getSelection();
    await handleSelection(sel);
  } catch {}

  // If a player toggles the "auto info" switch, panel broadcasts this and we
  // re-evaluate the current selection.
  OBR.broadcast.onMessage(TOGGLE_MSG, async () => {
    try {
      const sel = await OBR.player.getSelection();
      await handleSelection(sel);
    } catch {}
  });

  // If the bound card entry was deleted from the scene metadata list,
  // hide the info popover.
  OBR.scene.onMetadataChange(async () => {
    if (!currentInfoCard) return;
    const known = await getSceneCardIds();
    if (!known.has(currentInfoCard)) await hideInfo();
  });

  // If the bound character item itself is deleted, close too.
  OBR.scene.items.onChange(async () => {
    if (!currentInfoCard) return;
    try {
      const sel = await OBR.player.getSelection();
      await handleSelection(sel);
    } catch {}
  });
});

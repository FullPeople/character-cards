import OBR from "@owlbear-rodeo/sdk";

const PANEL_MODAL_ID = "com.character-cards/panel";
const PANEL_URL = "https://obr.dnd.center/character-cards/panel.html";

async function openPanel() {
  try {
    await OBR.modal.open({
      id: PANEL_MODAL_ID,
      url: PANEL_URL,
      fullScreen: true,
      hidePaper: true,
      hideBackdrop: true,
    });
  } catch (e) {
    console.error("[character-cards] openPanel failed", e);
  }
}

OBR.onReady(() => {
  const btn = document.getElementById("btn") as HTMLButtonElement;
  btn?.addEventListener("click", openPanel);
});

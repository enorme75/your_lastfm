import { t } from "./i18n.js";
import { fetchJSON } from "./api.js";
import { installImageFallback, safeImageUrl } from "./dom.js";
import { formatTimestampDate } from "./dates.js";

let listenersAttached = false;

export async function loadAccount() {
  await fetchAndRenderStats();

  if (!listenersAttached) {
    setupCsvButtons();
    listenersAttached = true;
  }
}

async function fetchAndRenderStats() {
  try {
    const data = await fetchJSON("/api/user-stats", { cache: "no-store" });
    updateText("profile-username", data.username || t("account.user"));

    const avatar = document.querySelector(".profile-avatar img");
    if (avatar) {
      avatar.src = safeImageUrl(data.avatar);
      installImageFallback(avatar);
    }

    const format = number => new Intl.NumberFormat("pt-BR").format(number || 0);
    updateText("profile-total-scrobbles", format(data.totalScrobbles));
    updateText("profile-artists", format(data.uniqueArtists));
    updateText("profile-albums", format(data.uniqueAlbums));
    updateText("profile-tracks", format(data.uniqueTracks));

    if (data.joinedDate) {
      updateText("profile-joined-date", formatTimestampDate(data.joinedDate * 1000));
    }
  } catch (error) {
    console.error("Error loading account:", error);
  }
}

function updateText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function setupCsvButtons() {
  const exportButton = document.getElementById("btn-export-csv");
  exportButton?.addEventListener("click", () => {
    window.location.href = "/api/export/scrobbles";
  });

  const importButton = document.getElementById("btn-import-trigger");
  const fileInput = document.getElementById("csv-upload-input");
  if (!importButton || !fileInput) return;

  importButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const originalText = importButton.innerHTML;
    importButton.textContent = t("account.uploading");
    importButton.disabled = true;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await fetchJSON("/api/import/scrobbles", {
        method: "POST",
        body: formData
      });

      alert(
        t("account.importSuccess", { count: result.imported })
        + (result.duplicates ? ` ${t("account.duplicatesIgnored", { count: result.duplicates })}` : "")
        + (result.skipped ? ` ${t("account.skippedRows", { count: result.skipped })}` : "")
      );
      await fetchAndRenderStats();
    } catch (error) {
      alert(t("account.errorPrefix", { message: error.message }));
    } finally {
      importButton.innerHTML = originalText;
      importButton.disabled = false;
      fileInput.value = "";
    }
  });
}

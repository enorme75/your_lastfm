import { escapeAttribute, safeImageUrl } from "./dom.js";
import { t } from "./i18n.js";

const PLACEHOLDER = "https://www.beatstars.com/assets/img/placeholders/playlist-placeholder.svg";

export function renderCover({
  image,
  artist,
  album,
  size = "normal"
}) {
  const hasImage = Boolean(image);
  const imageUrl = safeImageUrl(image, PLACEHOLDER);

  return `
    <div
      class="cover-wrapper ${escapeAttribute(size)}"
      data-upload-artist="${escapeAttribute(artist)}"
      data-upload-album="${escapeAttribute(album)}"
    >
      <img
        src="${escapeAttribute(imageUrl)}"
        class="cover-img"
        alt="${escapeAttribute(`${album || "Album"} ${t("covers.coverAlt")}`)}"
        loading="lazy"
      />

      ${!hasImage ? `
        <div class="cover-overlay">
          <span>＋ ${t("covers.addCover")}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="${t("covers.uploadFor", { album })}" />
        </div>
      ` : ""}
    </div>
  `;
}

export function initCoverUploads() {
  document.querySelectorAll(".cover-wrapper input[type=file]").forEach(input => {
    if (input.dataset.initialized === "true") return;
    input.dataset.initialized = "true";

    input.addEventListener("change", async event => {
      const file = event.target.files[0];
      if (!file) return;

      const wrapper = event.target.closest(".cover-wrapper");
      const artist = wrapper?.dataset.uploadArtist;
      const album = wrapper?.dataset.uploadAlbum;
      if (!wrapper || !artist || !album) return;

      const form = new FormData();
      form.append("artist", artist);
      form.append("album", album);
      form.append("cover", file);

      wrapper.classList.add("uploading");
      input.disabled = true;

      try {
        const response = await fetch("/api/album-cover", {
          method: "POST",
          body: form
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || t("covers.uploadFailed"));
        }

        wrapper.innerHTML = `
          <img
            src="${escapeAttribute(safeImageUrl(data.image, PLACEHOLDER))}"
            class="cover-img"
            alt="${escapeAttribute(`${album} cover`)}"
            loading="lazy"
          />
        `;
      } catch (error) {
        console.error("Cover upload error:", error);
        alert(error.message);
      } finally {
        wrapper.classList.remove("uploading");
        input.disabled = false;
        input.value = "";
      }
    });
  });
}

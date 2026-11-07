export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `sync-toast ${type}`;
  toast.textContent = message;

  document.getElementById("toast-container")?.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

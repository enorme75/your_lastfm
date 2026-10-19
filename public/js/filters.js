import { t } from "./i18n.js";
import { escapeHTML } from "./dom.js";

let activeRange = "week";

export function buildQuery(extra = {}) {
  const params = new URLSearchParams();

  if (activeRange) {
    params.append("range", activeRange);
  } else {
    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;

    if (year) params.append("year", year);
    if (month) params.append("month", month);
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  return params.toString() ? `?${params.toString()}` : "";
}

export function initFilters(onChange) {
  const yearSelect = document.getElementById("year");
  const monthSelect = document.getElementById("month");
  const currentYear = new Date().getFullYear();

  yearSelect.innerHTML = `<option value="">${escapeHTML(t("dashboard.all"))}</option>`;
  for (let year = currentYear; year >= 2002; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }

  document.querySelector('.range-pill[data-range="week"]')?.classList.add("active");

  function handleManualChange() {
    activeRange = "";
    document.querySelectorAll(".range-pill")
      .forEach(button => button.classList.remove("active"));

    onChange();
  }

  yearSelect.addEventListener("change", handleManualChange);
  monthSelect.addEventListener("change", handleManualChange);

  document.querySelectorAll(".range-pill").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".range-pill")
        .forEach(item => item.classList.remove("active"));
      button.classList.add("active");

      activeRange = button.dataset.range;
      yearSelect.value = "";
      monthSelect.value = "";
      onChange();
    });
  });
}

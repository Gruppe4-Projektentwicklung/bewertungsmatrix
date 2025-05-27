document.addEventListener("DOMContentLoaded", () => {
  const metriken = JSON.parse(document.getElementById("metriken-json").textContent);  // sicherer Import
  const container = document.getElementById("metriken-container");
  const ergebnisListe = document.getElementById("ergebnis-liste");

  metriken.forEach((metrik) => {
    const div = document.createElement("div");
    div.className = "metrik-eintrag";
    div.innerHTML = `
      <label>${metrik.titel}
        <span class="info-button" data-info="${metrik.beschreibung}">i</span>
      </label>
      <div class="gewichtung-gruppe">
        ${[0, 1, 2, 3, 4, 5].map(v => `
          <label><input type="radio" name="${metrik.id}" value="${v}" ${v === 3 ? "checked" : ""}/> ${v}</label>
        `).join("")}
      </div>
    `;
    container.appendChild(div);
  });

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("info-button")) {
      alert(e.target.dataset.info);
    }
  });

  document.getElementById("bewertungs-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const gewichtungen = {};
    metriken.forEach(m => {
      const val = document.querySelector(`input[name='${m.id}']:checked`);
      gewichtungen[m.id] = parseInt(val?.value || 0);
    });

    const res = await fetch("/bewerten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gewichtungen })
    });

    const daten = await res.json();
    ergebnisListe.innerHTML = "";
    daten.forEach((idee, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${index + 1}. ${idee.idee}</strong> – Score: ${idee.score.toFixed(2)}
        <span class="info-button">i</span>`;
      const detail = document.createElement("div");
      detail.className = "ergebnis-details";
      detail.innerHTML = "<table><thead><tr><th>Kombination</th><th>Wert</th><th>Einheit</th></tr></thead><tbody>" +
        idee.kombis.map(k => `<tr><td>${k.titel}</td><td>${k.wert}</td><td>${k.einheit}</td></tr>`).join("") +
        "</tbody></table>";
      li.appendChild(detail);
      ergebnisListe.appendChild(li);
    });
  });
});

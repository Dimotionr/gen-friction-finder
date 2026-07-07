const results = document.getElementById("results");
const odInput = document.getElementById("od");
const teethInput = document.getElementById("teeth");
const modelInput = document.getElementById("model");
const resetBtn = document.getElementById("reset");

let frictionData = [];

async function loadData() {
  try {
    const response = await fetch("data/friction.json");
    frictionData = await response.json();
    render();
  } catch (error) {
    results.innerHTML = `<p class="empty">Ошибка загрузки базы data/friction.json</p>`;
  }
}

function render() {
  const od = parseFloat(odInput.value);
  const teeth = parseInt(teethInput.value);
  const model = modelInput.value.trim().toLowerCase();

  const filtered = frictionData
    .filter(item => {
      const odMatch = isNaN(od) || Math.abs(item.od - od) <= 2;
      const teethMatch = isNaN(teeth) || item.teeth === teeth;
      const modelMatch = !model || item.model.toLowerCase().includes(model);
      return odMatch && teethMatch && modelMatch;
    })
    .sort((a, b) => a.od - b.od || a.teeth - b.teeth);

  if (!filtered.length) {
    results.innerHTML = `<p class="empty">Совпадений не найдено</p>`;
    return;
  }

  results.innerHTML = filtered.map(item => `
    <article class="card">
      <h2>${item.od} мм — ${item.teeth} зубьев</h2>
      <p><b>АКПП:</b> ${item.model || "—"}</p>
      <p><b>Пакет:</b> ${item.pack || "—"}</p>
      <p class="meta"><b>OEM:</b> ${item.oem || "—"}</p>
      <p class="meta"><b>Lintex:</b> ${item.lintex || "—"}</p>
      <p class="meta"><b>Raybestos:</b> ${item.raybestos || "—"}</p>
      <p class="meta"><b>Alto:</b> ${item.alto || "—"}</p>
      <p class="meta"><b>BW:</b> ${item.bw || "—"}</p>
      <p class="meta"><b>Примечание:</b> ${item.note || "—"}</p>
    </article>
  `).join("");
}

[odInput, teethInput, modelInput].forEach(input => {
  input.addEventListener("input", render);
});

resetBtn.addEventListener("click", () => {
  odInput.value = "";
  teethInput.value = "";
  modelInput.value = "";
  render();
});

loadData();

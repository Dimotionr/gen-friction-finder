const els = {
  od: document.getElementById("od"),
  tol: document.getElementById("tol"),
  teeth: document.getElementById("teeth"),
  model: document.getElementById("model"),
  pack: document.getElementById("pack"),
  reset: document.getElementById("reset"),
  results: document.getElementById("results"),
  summary: document.getElementById("summary")
};

let data = [];

async function loadData() {
  try {
    const response = await fetch("./data/friction.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("friction.json должен быть массивом");
    }

    render();
  } catch (error) {
    els.summary.textContent = "";
    els.results.innerHTML = `
      <div class="empty">
        Ошибка загрузки базы: data/friction.json<br>
        Проверьте имя файла, папку data и правильность JSON.
      </div>
    `;
    console.error(error);
  }
}

function includesText(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function render() {
  const od = Number.parseFloat(els.od.value);
  const tol = Number.parseFloat(els.tol.value);
  const teeth = Number.parseInt(els.teeth.value, 10);
  const model = els.model.value.trim().toLowerCase();
  const pack = els.pack.value.trim().toLowerCase();

  const filtered = data
    .filter(item => {
      const itemOd = Number(item.od);
      const itemTeeth = Number(item.teeth);

      const odOk = Number.isNaN(od) || Math.abs(itemOd - od) <= tol;
      const teethOk = Number.isNaN(teeth) || itemTeeth === teeth;
      const modelOk = !model || includesText(item.model, model);
      const packOk = !pack || includesText(item.pack, pack);

      return odOk && teethOk && modelOk && packOk;
    })
    .sort((a, b) => Number(a.od) - Number(b.od) || Number(a.teeth) - Number(b.teeth));

  els.summary.textContent = `Записей в базе: ${data.length}. Найдено: ${filtered.length}.`;

  if (!filtered.length) {
    els.results.innerHTML = `<div class="empty">Совпадений не найдено</div>`;
    return;
  }

  els.results.innerHTML = filtered.map(cardTemplate).join("");
}

function value(v) {
  return v === undefined || v === null || v === "" ? "—" : v;
}

function statusClass(status) {
  if (String(status).toLowerCase().includes("провер")) return "status-ok";
  if (String(status).toLowerCase().includes("нет")) return "status-no";
  return "";
}

function cardTemplate(item) {
  return `
    <article class="card">
      <h2>${value(item.od)} мм — ${value(item.teeth)} зубьев</h2>
      <div class="row"><div class="key">АКПП</div><div>${value(item.model)}</div></div>
      <div class="row"><div class="key">Пакет</div><div>${value(item.pack)}</div></div>
      <div class="row"><div class="key">OEM</div><div>${value(item.oem)}</div></div>
      <div class="row"><div class="key">Lintex</div><div>${value(item.lintex)}</div></div>
      <div class="row"><div class="key">Raybestos</div><div>${value(item.raybestos)}</div></div>
      <div class="row"><div class="key">Alto</div><div>${value(item.alto)}</div></div>
      <div class="row"><div class="key">BorgWarner</div><div>${value(item.bw)}</div></div>
      <div class="row"><div class="key">Статус</div><div class="${statusClass(item.status)}">${value(item.status)}</div></div>
      <div class="row"><div class="key">Примечание</div><div>${value(item.note)}</div></div>
    </article>
  `;
}

["input", "change"].forEach(eventName => {
  [els.od, els.tol, els.teeth, els.model, els.pack].forEach(el => {
    el.addEventListener(eventName, render);
  });
});

els.reset.addEventListener("click", () => {
  els.od.value = "";
  els.tol.value = "1";
  els.teeth.value = "";
  els.model.value = "";
  els.pack.value = "";
  render();
});

loadData();

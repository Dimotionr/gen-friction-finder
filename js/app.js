const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcDqRLGwXAzSVGO3a2PqcGRrq2EaGZL6J62oGJAW1B3PJNo0PsoAB4URLtCtvjg_kFFpKg8tUpJA9Q/pub?gid=0&single=true&output=csv";

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
    const response = await fetch(SHEET_CSV_URL + "&cache=" + Date.now());

    if (!response.ok) {
      throw new Error("CSV load error: " + response.status);
    }

    const csvText = await response.text();
    data = csvToObjects(csvText);

    render();
  } catch (error) {
    els.summary.textContent = "";
    els.results.innerHTML = `
      <div class="empty">
        Ошибка загрузки Google Sheets CSV.<br>
        Проверьте, что таблица опубликована в интернете как CSV.
      </div>
    `;
    console.error(error);
  }
}

function csvToObjects(csv) {
  const rows = parseCSV(csv);
  const headers = rows.shift().map(h => h.trim());

  return rows
    .filter(row => row.some(cell => String(cell).trim() !== ""))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });

      return {
        id: obj["ID"],
        od: Number(obj["OD"]),
        teeth: Number(obj["Teeth"]),
        idmm: obj["ID mm"],
        thickness: obj["Thickness"],
        model: obj["Transmission"],
        family: obj["Family"],
        pack: obj["Pack"],
        oem: obj["OEM"],
        lintex: obj["Lintex"],
        alto: obj["Alto"],
        raybestos: obj["Raybestos"],
        bw: obj["BorgWarner"],
        vehicle: obj["Vehicle"],
        years: obj["Years"],
        material: obj["Material"],
        source: obj["Source"],
        status: obj["Status"],
        photo: obj["Photo"],
        note: obj["Notes"]
      };
    });
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      }
      if (char === "\r" && next === "\n") i++;
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
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
      const odOk = Number.isNaN(od) || Math.abs(Number(item.od) - od) <= tol;
      const teethOk = Number.isNaN(teeth) || Number(item.teeth) === teeth;
      const modelOk = !model || includesText(item.model, model);
      const packOk = !pack || includesText(item.pack, pack);

      return odOk && teethOk && modelOk && packOk;
    })
    .sort((a, b) => Number(a.od) - Number(b.od) || Number(a.teeth) - Number(b.teeth));

  els.summary.textContent = `Источник: Google Sheets. Записей в базе: ${data.length}. Найдено: ${filtered.length}.`;

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
  const s = String(status).toLowerCase();

  if (s.includes("verified") || s.includes("confirmed") || s.includes("провер")) {
    return "status-ok";
  }

  if (s.includes("checking") || s.includes("unknown")) {
    return "status-no";
  }

  return "";
}

function cardTemplate(item) {
  return `
    <article class="card">
      <h2>${value(item.od)} мм — ${value(item.teeth)} зубьев</h2>

      <div class="row"><div class="key">ID</div><div>${value(item.id)}</div></div>
      <div class="row"><div class="key">АКПП</div><div>${value(item.model)}</div></div>
      <div class="row"><div class="key">Family</div><div>${value(item.family)}</div></div>
      <div class="row"><div class="key">Пакет</div><div>${value(item.pack)}</div></div>
      <div class="row"><div class="key">Толщина</div><div>${value(item.thickness)}</div></div>
      <div class="row"><div class="key">ID mm</div><div>${value(item.idmm)}</div></div>

      <div class="row"><div class="key">OEM</div><div>${value(item.oem)}</div></div>
      <div class="row"><div class="key">Lintex</div><div>${value(item.lintex)}</div></div>
      <div class="row"><div class="key">Alto</div><div>${value(item.alto)}</div></div>
      <div class="row"><div class="key">Raybestos</div><div>${value(item.raybestos)}</div></div>
      <div class="row"><div class="key">BorgWarner</div><div>${value(item.bw)}</div></div>

      <div class="row"><div class="key">Авто</div><div>${value(item.vehicle)}</div></div>
      <div class="row"><div class="key">Годы</div><div>${value(item.years)}</div></div>
      <div class="row"><div class="key">Источник</div><div>${value(item.source)}</div></div>
      <div class="row"><div class="key">Статус</div><div class="${statusClass(item.status)}">${value(item.status)}</div></div>
      <div class="row"><div class="key">Заметки</div><div>${value(item.note)}</div></div>
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

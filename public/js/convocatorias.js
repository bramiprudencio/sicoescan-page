import { db } from './firebase.js';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

async function showProcesos(container) {
  container.innerHTML = `
    <div class="convocatoria-filters">
      <select id="gestion-select"></select>
      <select id="mes-select">
        <option value=-1 selected>Todos</option>
        <option value=0>Enero</option>
        <option value=1>Febrero</option>
        <option value=2>Marzo</option>
        <option value=3>Abril</option>
        <option value=4>Mayo</option>
        <option value=5>Junio</option>
        <option value=6>Julio</option>
        <option value=7>Agosto</option>
        <option value=8>Septiembre</option>
        <option value=9>Octubre</option>
        <option value=10>Noviembre</option>
        <option value=11>Diciembre</option>
      </select>
      <button id="buscar-btn">Buscar</button>
    </div>
    <div id="convocatorias-table" style="margin-top: 20px;"></div>
  `;

  setupFilters(container);
  await fetchConvocatorias(container);
}

// Nombres amigables
const columnNames = {
  id: "CUCE",
  cod_entidad: "Entidad",
  estado: "Estado del proceso",
  objeto: "Objeto de contratación",
  subasta: "Subasta",
  modalidad: "Modalidad",
  garantias: "Garantías",
  tipo_contratacion: "Tipo de contratación",
  fecha_publicacion: "Inicio del proceso de contratación",
  fecha_presentacion: "Presentación de propuestas/ofertas",
  fecha_adjudicacion: "Adjudicación",
  fecha_formalizacion: "Formalización del proceso",
  fecha_entrega: "Entrega definitiva",
  destacado: "Destacado",
  forms: "Forms"
};

const item_columnNames = {
  cod_catalogo: "Código de catálogo",
  descripcion: "Descripción del item",
  cantidad_solicitada: "Cantidad solicitada",
  cantidad_recepcionada: "Cantidad recepcionada",
  medida: "Unidad de medida",
  precio_referencial: "Precio referencial",
  precio_adjudicado: "Precio adjudicado",
  precio_referencial_total: "Monto total referencial",
  precio_adjudicado_total: "Monto total adjudicado",
  proponente_nombre: "Proponente adjudicado",
  margen: "Margen de preferencia",
  destacado: "Destacado",
  fecha_publicacion: "Fecha de publicación"
};

// Populate year filter
function setupFilters(container) {
  const gestionEl = container.querySelector('#gestion-select');
  const mesEl = container.querySelector('#mes-select');
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 2020; year--) {
    let option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    gestionEl.appendChild(option);
  }
  gestionEl.value = currentYear;
  mesEl.value = -1;
  container.querySelector('#buscar-btn').addEventListener('click', () => fetchConvocatorias(container));
}

async function fetchConvocatorias(container) {
  const gestion = container.querySelector('#gestion-select').value;
  const mes = container.querySelector('#mes-select').value;
  console.log("Fetching convocatorias for year:", gestion, "month:", mes);

  let q = collection(db, 'convocatorias');

  const startDate = new Date(gestion, mes.value === "-1" ? 0 : parseInt(mes), 1);
  const endDate = mes.value === "-1"
    ? new Date(parseInt(gestion) + 1, 0, 1)
    : new Date(parseInt(gestion), parseInt(mes) + 1, 1);
  console.log("Fetching convocatorias from", startDate, "to", endDate);
  q = query(
    q,
    where('fecha_publicacion', '>=', startDate),
    where('fecha_publicacion', '<', endDate),
    orderBy('fecha_publicacion', 'asc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log("Fetched convocatorias:", data);
  renderConvocatorias(data);
}

async function fetchItems(row, doc, table) {
  if (row.nextSibling && row.nextSibling.classList?.contains("subtable-row")) {
    let subRow = row.nextSibling;
    subRow.style.maxHeight = "0";
    setTimeout(() => subRow.remove(), 300);
    return;
  }

  const subSnapshot = await getDocs(
    query(
      collection(db, "items"),
      where("cuce", "==", doc.id)
    )
  );
  const subData = subSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  let subRow = table.insertRow(row.rowIndex + 1);
  subRow.classList.add("subtable-row");

  let subCell = subRow.insertCell();
  subCell.colSpan = Object.keys(doc).length;
  subCell.style.padding = "0";
  subCell.style.overflow = "hidden";
  subCell.style.transition = "max-height 0.3s ease";
  subCell.style.maxHeight = "0";

  let subTable = buildSubtable(subData);
  subCell.appendChild(subTable);

  requestAnimationFrame(() => {
    subCell.style.maxHeight = subCell.scrollHeight + "px";
  });
}

// Get entity name
async function fetchEntidad(cod) {
  const snapshot = await getDoc(doc(db, "entidades", cod)); 
  if (!snapshot.exists) return cod;
  const data = snapshot.data(); 
  return data.nombre || cod;
}

// Render main table  
function renderConvocatorias(data) {

  const container = document.getElementById("convocatorias-table");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>No documents found.</p>";
    return;
  }

  let table = document.createElement("table");
  table.classList.add("styled-table");
  table.style.borderCollapse = "collapse";
  table.style.margin = "auto";

  // Header
  let header = table.insertRow();
  Object.keys(columnNames).forEach(key => {
    let th = document.createElement("th");
    th.style.padding = "8px";
    th.textContent = columnNames[key];
    header.appendChild(th);
  });

  // Rows
  data.forEach(doc => {
    let row = table.insertRow();
    row.style.cursor = "pointer";
    row.dataset.docId = doc.id;

    Object.keys(columnNames).forEach(key => {
      let cell = row.insertCell();
      cell.style.padding = "8px";
      fillCell(cell, key, doc);
    });

    // Subtable toggle
    row.addEventListener("click", () => fetchItems(row, doc, table));
  });

  container.appendChild(table);
}

// Fill each cell
function fillCell(cell, key, doc) {
  if (key === "cod_entidad") {
    cell.textContent = "Cargando…";
    fetchEntidad(doc[key]).then(nombre => cell.textContent = nombre);
  } else if (key === "estado") {
    cell.textContent = doc[key] && doc[key].length > 100 ? doc[key] : "Publicado";
  } else if (key.startsWith("fecha_") && doc[key] && typeof doc[key].toDate === "function") {
    cell.textContent = doc[key].toDate().toISOString().split("T")[0];
  } else if ((key === "objeto" || key === "garantias") && typeof doc[key] === "string") {
    cell.textContent = doc[key].length > 80 ? doc[key].substring(0, 80) + "…" : doc[key];
    cell.title = doc[key];
  } else if (typeof doc[key] === "boolean") {
    cell.textContent = doc[key] ? "Sí" : "No";
  } else if (key === "forms") {
    doc[key].forEach(form => {
      const link = document.createElement("a");
      link.href = form.url || `https://storage.googleapis.com/sicoescan/forms/${doc.id}_FORM${form}.html`;
      link.textContent = 'FORM' + form.split('_')[0];
      link.target = "_blank";
      cell.appendChild(link);
      cell.appendChild(document.createElement("br"));
    }
    );
  } else {
    cell.textContent = doc[key] || "";
  }
}

// Build subtable HTML
function buildSubtable(subData) {
  let subTable = document.createElement("table");
  subTable.style.margin = "10px auto";
  subTable.style.marginLeft = "50px";
  subTable.style.borderCollapse = "collapse";
  subTable.border = "1";

  if (subData.length > 0) {
    let subHeader = subTable.insertRow();
    Object.keys(item_columnNames).forEach(key => {
      let th = document.createElement("th");
      th.style.padding = "5px";
      th.textContent = item_columnNames[key];
      subHeader.appendChild(th);
    });

    subData.forEach(sd => {
      let subRowData = subTable.insertRow();
      Object.keys(item_columnNames).forEach(v => {
        let td = subRowData.insertCell();
        td.style.padding = "5px";
        td.textContent = sd[v] || "";
      });
    });
  } else {
    let emptyRow = subTable.insertRow();
    let td = emptyRow.insertCell();
    td.textContent = "No se encontraron bienes ni servicios";
    td.style.textAlign = "center";  
    td.style.padding = "5px";
  }
  return subTable;
}

export { showProcesos };
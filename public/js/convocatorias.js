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
  // 1. Inject Main HTML + MODAL HTML
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
    
    <div id="convocatorias-table" style="margin-top: 20px; overflow-x: auto;"></div>

    <div id="form-modal" class="modal-overlay" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <span id="modal-title" class="modal-title">Vista Previa</span>
          <button id="close-modal-btn" class="close-modal-btn">&times;</button>
        </div>
        <iframe id="form-iframe" class="modal-iframe" src=""></iframe>
      </div>
    </div>
  `;

  setupFilters(container);
  setupModal(container);
  await fetchConvocatorias(container);
}

// --- MODAL LOGIC ---
function setupModal(container) {
  const modal = container.querySelector('#form-modal');
  const closeBtn = container.querySelector('#close-modal-btn');
  const iframe = container.querySelector('#form-iframe');

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    iframe.src = "";
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      iframe.src = "";
    }
  });
}

function openFormModal(url, title) {
  const modal = document.getElementById('form-modal');
  const iframe = document.getElementById('form-iframe');
  const titleSpan = document.getElementById('modal-title');

  if (modal && iframe) {
    titleSpan.textContent = title || "Vista Previa del Formulario";
    iframe.src = url;
    modal.style.display = 'flex';
  }
}

// Nombres amigables
const columnNames = {
  id: "CUCE",
  cod_entidad: "Entidad",
  estado: "Estado", 
  objeto: "Objeto de contratación",
  subasta: "Subasta",
  modalidad: "Modalidad",
  garantias: "Garantías",
  tipo_contratacion: "Tipo", 
  fecha_publicacion: "Inicio", 
  fecha_presentacion: "Presentación", 
  fecha_adjudicacion: "Adjudicación",
  fecha_formalizacion: "Formalización",
  fecha_entrega: "Entrega",
  destacado: "Destacado",
  forms: "Forms"
};

// --- CONFIG: MAIN TABLE WIDTHS ---
const mainColumnWidths = {
  id: "200px",           // <--- UPDATED: Wide enough for 22+ chars (CUCE)
  cod_entidad: "250px",  
  objeto: "350px",       
  garantias: "250px",
  estado: "110px",
  modalidad: "180px",
  forms: "120px",
  default: "140px"      
};

const item_columnNames = {
  cod_catalogo: "Código",
  descripcion: "Descripción del item",
  cantidad_solicitada: "Cant. Sol.",
  cantidad_recepcionada: "Cant. Rec.",
  medida: "Unidad",
  precio_referencial: "P. Ref.",
  precio_adjudicado: "P. Adj.",
  precio_referencial_total: "Total Ref.",
  precio_adjudicado_total: "Total Adj.",
  proponente_nombre: "Proponente",
  margen: "Margen",
  destacado: "Destacado",
  fecha_publicacion: "Fecha"
};

// --- CONFIG: SUB TABLE WIDTHS ---
const subColumnWidths = {
  descripcion: "350px",
  proponente_nombre: "250px",
  default: "120px"
};

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
  
  let q = collection(db, 'convocatorias');

  const startDate = new Date(gestion, mes === "-1" ? 0 : parseInt(mes), 1);
  const endDate = mes === "-1"
    ? new Date(parseInt(gestion) + 1, 0, 1)
    : new Date(parseInt(gestion), parseInt(mes) + 1, 1);
  
  q = query(
    q,
    where('fecha_publicacion', '>=', startDate),
    where('fecha_publicacion', '<', endDate),
    orderBy('fecha_publicacion', 'asc'),
    limit(50)
  );

  try {
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderConvocatorias(data);
  } catch (error) {
    console.error("Error fetching convocatorias:", error);
  }
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
  subCell.colSpan = Object.keys(columnNames).length; 
  subCell.style.padding = "0";
  subCell.style.overflow = "hidden";
  subCell.style.transition = "max-height 0.3s ease";
  subCell.style.maxHeight = "0";
  subCell.style.backgroundColor = "#f9f9f9"; 

  let subTable = buildSubtable(subData);
  subCell.appendChild(subTable);

  requestAnimationFrame(() => {
    subCell.style.maxHeight = subCell.scrollHeight + "px";
  });
}

async function fetchEntidad(cod) {
  try {
    const snapshot = await getDoc(doc(db, "entidades", cod)); 
    if (!snapshot.exists) return cod;
    const data = snapshot.data(); 
    return data.nombre || cod;
  } catch (e) {
    return cod;
  }
}

// Render main table  
function renderConvocatorias(data) {
  const container = document.getElementById("convocatorias-table");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p style='padding:20px; text-align:center;'>No documents found.</p>";
    return;
  }

  let table = document.createElement("table");
  table.classList.add("styled-table");
  table.style.borderCollapse = "collapse";
  table.style.margin = "0"; 
  table.style.width = "100%"; 

  let header = table.insertRow();
  Object.keys(columnNames).forEach(key => {
    let th = document.createElement("th");
    th.textContent = columnNames[key];
    th.style.padding = "10px";
    th.style.backgroundColor = "#f1f1f1";
    th.style.textAlign = "left";
    th.style.position = "sticky";
    th.style.top = "0";
    th.style.zIndex = "10";
    
    // Widths
    const width = mainColumnWidths[key] || mainColumnWidths.default;
    th.style.minWidth = width;
    th.style.maxWidth = width;
    
    header.appendChild(th);
  });

  data.forEach(doc => {
    let row = table.insertRow();
    row.style.cursor = "pointer";
    row.style.borderBottom = "1px solid #ddd";
    row.dataset.docId = doc.id;
    
    row.addEventListener('mouseover', () => row.style.backgroundColor = '#eef5ff');
    row.addEventListener('mouseout', () => row.style.backgroundColor = 'transparent');

    Object.keys(columnNames).forEach(key => {
      let cell = row.insertCell();
      cell.style.padding = "12px 8px"; // Vertical padding
      
      const width = mainColumnWidths[key] || mainColumnWidths.default;
      cell.style.maxWidth = width;

      // Text wrapping settings
      cell.style.whiteSpace = "normal";    
      cell.style.wordBreak = "break-word"; 
      cell.style.verticalAlign = "top";    

      fillCell(cell, key, doc);
    });

    row.addEventListener("click", (e) => {
        if (!e.target.closest('.form-link')) {
            fetchItems(row, doc, table)
        }
    });
  });

  container.appendChild(table);
}

function fillCell(cell, key, doc) {
  if (key === "cod_entidad") {
    cell.textContent = "Cargando…";
    fetchEntidad(doc[key]).then(nombre => {
        cell.textContent = nombre;
        cell.title = nombre; 
    });
  } else if (key === "estado") {
    const val = doc[key] || "Publicado";
    cell.textContent = val;
  } else if (key.startsWith("fecha_") && doc[key] && typeof doc[key].toDate === "function") {
    cell.textContent = doc[key].toDate().toISOString().split("T")[0];
  } else if (key === "objeto" || key === "garantias") {
    const text = typeof doc[key] === "string" ? doc[key] : "";
    cell.textContent = text;
  } else if (typeof doc[key] === "boolean") {
    cell.textContent = doc[key] ? "Sí" : "No";
  } else if (key === "forms" && Array.isArray(doc[key])) {
    doc[key].forEach((form, index) => {
      const formUrl = form.url || `https://storage.googleapis.com/sicoescan/forms/${doc.id}_FORM${form}.html`;
      const formName = 'F' + form.split('_')[0];

      const link = document.createElement("a");
      link.href = "#"; 
      link.textContent = formName;
      link.className = "form-link"; 
      
      link.style.color = "#415A77";
      link.style.fontWeight = "bold";
      link.style.marginRight = "6px";
      link.style.cursor = "pointer";
      link.style.display = "inline-block"; 
      link.style.marginBottom = "4px";     
      
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        openFormModal(formUrl, `${doc.id} - ${formName}`);
      });
      
      cell.appendChild(link);
    });
  } else {
    cell.textContent = doc[key] || "";
  }
}

// Build subtable HTML
function buildSubtable(subData) {
  let subTable = document.createElement("table");
  subTable.style.width = "95%";
  subTable.style.margin = "10px auto";
  subTable.style.borderCollapse = "collapse";
  subTable.style.border = "1px solid #ddd";
  subTable.style.backgroundColor = "white";

  if (subData.length > 0) {
    let subHeader = subTable.insertRow();
    Object.keys(item_columnNames).forEach(key => {
      let th = document.createElement("th");
      th.style.padding = "5px";
      th.style.backgroundColor = "#e0e0e0";
      th.style.fontSize = "12px";
      th.style.textAlign = "left";
      th.textContent = item_columnNames[key];
      
      const width = subColumnWidths[key] || subColumnWidths.default;
      th.style.maxWidth = width;
      
      subHeader.appendChild(th);
    });

    subData.forEach(sd => {
      let subRowData = subTable.insertRow();
      Object.keys(item_columnNames).forEach(key => {
        let td = subRowData.insertCell();
        td.style.padding = "8px 5px"; 
        td.style.fontSize = "12px";
        
        const width = subColumnWidths[key] || subColumnWidths.default;
        td.style.maxWidth = width;

        td.style.whiteSpace = "normal";
        td.style.wordBreak = "break-word";
        td.style.verticalAlign = "top";
        
        let val = sd[key] || "";
        if(key.includes("precio") || key.includes("monto")) {
             try { val = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val); } catch(e){}
        }
        
        td.textContent = val;
      });
    });
  } else {
    let emptyRow = subTable.insertRow();
    let td = emptyRow.insertCell();
    td.textContent = "No se encontraron bienes ni servicios";
    td.style.textAlign = "center";  
    td.style.padding = "10px";
  }
  return subTable;
}

export { showProcesos };
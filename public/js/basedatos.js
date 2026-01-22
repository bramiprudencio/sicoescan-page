import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  startAfter,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const FIRESTORE_COLLECTION = "items";
const PAGE_SIZE = 100;

let currentPage = 0;
let lastVisibleDoc = null;
let pagesStack = [];
let descripcion_tags = [];
let entidad_tags = [];
let proponente_tags = [];

const client = new Typesense.Client({
  nodes: [{ host: "typesense.sicoescan.com", port: "443", protocol: "https" }],
  apiKey: "dgZ9CLmxWj1HusB0yb1TOULJ2sVU2xF7", 
  connectionTimeoutSeconds: 2
});

async function showBasedatos(container) {
  container.innerHTML = `
    <div id="basedatos-layout" style="display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; width: 100%;">
      <div id="basedatos-filtros">
        <select id="gestion-select"><option disabled>Gestión</option></select>
        <select id="mes-select">
          <option disabled>Mes</option>
          <option value=-1 selected>Todos los meses</option>
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
        <select id="departamento-select" class="border p-2 rounded w-full">
            <option disabled selected>Departamento</option>
            <option value="Todos" selected>Todos los departamentos</option>
            <option value="Chuquisaca">Chuquisaca</option>
            <option value="La Paz">La Paz</option>
            <option value="Cochabamba">Cochabamba</option>
            <option value="Oruro">Oruro</option>
            <option value="Potosí">Potosí</option>
            <option value="Tarija">Tarija</option>
            <option value="Santa Cruz">Santa Cruz</option>
            <option value="Beni">Beni</option>
            <option value="Pando">Pando</option>
        </select>
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="position: relative; width: 100%;"> 
                <input type="search" id="entidad_nombre" class="border p-2 rounded w-full"
                  placeholder="Entidad" autocomplete="off" style="width: 100%; box-sizing: border-box;" />
                <div id="entidad_nombre_sugerencias" class="sugerencias hidden-empty" 
                     style="position: absolute; top: 100%; left: 0; width: 100%; background: white; border: 1px solid #ccc; z-index: 1000; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                </div>
            </div>
            <div id="entidad_tags_container" class="tags-container" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="position: relative; width: 100%;">
                <input type="search" id="input_filtro_p" name="input_filtro_p" class="border p-2 rounded w-full" placeholder="Proponente" autocomplete="off" style="width: 100%; box-sizing: border-box;" />
                
                <div id="sugerencias_filtro_p" class="sugerencias hidden-empty" 
                     style="position: absolute; top: 100%; left: 0; width: 100%; background: white; border: 1px solid #ccc; z-index: 1000; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                </div>
            </div>
            <div id="proponente_tags_container" class="tags-container" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
        </div>
        <select id="estado" class="border p-2 rounded w-full">
          <option disabled selected>Estado</option>
          <option value="Todos" selected>Todos los estados</option>
          <option value="Publicado" disabled>Publicado</option>
          <option value="Adjudicado" disabled>Adjudicado</option>
          <option value="Recibido" disabled>Recibido</option>
          <option value="Desierto" disabled>Desierto</option>
        </select>
        <div>
          <input type="text" id="descripcion_input" class="w-full border p-2 rounded" placeholder="Palabras clave" autocomplete="off" style="width: 100%; box-sizing: border-box;">
          <div id="descripcion_tags_container" style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; min-height: 20px;"></div>
        </div>
        <button id="buscar-btn">Buscar</button>
      </div>

      <div id="basedatos-results">
        <div class="basedatos-graphs">
          <div class="basedatos-graph">
            <select id="histogram-mode" >
              <option value="cantidad_solicitada">Cantidad solicitada</option>
              <option value="cantidad_adjudicada">Cantidad adjudicada</option>
              <option value="precio_referencial_total" selected>Monto total referencial </option>
              <option value="precio_adjudicado_total">Monto total adjudicado</option>
            </select>
            <svg id="histogram" style="width: 100%; height: 300px;"></svg> 
            <div id="loading" class="spinner"></div>
          </div>
          <div id="piechart-container" class="basedatos-graph" style="display: flex; flex-direction: column; height: 260px;">
            <select id="piechart-mode" style="margin-bottom: 5px; width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
              <option value="entidad_nombre" selected>Entidad</option>
              <option value="proponente_nombre">Proponente</option>
              <option value="entidad_departamento">Departamento</option>
            </select>
            <div style="display: flex; flex-direction: row; flex: 1; overflow: hidden; align-items: flex-start;">
                <div style="flex: 0 0 40%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <svg id="piechart" style="width: 100%; height: 100%;"></svg>
                </div>
                <div id="legend" style="flex: 1; height: 100%; overflow-y: auto; padding-left: 10px; font-size: 0.75rem;"></div>
            </div>
          </div>
        </div>
        <div id="basedatos-table"></div>
        <div id="pagination-container"></div>
      </div>
    </div>
  `;

  setupFilters(container);
  await fetchItems(container);
  await drawHistogram(container);
  await drawPieChart(container);
}

async function fetchItems(container) {
  const tableContainer = container.querySelector("#basedatos-table");
  const indicator = container.querySelector("#data-source-indicator");
  
  const mustUseBigQuery = (descripcion_tags && descripcion_tags.length > 0) || 
                          (entidad_tags && entidad_tags.length > 10) ||
                          (proponente_tags && proponente_tags.length > 10);

  tableContainer.innerHTML = '<div class="text-center p-4"><div class="spinner inline-block"></div> Cargando datos...</div>';

  if (mustUseBigQuery) {
    if (indicator) indicator.textContent = "Fuente: BigQuery (Búsqueda compleja)";
    console.log("Modo: BigQuery");
    await fetchItemsBigQuery(container);
  } else {
    if (indicator) indicator.textContent = "Fuente: Firestore (Optimizado)";
    console.log("Modo: Firestore");
    await fetchItemsFirestore(container);
  }
}

async function fetchItemsFirestore(container) {
  const tableContainer = container.querySelector("#basedatos-table");
  const paginationContainer = container.querySelector('#pagination-container');

  try {
    let q = collection(db, FIRESTORE_COLLECTION);
    const filters = [];
    const gestion = parseInt(container.querySelector('#gestion-select').value);
    const mes = parseInt(container.querySelector('#mes-select').value);
    
    let startDate, endDate;
    if (mes > -1) {
      startDate = new Date(gestion, mes, 1);
      endDate = new Date(gestion, mes + 1, 1);
    } else {
      startDate = new Date(gestion, 0, 1);
      endDate = new Date(gestion + 1, 0, 1);
    }

    filters.push(where("fecha_publicacion", ">=", Timestamp.fromDate(startDate)));
    filters.push(where("fecha_publicacion", "<", Timestamp.fromDate(endDate)));

    const deptoVal = container.querySelector('#departamento-select').value;
    if (deptoVal && deptoVal !== "Todos" && deptoVal !== "Departamento") {
      filters.push(where("entidad_departamento", "==", deptoVal));
    }

    const estadoVal = container.querySelector('#estado').value;
    if (estadoVal && estadoVal !== "Todos" && estadoVal !== "Estado") {
      filters.push(where("estado", "==", estadoVal));
    }

    if (entidad_tags.length > 0) {
      filters.push(where("entidad_nombre", "in", entidad_tags));
    }

    if (proponente_tags.length > 0) {
      filters.push(where("proponente_nombre", "in", proponente_tags));
    }

    const countQuery = query(q, ...filters);
    const snapshotCount = await getCountFromServer(countQuery);
    const totalItems = snapshotCount.data().count;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    let dataQuery = query(
      q, 
      ...filters, 
      orderBy("fecha_publicacion", "desc"),
      limit(PAGE_SIZE)
    );

    if (currentPage > 0 && lastVisibleDoc) {
      dataQuery = query(dataQuery, startAfter(lastVisibleDoc));
    }

    const querySnapshot = await getDocs(dataQuery);

    if (!querySnapshot.empty) {
      lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    const data = querySnapshot.docs.map(doc => {
      const d = doc.data();
      let fecha = d.fecha_publicacion;
      if (fecha && fecha.toDate) fecha = fecha.toDate().toISOString(); // Si es Timestamp object
      
      return {
        ...d,
        fecha_publicacion: fecha
      };
    });

    console.log(`Firestore: Loaded ${data.length} items. Total: ${totalItems}.`);

    renderItems(data, container);
    renderPaginationFirestore(container, totalPages, currentPage, totalItems);

  } catch (error) {
    console.error("Firestore Error:", error);
    if (error.message.includes("index")) {
      tableContainer.innerHTML = `<p class="text-red-500 p-4">Falta un índice en Firestore. Abre la consola del navegador y haz click en el enlace generado por Firebase.</p>`;
    } else {
      tableContainer.innerHTML = `<p class="text-red-500 p-4">Error cargando datos de Firestore: ${error.message}</p>`;
    }
  }
}

async function fetchItemsBigQuery(container) {
  const tableContainer = container.querySelector("#basedatos-table");
  const paginationContainer = container.querySelector('#pagination-container');
  
  const whereSql = buildWhereClauses(container);
  const offset = currentPage * PAGE_SIZE;
  
  const dataSql = `
      SELECT *
      FROM \`empyrean-cubist-467813-u9.sicoescan.items_schema_schema_latest\`
      WHERE ${whereSql}
      ORDER BY fecha_publicacion DESC, cuce DESC 
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;
  
  const countSql = `
      SELECT COUNT(*) as total
      FROM \`empyrean-cubist-467813-u9.sicoescan.items_schema_schema_latest\`
      WHERE ${whereSql}
  `;

  try {
      const [dataResponse, countResponse] = await Promise.all([
        fetch('https://bq-query-376339585453.southamerica-west1.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql: dataSql })
        }),
        fetch('https://bq-query-376339585453.southamerica-west1.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql: countSql })
        })
      ]);

      if (!dataResponse.ok) throw new Error(`Data Error: ${dataResponse.status}`);
      const data = await dataResponse.json();
      const countData = await countResponse.json();
      const totalItems = countData[0].total ? parseInt(countData[0].total) : 0;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);

      renderItems(data, container);
      renderPagination(container, totalPages, currentPage);

  } catch (error) {
      console.error("BigQuery Fetch Error:", error);
      tableContainer.innerHTML = `<p class="text-red-500 p-4">Error loading data: ${error.message}</p>`;
  }
}

function setupFilters(container) {
  // 1. Configuración del Botón "Buscar"
  // Es vital que este botón resetee las variables de paginación de Firestore
  container.querySelector('#buscar-btn').addEventListener('click', async () => {
    // Resetear variables globales de paginación
    currentPage = 0;
    lastVisibleDoc = null; 
    pagesStack = [];
    
    // Limpiar sugerencias visuales por si quedaron abiertas
    container.querySelector("#entidad_nombre_sugerencias").innerHTML = "";
    container.querySelector("#entidad_nombre_sugerencias").classList.add('hidden');
    container.querySelector("#sugerencias_filtro_p").innerHTML = "";
    container.querySelector("#sugerencias_filtro_p").classList.add('hidden');

    // Ejecutar búsqueda y redibujar gráficos
    await fetchItems(container);
    await drawHistogram(container);
    await drawPieChart(container);
  });

  // 2. Configuración de Años (Gestión)
  const gestionEl = container.querySelector('#gestion-select');
  const mesEl = container.querySelector('#mes-select');
  const currentYear = new Date().getFullYear();
  
  gestionEl.innerHTML = '<option disabled>Gestión</option>';
  // Generar años desde el actual hasta 2020
  for (let year = currentYear; year >= 2020; year--) {
    let option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    gestionEl.appendChild(option);
  }
  gestionEl.value = currentYear; // Seleccionar año actual por defecto
  
  // 3. Helpers para el manejo de TAGS (Etiquetas)
  function renderTags(tagsArray, containerId) {
    const tagContainer = container.querySelector(`#${containerId}`);
    if (!tagContainer) return;
    tagContainer.innerHTML = '';
    
    tagsArray.forEach((tagText, index) => {
      // Crear chip visual
      const tagEl = document.createElement('span');
      tagEl.className = 'bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded flex items-center gap-1 mb-1';
      // Si no usas Tailwind, usa este estilo inline:
      // tagEl.style.cssText = "background: #e0f2fe; color: #075985; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px; margin: 2px;";

      const textSpan = document.createElement('span');
      textSpan.textContent = tagText;
      tagEl.appendChild(textSpan);

      // Botón de eliminar (x)
      const closeBtn = document.createElement('button');
      closeBtn.type = "button";
      closeBtn.innerHTML = "&times;";
      closeBtn.className = "hover:text-red-500 ml-1 font-bold focus:outline-none";
      
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        tagsArray.splice(index, 1); // Eliminar del array
        renderTags(tagsArray, containerId); // Re-renderizar
      });
      
      tagEl.appendChild(closeBtn);
      tagContainer.appendChild(tagEl);
    });
  }

  function setupInputTags(inputId, tagsArray, containerId) {
    const inputEl = container.querySelector(`#${inputId}`);
    if (!inputEl) return;
    
    inputEl.addEventListener('keydown', (e) => {
      const value = e.target.value.trim();
      // Al presionar Enter, crear tag
      if (e.key === 'Enter') {
        e.preventDefault();
        if (value !== "" && !tagsArray.includes(value)) {
          tagsArray.push(value);
          e.target.value = "";
          renderTags(tagsArray, containerId);
        }
      } 
      // Al presionar Backspace en vacío, borrar último tag
      else if (e.key === 'Backspace' && value === "" && tagsArray.length > 0) {
        tagsArray.pop();
        renderTags(tagsArray, containerId);
      }
    });
  }

  // Configurar input de "Palabras Clave" (Descripción)
  setupInputTags('descripcion_input', descripcion_tags, 'descripcion_tags_container');

  // 4. Configuración Typesense: PROPONENTE
  const proponente_nombre = container.querySelector("#input_filtro_p");
  const proponente_sugerencias = container.querySelector("#sugerencias_filtro_p");
  
  proponente_nombre.addEventListener("input", async (e) => {
      const text = e.target.value.trim();
      proponente_sugerencias.innerHTML = "";
      
      if (text.length === 0) { 
        proponente_sugerencias.classList.add('hidden'); 
        return; 
      }
      
      // Llamada a Typesense
      const results = await searchProponente(text);
      
      if (results.hits.length > 0) {
        proponente_sugerencias.classList.remove('hidden');
        results.hits.slice(0, 5).forEach(hit => {
          const div = document.createElement("div");
          div.textContent = hit.document.nombre;
          div.className = "px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-700 text-xs border-b border-gray-100 last:border-0";
          div.style.background = "white"; // Asegurar fondo blanco
          
          div.addEventListener("click", () => {
            if (!proponente_tags.includes(hit.document.nombre)) {
              proponente_tags.push(hit.document.nombre);
              renderTags(proponente_tags, 'proponente_tags_container');
            }
            proponente_nombre.value = "";
            proponente_sugerencias.innerHTML = "";
            proponente_sugerencias.classList.add('hidden'); 
          });
          proponente_sugerencias.appendChild(div);
        });
      } else {
        proponente_sugerencias.classList.add('hidden');
      }
  });

  // 5. Configuración Typesense: ENTIDAD
  const entidad_nombre = container.querySelector("#entidad_nombre");
  const entidad_sugerencias = container.querySelector("#entidad_nombre_sugerencias");
  
  entidad_nombre.addEventListener("input", async (e) => {
      const text = e.target.value.trim();
      entidad_sugerencias.innerHTML = ""; 
      
      if (text.length === 0) { 
        entidad_sugerencias.classList.add('hidden'); 
        return; 
      }
      
      // Llamada a Typesense
      const results = await searchEntidad(text);
      
      if (results.hits.length > 0) {
        entidad_sugerencias.classList.remove('hidden');
        results.hits.slice(0, 5).forEach(hit => {
          const div = document.createElement("div");
          div.textContent = hit.document.nombre;
          div.className = "px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-700 text-xs border-b border-gray-100 last:border-0";
          div.style.background = "white";

          div.addEventListener("click", () => {
            if (!entidad_tags.includes(hit.document.nombre)) {
              entidad_tags.push(hit.document.nombre);
              renderTags(entidad_tags, 'entidad_tags_container');
            }
            entidad_nombre.value = "";
            entidad_sugerencias.innerHTML = "";
            entidad_sugerencias.classList.add('hidden');
          });
          entidad_sugerencias.appendChild(div);
        });
      } else {
        entidad_sugerencias.classList.add('hidden');
      }
  });

  // 6. Listeners para Selectores de Gráficos (Histograma y PieChart)
  const histogramModeEl = container.querySelector("#histogram-mode");
  if (histogramModeEl) {
    histogramModeEl.addEventListener("change", () => {
      drawHistogram(container);
      // El cambio en el histograma podría afectar al piechart si comparten datos, 
      // pero por seguridad redibujamos ambos o solo el necesario.
      drawPieChart(container); 
    });
  }

  const piechartModeEl = container.querySelector("#piechart-mode");
  if (piechartModeEl) {
    piechartModeEl.addEventListener("change", () => {
      // Al cambiar la categoría del Pie (ej. ver por Proponente), redibujamos el Pie.
      drawPieChart(container); 
      // Opcionalmente redibujar histograma si quisieras
       drawHistogram(container);
    });
  }
  
  // Opcional: Cerrar sugerencias si se hace clic fuera
  document.addEventListener('click', (e) => {
    if (!entidad_nombre.contains(e.target) && !entidad_sugerencias.contains(e.target)) {
      entidad_sugerencias.classList.add('hidden');
    }
    if (!proponente_nombre.contains(e.target) && !proponente_sugerencias.contains(e.target)) {
      proponente_sugerencias.classList.add('hidden');
    }
  });
}

function buildWhereClauses(container) {
  const gestionEl = container.querySelector('#gestion-select');
  const mesEl = container.querySelector('#mes-select');
  const estadoEl = container.querySelector('#estado');
  const deptoEl = container.querySelector('#departamento-select');

  const gestion = parseInt(gestionEl.value);
  const mes = parseInt(mesEl.value);
  let startDate, endDate;

  if (mes > -1) {
    startDate = new Date(gestion, mes, 1);
    endDate = new Date(gestion, mes + 1, 1);
  } else {
    startDate = new Date(gestion, 0, 1);
    endDate = new Date(gestion + 1, 0, 1);
  }
  const startStr = startDate.toISOString().split('T')[0] + ' 00:00:00';
  const endStr = endDate.toISOString().split('T')[0] + ' 00:00:00';

  let clauses = [];
  clauses.push(`fecha_publicacion >= TIMESTAMP('${startStr}')`);
  clauses.push(`fecha_publicacion < TIMESTAMP('${endStr}')`);
  
  if (estadoEl && estadoEl.value && estadoEl.value !== "Todos" && estadoEl.value !== "Estado") {
    clauses.push(`estado = '${estadoEl.value}'`);
  }
  if (deptoEl && deptoEl.value && deptoEl.value !== "Todos" && deptoEl.value !== "Departamento") {
    clauses.push(`entidad_departamento = '${deptoEl.value}'`);
  }
  if (entidad_tags.length > 0) {
    const orGroup = entidad_tags.map(tag => `LOWER(entidad_nombre) LIKE LOWER('%${tag.replace(/'/g, "\\'")}%')`).join(' OR ');
    clauses.push(`(${orGroup})`);
  }
  if (proponente_tags.length > 0) {
    const orGroup = proponente_tags.map(tag => `LOWER(proponente_nombre) LIKE LOWER('%${tag.replace(/'/g, "\\'")}%')`).join(' OR ');
    clauses.push(`(${orGroup})`);
  }
  if (descripcion_tags.length > 0) {
    const andGroup = descripcion_tags.map(tag => `LOWER(descripcion) LIKE LOWER('%${tag.replace(/'/g, "\\'")}%')`).join(' AND ');
    clauses.push(`(${andGroup})`);
  }

  return clauses.join(' AND ');
}

function renderPaginationFirestore(container, totalPages, current, totalItems) {
  const wrapper = container.querySelector('#pagination-container');
  wrapper.innerHTML = '';
  
  if (totalItems === 0) return;

  const info = document.createElement('span');
  info.className = "text-sm text-gray-500 mr-4";
  info.textContent = `Página ${current + 1} de ${totalPages}`;
  wrapper.appendChild(info);

  // Botón Anterior
  const prevBtn = document.createElement('button');
  prevBtn.className = "pagination-btn";
  prevBtn.textContent = "Anterior";
  prevBtn.disabled = current === 0;
  
  prevBtn.addEventListener('click', () => {
    if (pagesStack.length > 0) {
      // Recuperar el cursor de dos páginas atrás (el inicio de la pagina anterior)
      pagesStack.pop(); // Removemos la actual
      const prevDoc = pagesStack.pop(); // Sacamos la anterior para establecerla como "última visible" del paso previo
      
      currentPage--;
      lastVisibleDoc = (pagesStack.length > 0) ? pagesStack[pagesStack.length - 1] : null;
      
      fetchItemsFirestore(container);
    } else {
      // Caso volver a pagina 1
      currentPage = 0;
      lastVisibleDoc = null;
      fetchItemsFirestore(container);
    }
  });
  wrapper.appendChild(prevBtn);

  // Botón Siguiente
  const nextBtn = document.createElement('button');
  nextBtn.className = "pagination-btn";
  nextBtn.textContent = "Siguiente";
  nextBtn.disabled = current >= totalPages - 1;
  
  nextBtn.addEventListener('click', () => {
    // Antes de avanzar, guardamos el lastVisibleDoc actual en el stack
    if (lastVisibleDoc) {
      // Solo apilamos si no estamos repitiendo (check simple)
      if (pagesStack.length === current) {
         pagesStack.push(lastVisibleDoc);
      }
    }
    currentPage++;
    fetchItemsFirestore(container);
  });
  wrapper.appendChild(nextBtn);
}

function renderPagination(container, totalPages, current) {
  const wrapper = container.querySelector('#pagination-container');
  wrapper.innerHTML = '';
  if (totalPages <= 1) return;
  
  const createBtn = (text, pageNum, isActive = false, isDisabled = false) => {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${isActive ? 'active' : ''}`;
    btn.textContent = text;
    btn.disabled = isDisabled;
    if (!isDisabled && !isActive) {
      btn.addEventListener('click', () => {
        currentPage = pageNum;
        fetchItems(container);
      });
    }
    return btn;
  };
  wrapper.appendChild(createBtn("Prev", current - 1, false, current === 0));
  const maxVisible = 5;
  let start = Math.max(0, current - 2);
  let end = Math.min(totalPages, start + maxVisible);
  
  for(let i=start; i<end; i++) {
     wrapper.appendChild(createBtn(i+1, i, i === current));
  }
  wrapper.appendChild(createBtn("Sig", current + 1, false, current >= totalPages - 1));
}

async function searchProponente(query) {
  return await client.collections('proponentes').documents().search({ q: query, query_by: 'nombre' });
}
async function searchEntidad(query) {
  return await client.collections('entidades').documents().search({ q: query, query_by: 'nombre' });
}

async function fetchHistogramData(container) {
  // Mantenemos esto en BQ porque hacer SUM() en Firestore es lento/caro
  const mesEl = container.querySelector('#mes-select');
  const mode = container.querySelector("#histogram-mode").value;
  const mes = parseInt(mesEl.value);
  const whereSql = buildWhereClauses(container); // Usa SQL builder
  let timeField;
  if (mes > -1) {
    timeField = "EXTRACT(DAY FROM fecha_publicacion)"; 
  } else {
    timeField = "EXTRACT(MONTH FROM fecha_publicacion) - 1"; 
  }
  const sql = `
    SELECT ${timeField} AS time, SUM(${mode}) AS count
    FROM \`empyrean-cubist-467813-u9.sicoescan.items_schema_schema_latest\`
    WHERE ${whereSql}
    GROUP BY time
    ORDER BY time ASC
  `;
  // ... fetch y proceso igual al original ...
  // Retorna datos para el gráfico
  try {
    let response = await fetch('https://bq-query-376339585453.southamerica-west1.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sql })
    });
    if (!response.ok) return [];
    let sparseData = await response.json();
    
    // Rellenar ceros (tu logica original)
    const gestion = parseInt(container.querySelector('#gestion-select').value);
    const dataMap = new Map(sparseData.map(d => [Number(d.time), Number(d.count) || 0]));
    let histogramData = [];
    if (mes > -1) {
      const daysInMonth = new Date(gestion, mes + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) histogramData.push({ time: i, count: dataMap.get(i) || 0 });
    } else {
      for (let i = 0; i < 12; i++) histogramData.push({ time: i, count: dataMap.get(i) || 0 });
    }
    return histogramData;
  } catch (e) { console.error(e); return []; }
}

async function fetchPieChartData(container) {
  // Mantenemos BQ
  const piechart_mode = container.querySelector("#piechart-mode").value; 
  const histogram_mode = container.querySelector("#histogram-mode").value; 
  const whereSql = buildWhereClauses(container);
  const sqlQuery = `
    SELECT ${piechart_mode}, SUM(${histogram_mode}) AS count
    FROM \`empyrean-cubist-467813-u9.sicoescan.items_schema_schema_latest\`
    WHERE ${whereSql}
    GROUP BY ${piechart_mode}
    ORDER BY count DESC
    LIMIT 20`; 
  try {
    let response = await fetch('https://bq-query-376339585453.southamerica-west1.run.app', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sqlQuery })
    });
    return await response.json();
  } catch (e) { console.error(e); return []; }
}

function renderItems(data, container) {
  // Tu función renderItems original EXACTA
  const tableContainer = container.querySelector("#basedatos-table");
  tableContainer.innerHTML = "";
  if (!data || data.length === 0) {
    tableContainer.innerHTML = "<p class='text-gray-500 text-center py-4'>No se encontraron resultados.</p>";
    return;
  }
  const columnNames = {
    cuce: "CUCE", descripcion: "Descripción", precio_referencial_total: "Monto Ref.",
    entidad_nombre: "Entidad", entidad_departamento: "Depto.", fecha_publicacion: "Fecha",
    proponente_nombre: "Proponente", estado: "Estado", cantidad_solicitada: "Cant. Solicitada",
    cantidad_adjudicada: "Cant. Adjudicada", precio_adjudicado_total: "Monto Adjudicado",
    modalidad: "Modalidad", tipo_procedimiento: "Tipo Procedimiento"
  };
  const columnWidths = {
    cuce: "240px", descripcion: "350px", entidad_nombre: "200px", proponente_nombre: "200px",
    fecha_publicacion: "120px", default: "150px"
  };

  let table = document.createElement("table");
  table.className = "min-w-full divide-y divide-gray-200 text-sm text-left text-gray-500";
  let thead = table.createTHead();
  thead.className = "text-xs text-gray-700 uppercase bg-gray-50";
  let headerRow = thead.insertRow();
  Object.values(columnNames).forEach(text => {
    let th = document.createElement("th");
    th.className = "px-6 py-3"; th.textContent = text; headerRow.appendChild(th);
  });
  let tbody = table.createTBody();
  tbody.className = "bg-white divide-y divide-gray-200";
  
  data.forEach((row_data, index) => {
    let row = tbody.insertRow();
    row.className = "hover:bg-gray-50 table-row-animate";
    row.style.animationDelay = `${Math.min(index * 30, 1000)}ms`;
    Object.keys(columnNames).forEach(key => {
      let cell = row.insertCell();
      const widthVal = columnWidths[key] || columnWidths.default;
      cell.style.minWidth = widthVal; cell.style.maxWidth = widthVal;
      cell.className = "px-6 py-4 whitespace-normal break-words align-top"; 
      let value = row_data[key];
      if (key === 'fecha_publicacion') {
        if (value && value.value) cell.textContent = new Date(value.value).toISOString().split("T")[0]; // BQ format
        else if (typeof value === 'string') cell.textContent = value.split("T")[0]; // FS format ISO string
        else cell.textContent = "-";
      } else if (key === 'precio_referencial_total' || key === 'precio_adjudicado_total') {
        cell.textContent = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value || 0);
        cell.classList.remove('whitespace-normal'); cell.classList.add('whitespace-nowrap');
      } else {
        cell.textContent = value || "-";
      }
    });
  });
  tableContainer.appendChild(table);
}

// DrawHistogram y DrawPieChart originales aquí...
async function drawHistogram(container) {
  const loading = document.getElementById("loading");
  loading.style.display = "block"; // show spinner

  const mes = parseInt(container.querySelector("#mes-select").value);

  // --- FETCH DATA ---
  let histogramData = await fetchHistogramData(container);
  // ... (El resto de la función drawHistogram es idéntico a tu original)
  
  // (COPIAR EL RESTO DE TU FUNCION drawHistogram AQUI)
  console.log("Histogram Processed Data:", histogramData);

  loading.style.display = "none"; // hide spinner

  // --- CONFIG: Month Names ---
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const shortMonthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  // Create tooltip (singleton)
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div").attr("class", "tooltip");
  }

  const svg = d3.select("#histogram");
  svg.selectAll("*").remove();

  // Dimensions
  const margin = {top: 20, right: 20, bottom: 50, left: 100};
  const baseWidth = 700;
  const baseHeight = 400;
  const innerWidth = baseWidth - margin.left - margin.right;
  const innerHeight = baseHeight - margin.top - margin.bottom;

  svg.attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // X Scale
  const x = d3.scaleBand()
    .domain(histogramData.map(d => d.time))
    .range([0, innerWidth])
    .padding(0.1);

  // Y Scale
  const counts = histogramData.map(d => d.count).filter(c => c > 0);
  const maxCount = d3.max(counts) || 0;
  const minCount = d3.min(counts) || 0;
  
  // Use Log scale if data varies wildly (>1000x difference)
  const useLogScale = (minCount > 0) && (maxCount / minCount > 1000); 

  const y = useLogScale
    ? d3.scaleLog().domain([Math.max(1, minCount), maxCount]).range([innerHeight, 0]).nice()
    : d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]).nice();

  // ... (después de definir las escalas x, y, innerHeight, etc.) ...

  // Draw Bars con Animación
  g.selectAll("rect")
    .data(histogramData)
    .enter().append("rect")
    .attr("x", d => x(d.time))
    .attr("width", x.bandwidth())
    .attr("fill", "steelblue")
    // 1. ESTADO INICIAL (Abajo y sin altura)
    .attr("y", innerHeight)
    .attr("height", 0)
    // 2. ANIMACIÓN
    .transition() 
    .duration(800) // Duración en milisegundos
    .ease(d3.easeCubicOut) // Efecto de suavizado (frena al final)
    .delay((d, i) => i * 50) // Efecto cascada de izquierda a derecha
    // 3. ESTADO FINAL
    .attr("y", d => d.count > 0 ? y(d.count) : innerHeight)
    .attr("height", d => d.count > 0 ? innerHeight - y(d.count) : 0);
    
  // NOTA: Los eventos .on("mouseover") deben ir DESPUÉS de la transición o aplicarse a la selección enter()
  // Para que funcionen correctamente, re-seleccionamos los rectángulos ya creados:
  g.selectAll("rect")
    .on("mouseover", (event, d) => {
       // ... tu código de tooltip existente ...
       tooltip.transition().duration(100).style("opacity", 1);
       let timeLabel = d.time;
       if (mes === -1) { timeLabel = monthNames[d.time] || d.time; }
       tooltip.html(`<strong>${timeLabel}</strong><br/>${d3.format(",")(d.count)}`);
       
       // Opcional: Resaltar barra al pasar mouse
       d3.select(event.currentTarget).attr("fill", "#1e40af"); 
    })
    .on("mousemove", event => {
       tooltip.style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event) => {
       tooltip.transition().duration(200).style("opacity", 0);
       // Restaurar color original
       d3.select(event.currentTarget).attr("fill", "steelblue");
    });

  // X Axis
  const xAxis = d3.axisBottom(x);
  
  // AXIS FORMATTING
  if (mes === -1) {
      // If viewing all months, use Short Names (Ene, Feb)
      xAxis.tickFormat(d => shortMonthNames[d]);
  }

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  // Y Axis
  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
        // Format large numbers (1M, 1k)
        if (d >= 1000000) return (d / 1000000) + "M";
        if (d >= 1000) return (d / 1000) + "k";
        return d;
    }));
}

async function drawPieChart(container) {
  const piechart_mode = container.querySelector("#piechart-mode").value;
  const dataRaw = await fetchPieChartData(container);
  
  const mappedData = dataRaw.map(row => ({
    nombre: row[piechart_mode] || "Desconocido",
    count: parseInt(row.count) || 0
  }));
  const validData = mappedData.filter(d => d.count > 0);
  let pieData = validData;

  if (validData.length > 10) {
    const top9 = validData.slice(0, 9);
    const others = validData.slice(9);
    const othersCount = others.reduce((sum, d) => sum + d.count, 0);
    
    pieData = top9;
    pieData.push({ nombre: "Otros", count: othersCount });
  }

  const svg = d3.select("#piechart");
  svg.selectAll("*").remove();
  
  const baseWidth = 250;
  const baseHeight = 250;
  const radius = Math.min(baseWidth, baseHeight) / 2;

  svg.attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g")
      .attr("transform", `translate(${baseWidth / 2},${baseHeight / 2})`);

  // 4. Color Scale
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // 5. Draw Arcs (Generators)
  const pie = d3.pie().value(d => d.count).sort(null); // sort(null) mantiene el orden de los datos
  const path = d3.arc().outerRadius(radius - 10).innerRadius(0);

  // Tooltip Setup
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div").attr("class", "tooltip");
  }

  // Bind Data
  const arcs = g.selectAll(".arc")
    .data(pie(pieData))
    .enter().append("g")
    .attr("class", "arc");

  // --- ANIMACIÓN Y DIBUJO ---
  
  // 1. Crear el Path base con color, pero sin el atributo 'd' final todavía
  const paths = arcs.append("path")
    .attr("fill", d => color(d.data.nombre));

  // 2. Animación de Entrada (Radial Wipe)
  // Usamos attrTween para interpolar el ángulo final desde el inicial
  paths.transition()
    .duration(1000) // 1 segundo de animación
    .attrTween("d", function(d) {
      // Interpolamos desde el ángulo de inicio hasta el ángulo final
      // El +0.1 es un pequeño truco para evitar glitches visuales al inicio
      const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
      return function(t) {
        d.endAngle = i(t);
        return path(d);
      };
    });

  // 3. Eventos e Interacción (Hover Zoom)
  paths.on("mouseover", (event, d) => {
       // Mostrar Tooltip
       tooltip.transition().duration(100).style("opacity", 1);
       tooltip.html(`<strong>${d.data.nombre}</strong><br/>${d3.format(",")(d.data.count)}`);
       
       // Animación Pop-out (Escalar el gajo)
       d3.select(event.currentTarget)
         .transition()
         .duration(200)
         .attr("transform", "scale(1.08)"); // Crece un 8%
    })
    .on("mousemove", (event) => {
       tooltip.style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event) => {
       // Ocultar Tooltip
       tooltip.transition().duration(200).style("opacity", 0);

       // Restaurar tamaño original
       d3.select(event.currentTarget)
         .transition()
         .duration(200)
         .attr("transform", "scale(1)");
    });

  // 6. Draw Legend
  const legend = d3.select("#legend");
  legend.html(""); 

  legend.style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("justify-content", "flex-start")
        .style("gap", "10px")
        .style("padding-top", "10px");

  const legendItems = legend.selectAll(".legend-item")
    .data(pieData)
    .enter().append("div")
      .attr("class", "legend-item")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-right", "10px");

  legendItems.append("div")
      .style("width", "12px")
      .style("height", "12px")
      .style("flex-shrink", "0")
      .style("background-color", d => color(d.nombre))
      .style("margin-right", "6px")
      .style("border-radius", "2px");

  legendItems.append("span")
      .style("font-size", "11px")
      .style("color", "#555")
      .style("white-space", "nowrap")
      .text(d => `${d.nombre} (${d3.format(",")(d.count)})`);
}

export { showBasedatos };
import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getAggregateFromServer,
  sum,
  startAfter
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let lastItemId = null;
let descripcion_tags = [];
let currentPage = 0; // NEW: Track page for SQL OFFSET

const client = new Typesense.Client({
  nodes: [
    {
      host: "miw4yagnpers0bt9p-1.a1.typesense.net",  // e.g., xyz.a1.typesense.net
      port: "443",
      protocol: "https"
    }
  ],
  apiKey: "XAAMlxvOibNSX79mq6446IpkDTC6oa09",  // not admin key
  connectionTimeoutSeconds: 2
});

async function showBasedatos(container) {
  container.innerHTML = `
    <div id="basedatos-container">
      <div id="basedatos-filtros">
        <select id="gestion-select">
          <option disabled>Gestión</option>
        </select>
        <select id="mes-select">
          <option disabled>Mes</option>
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
        <input type="search" id="entidad_nombre" placeholder="Entidad" />
        <div id="entidad_nombre_sugerencias" class="sugerencias""></div>
        <input type="search" id="proponente_nombre" placeholder="Proponente" />
        <div id="proponente_nombre_sugerencias" class="sugerencias"></div>
        <select id="estado" >
          <option disabled selected>Estado</option>
          <option value="Todos" selected>Todos</option>
          <option value="Publicado" disabled>Publicado</option>
          <option value="Adjudicado" disabled>Adjudicado</option>
          <option value="Recibido" disabled>Recibido</option>
          <option value="Desierto" disabled>Desierto</option>
        </select>
        <div class="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div class="relative">
            <input type="text" id="descripcion_input" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-gray-700 placeholder-gray-400" placeholder="Escribe una palabra clave y presiona Enter..." autocomplete="off">
          </div>
          <div id="descripcion_tags_container" class="flex flex-wrap gap-2 mt-3 min-h-[30px]"></div>
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
              <option value="precio_adjudicado_total" disabled>Monto total adjudicado</option>
            </select>
            <svg id="histogram"></svg> 
            <div id="loading" class="spinner"></div>
          </div>
          <div class="basedatos-graph">
            <select id="piechart-mode" >
              <option value="entidad_nombre" selected>Entidad</option>
              <option value="proponente_nombre">Proponente</option>
            </select>
            <svg id="piechart"></svg>
            <div id="legend" style="width: 100%; height: 100px; overflow: auto;"></div>
          </div>
        </div>
        <div id="basedatos-table"></div>
        <button id="siguiente">Siguiente</button>
      </div>
    </div>
  `;
  // Additional logic to fetch and display database info can be added here
  setupFilters(container);
  await fetchItems(container);
}

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
  mesEl.value = -1; // Todos

  container.querySelector('#buscar-btn').addEventListener('click', () => {
    currentPage = 0; 
    lastItemId = null; // reset pagination
    fetchItems(container)
    drawHistogram(container)
    drawPieChart(container)
  });

  const proponente_nombre = container.querySelector("#proponente_nombre");
  const proponente_nombre_sugerencias = container.querySelector("#proponente_nombre_sugerencias");
  proponente_nombre.addEventListener("input", async (e) => {
      const text = e.target.value.trim();
      proponente_nombre_sugerencias.innerHTML = ""; // limpiar sugerencias
      if (text.length === 0) return;
      const results = await searchProponente(text);
      results.hits.slice(0, 5).forEach(hit => {
        const div = document.createElement("div");
        div.textContent = hit.document.nombre;
        div.style.cursor = "pointer";
        div.addEventListener("click", () => {
          proponente_nombre.value = hit.document.nombre;
          proponente_nombre_sugerencias.innerHTML = "";
        });
        proponente_nombre_sugerencias.appendChild(div);
      });
  });

  const entidad_nombre = container.querySelector("#entidad_nombre");
  const entidad_nombre_sugerencias = container.querySelector("#entidad_nombre_sugerencias");
  entidad_nombre.addEventListener("input", async (e) => {
      const text = e.target.value.trim();
      entidad_nombre_sugerencias.innerHTML = ""; // limpiar sugerencias
      if (text.length === 0) return;
      const results = await searchEntidad(text);
      results.hits.slice(0, 5).forEach(hit => {
        const div = document.createElement("a");
        div.textContent = hit.document.nombre;
        div.style.cursor = "pointer";
        div.addEventListener("click", () => {
          entidad_nombre.value = hit.document.nombre;
          entidad_nombre_sugerencias.innerHTML = "";
        });
        entidad_nombre_sugerencias.appendChild(div);
      });
  });

  // Tag Input Logic (merged from previous immersive)
  const descripcionInput = container.querySelector('#descripcion_input');
  const tagsContainer = container.querySelector('#descripcion_tags_container');

  function updateTagsUI() {
    tagsContainer.innerHTML = '';
    descripcion_tags.forEach((tagText, index) => {
      const tagEl = document.createElement('button');
      tagEl.type = "button";
      tagEl.className = 'bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-blue-200 active:bg-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
      tagEl.textContent = 'x ' + tagText;
      tagEl.title = `Click to remove "${tagText}"`;
      tagEl.addEventListener('click', (e) => {
        descripcion_tags.splice(index, 1);
        updateTagsUI();
      });
      tagsContainer.appendChild(tagEl);
    });
  }

  descripcionInput.addEventListener('keydown', (e) => {
    const value = e.target.value.trim();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value !== "") {
        descripcion_tags.push(value); // FIXED: .push() instead of .append()
        e.target.value = "";
        updateTagsUI();
      }
    } else if (e.key === 'Backspace' && value === "" && descripcion_tags.length > 0) {
      descripcion_tags.pop();
      updateTagsUI();
    }
  });

  const histogramModeEl = container.querySelector("#histogram-mode");
  histogramModeEl.addEventListener("change", () => {
    drawHistogram(container)
    drawPieChart(container)
  });

  const piechartModeEl = container.querySelector("#piechart-mode");
  piechartModeEl.addEventListener("change", () => {
    drawHistogram(container)
    drawPieChart(container)
  });

  const SiguienteBtn = container.querySelector("#siguiente");
  SiguienteBtn.addEventListener("click", () => {
    currentPage += 1;
    fetchItems(container);
  });
}

async function searchProponente(query) {
  const searchResults = await client.collections('proponentes').documents().search({
    q: query,
    query_by: 'nombre'
  });
  //console.log(searchResults.hits);
  return searchResults;
}

async function searchEntidad(query) {
  const searchResults = await client.collections('entidades').documents().search({
    q: query,
    query_by: 'nombre'
  });
  //console.log(searchResults.hits);
  return searchResults;
}

// --- DATA FETCHING ---
async function fetchItems(container) {
  const proponenteEl = container.querySelector('#proponente_nombre');
  const entidadEl = container.querySelector('#entidad_nombre');
  const estadoEl = container.querySelector('#estado');
  const gestionEl = container.querySelector('#gestion-select');
  const mesEl = container.querySelector('#mes-select');
  const descripcionInput = container.querySelector('#descripcion_input');

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

  // 1. Build Base SQL Query
  let sql = `
      SELECT *
      FROM \`empyrean-cubist-467813-u9.sicoescan.items_schema_schema_latest\`
      WHERE fecha_publicacion >= TIMESTAMP('${startStr}')
        AND fecha_publicacion < TIMESTAMP('${endStr}')
  `;

  // 2. Append Filters
  if (entidadEl.value) {
      sql += ` AND entidad_nombre LIKE '%${entidadEl.value.replace(/'/g, "\\'").trim()}%'`;
  }
  if (proponenteEl.value) {
      sql += ` AND proponente_nombre LIKE '%${proponenteEl.value.replace(/'/g, "\\'").trim()}%'`;
  }
  if (estadoEl.value && estadoEl.value !== "Todos") {
      sql += ` AND estado = '${estadoEl.value}'`;
  }
  
  // 3. Append Description Tags Filters (LIKE for each tag)
  if (descripcion_tags.length > 0) {
      sql += " AND (" + descripcion_tags.map(tag => `LOWER(descripcion) LIKE LOWER('%${tag.replace(/'/g, "\\'")}%')`).join(' AND ') + ")";
  }

  // 4. Pagination & Ordering
  const PAGE_SIZE = 10;
  const offset = currentPage * PAGE_SIZE;
  sql += ` ORDER BY fecha_publicacion DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`;

  console.log("Executing SQL:", sql);

  try {
      container.querySelector("#basedatos-table").innerHTML = '<div class="text-center p-4"><div class="spinner inline-block"></div> Loading...</div>';
      
      let response = await fetch('https://bq-query-376339585453.southamerica-west1.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: sql })
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();

      console.log("BigQuery Data:", data);

      // Trigger chart redraws (kept from original logic)
      drawHistogram(container);
      drawPieChart(container);
      renderItems(data, container);
      console.log("Items rendered.", data);

  } catch (error) {
      console.error("BigQuery Fetch Error:", error);
      container.querySelector("#basedatos-table").innerHTML = `<p class="text-red-500 p-4">Error loading data: ${error.message}</p>`;
  }
}

async function fetchHistogramData(gestion, mes, mode, entidad_nombre, proponente_nombre) {
  let histogramData = [];
  let itemsRef = query(collection(db, 'items'));
  
  if (entidad_nombre) itemsRef = query(itemsRef, where('entidad_nombre', '==', entidad_nombre));
  if (proponente_nombre) itemsRef = query(itemsRef, where('proponente_nombre', '==', proponente_nombre));

  if (mes > -1) {
    const daysInMonth = new Date(gestion, mes + 1, 0).getDate();
    for (let i = 0; i < daysInMonth; i++) {
      let day = new Date(gestion, mes, i+1, 0, 0, 0, 0);
      const start = new Date(day); start.setHours(0, 0, 0, 0);
      const end = new Date(day); end.setHours(23, 59, 59, 999);
      const q = query(
        itemsRef,
        where('fecha_publicacion', '>=', start),
        where('fecha_publicacion', '<=', end)
      );
      const agg = await getAggregateFromServer(q, { total: sum(mode) });
      histogramData.push({ time: i+1, count: agg.data().total || 0 });
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const start = new Date(gestion, i, 1);
      const end = new Date(gestion, i + 1, 1);
      const q = query(
        itemsRef,
        where('fecha_publicacion', '>=', start),
        where('fecha_publicacion', '<', end)
      );
      const agg = await getAggregateFromServer(q, { total: sum(mode) });
      histogramData.push({ time: i, count: agg.data().total || 0 });
    }
  }
  return histogramData;
}

async function fetchPieChartData(gestion, mes, histogram_mode, piechart_mode, entidad_nombre, proponente_nombre) {
  let startDate, endDate;
  if (mes > -1) {
    startDate = new Date(gestion, mes, 1);
    endDate = new Date(gestion, mes + 1, 1);
  } else {
    startDate = new Date(gestion, 0, 1);
    endDate = new Date(gestion + 1, 0, 1);
  }
  const sqlQuery = `
    SELECT ${piechart_mode}, SUM\(${histogram_mode}\) AS count
    FROM \`empyrean-cubist-467813-u9.sicoescan.items_schema_schema_latest\`
    WHERE TIMESTAMP('${startDate.toISOString().split('T')[0]} 00:00:00') <= fecha_publicacion
      AND fecha_publicacion < TIMESTAMP('${endDate.toISOString().split('T')[0]} 00:00:00')` +
      (entidad_nombre && entidad_nombre !== "" ? ` AND entidad_nombre LIKE '%${entidad_nombre}%'` : '') +
      (proponente_nombre && proponente_nombre !== "" ? ` AND proponente_nombre LIKE '%${proponente_nombre}%'` : '') +
      (descripcion_tags.length > 0 ? ` AND (${descripcion_tags.map(tag => `descripcion LIKE '%${tag}%'`).join(' AND ')})` : '') +
      `
    GROUP BY ${piechart_mode}
    ORDER BY count DESC`;
  console.log("Pie Chart SQL Query:", sqlQuery);
    
  let response = await fetch('https://bq-query-376339585453.southamerica-west1.run.app', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: sqlQuery })
  });
  let result = await response.json();
  return result;
}

function renderItems(data, container) {
    const tableContainer = container.querySelector("#basedatos-table");
    tableContainer.innerHTML = "";
    
    if (!data || data.length === 0) {
        tableContainer.innerHTML = "<p class='text-gray-500 text-center py-4'>No se encontraron resultados.</p>";
        return;
    }

    const columnNames = {
        cuce: "CUCE", descripcion: "Descripción", precio_referencial_total: "Monto Ref.",
        entidad_nombre: "Entidad", fecha_publicacion: "Fecha", proponente_nombre: "Proponente",
        estado: "Estado", cantidad_solicitada: "Cant. Solicitada", cantidad_adjudicada: "Cant. Adjudicada",
        precio_adjudicado_total: "Monto Adjudicado", modalidad: "Modalidad", tipo_procedimiento: "Tipo Procedimiento"
    };

    let table = document.createElement("table");
    table.className = "min-w-full divide-y divide-gray-200 text-sm text-left text-gray-500";
    
    let thead = table.createTHead();
    thead.className = "text-xs text-gray-700 uppercase bg-gray-50";
    let headerRow = thead.insertRow();
    Object.values(columnNames).forEach(text => {
        let th = document.createElement("th");
        th.className = "px-6 py-3";
        th.textContent = text;
        headerRow.appendChild(th);
    });

    let tbody = table.createTBody();
    tbody.className = "bg-white divide-y divide-gray-200";
    data.forEach(row_data => {
        let row = tbody.insertRow();
        row.className = "hover:bg-gray-50";
        Object.keys(columnNames).forEach(key => {
            let cell = row.insertCell();
            cell.className = "px-6 py-4 whitespace-nowrap max-w-xs truncate";
            
            let value = row_data[key];

            if (key === 'fecha_publicacion') {
                // Handle both Firestore Timestamp (if any left) and BQ string/object
                if (value && value.value) { cell.textContent = new Date(value.value).toISOString().split("T")[0]; }
                else if (typeof value === 'string') { cell.textContent = value.split("T")[0]; }
                else { cell.textContent = "-"; }
            } else if (key === 'precio_referencial_total') {
                  cell.textContent = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value || 0);
            } else {
                cell.textContent = value || "-";
                cell.title = value || "";
            }
        });
    });

    tableContainer.appendChild(table);
    // We don't have an easy way to know if there's a next page without counting total, 
    // so we just enable it if we got a full page of results.
    container.querySelector("#siguiente").disabled = data.length < 10;
}

async function drawHistogram(container) {
  const loading = document.getElementById("loading");
  loading.style.display = "block"; // show spinner

  const mode = container.querySelector("#histogram-mode").value;
  const gestion = parseInt(container.querySelector("#gestion-select").value);
  const mes = parseInt(container.querySelector("#mes-select").value);
  const entidad_nombre = container.querySelector("#entidad_nombre").value;
  const proponente_nombre = container.querySelector("#proponente_nombre").value;

  let histogramData = await fetchHistogramData(gestion, mes, mode, entidad_nombre, proponente_nombre);
  console.log("Histogram Data:", histogramData);

  loading.style.display = "none"; // hide spinner

  // Create tooltip div (once)
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div").attr("class", "tooltip");
  }
  
  const svg = d3.select("#histogram"),
      width = svg.node().clientWidth || 300,
      height = svg.node().clientHeight || 300,
      margin = {top: 20, right: 20, bottom: 50, left: 50};
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale (months)
  const x = d3.scaleBand()
    .domain(histogramData.map(d => d.time))
    .range([0, innerWidth])
    .padding(0.1);

  // Compute max and min nonzero values
  const counts = histogramData.map(d => d.count).filter(c => c > 0);
  const maxCount = d3.max(counts);
  const minCount = d3.min(counts);

  // Choose linear or logarithmic scale based on ratio
  const useLogScale = maxCount / minCount > 1000; // threshold: 1000x difference

  const y = useLogScale
    ? d3.scaleLog()
        .domain([Math.max(1, minCount), maxCount]) // ensure no zero/negative
        .range([innerHeight, 0])
        .nice()
    : d3.scaleLinear()
        .domain([0, maxCount])
        .range([innerHeight, 0])
        .nice();

  // Bars
  g.selectAll("rect")
  .data(histogramData)
  .enter().append("rect")
    .attr("x", d => x(d.time))
    .attr("y", d => d.count > 0 ? y(d.count) : innerHeight)
    .attr("width", x.bandwidth())
    .attr("height", d => d.count > 0 ? innerHeight - y(d.count) : 0)
    .attr("fill", "steelblue")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`<strong>${d.time}</strong><br/>${d3.format(",")(d.count)}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    });

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y));
}

async function drawPieChart(container) {
  const piechart_mode = container.querySelector("#piechart-mode").value;
  const histogram_mode = container.querySelector("#histogram-mode").value;
  const gestion = parseInt(container.querySelector("#gestion-select").value);
  const mes = parseInt(container.querySelector("#mes-select").value);
  const entidad_nombre = container.querySelector("#entidad_nombre").value;
  const proponente_nombre = container.querySelector("#proponente_nombre").value;

  const datax = await fetchPieChartData(gestion, mes, histogram_mode, piechart_mode, entidad_nombre, proponente_nombre);
  console.log("Pie Chart Data from BQ:", datax);
  const data = datax.map(row => ({
    nombre: row[piechart_mode] || "Desconocido",
    count: parseInt(row['count']) || 0
  }));;
  console.log("Pie Chart Data from BQ:", data);
  const pieData = data//.filter(d => d.count > 0).slice(0, 9); // top 10
  //pieData.push({
  //  nombre: "Otros",
  //  count: data.slice(10).reduce((sum, d) => sum + d.count, 0)
  //});  

  //console.log("Pie Data:", pieData);
  const svg = d3.select("#piechart"),
      width = svg.node().clientWidth || 400,
      height = svg.node().clientHeight || 400,
      radius = Math.min(width, height) / 2;
  svg.selectAll("*").remove();
  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const pie = d3.pie().value(d => d.count);
  const path = d3.arc().outerRadius(radius - 10).innerRadius(0);
  const label = d3.arc().outerRadius(radius).innerRadius(radius - 80);
  const arcs = g.selectAll(".arc")
    .data(pie(pieData))
    .on("mouseover", (event, d) => {
      const tooltip = d3.select("body").select(".tooltip");
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`<strong>${d.data.nombre}</strong><br/>${d3.format(",")(d.data.count)}`);
    })
    .enter().append("g")
      .attr("class", "arc");
  arcs.append("path")
      .attr("d", path)
      .attr("fill", d => color(d.data.nombre));
      
  // Legend
  const legend = d3.select("#legend");
  legend.innerHTML = "";
  const legendItems = legend.selectAll(".legend-item")
    .data(data)
    .enter().append("div")
      .attr("class", "legend-item")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-bottom", "4px");

  console.log("Pie Chart Legend Data:", legendItems);
  legendItems.append("div")
      .style("width", "12px")
      .style("height", "12px")
      .style("background-color", d => color(d.nombre))
      .style("margin-right", "8px");
  legendItems.append("span")
      .text(d => `${d.nombre} (${d.count})`);
}

export { showBasedatos };
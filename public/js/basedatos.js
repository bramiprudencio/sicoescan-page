import { db } from './firebase.js';

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
          <option disabled selected>Gestión</option>
        </select>
        <select id="mes-select">
          <option disabled selected>Mes</option>
          <option value=0>Todos</option>
          <option value=1>Enero</option>
          <option value=2>Febrero</option>
          <option value=3>Marzo</option>
          <option value=4>Abril</option>
          <option value=5>Mayo</option>
          <option value=6>Junio</option>
          <option value=7>Julio</option>
          <option value=8>Agosto</option>
          <option value=9>Septiembre</option>
          <option value=10>Octubre</option>
          <option value=11>Noviembre</option>
          <option value=12>Diciembre</option>
        </select>
        <input type="search" id="cod_catalogo" placeholder="Código de catálogo" />
        <div id="cod_catalogo_sugerencias" class="sugerencias"></div>
        <input type="search" id="entidad_nombre" placeholder="Entidad" />
        <div id="entidad_nombre_sugerencias" class="sugerencias""></div>
        <input type="search" id="proponente_nombre" placeholder="Proponente" />
        <div id="proponente_nombre_sugerencias" class="sugerencias"></div>
        <select id="estado" >
          <option disabled selected>Estado</option>
          <option value="Todos" selected>Todos</option>
          <option value="Publicado">Publicado</option>
          <option value="Adjudicado">Adjudicado</option>
          <option value="Recibido">Recibido</option>
          <option value="Desierto">Desierto</option>
        </select>
        <button id="buscar-btn">Buscar</button>
      </div>
      <div id="basedatos-results">
        <div class="basedatos-graphs">
          <div class="basedatos-graph">
            <select id="histogram-mode" >
              <option value="cantidad_solicitada" selected>Cantidad solicitada</option>
              <option value="cantidad_adjudicada">Cantidad adjudicada</option>
              <option value="precio_referencial_total">Monto total</option>
            </select>
            <svg id="histogram" width="400" height="400"></svg>
          </div>
          <div class="basedatos-graph">
            <select id="piechart-mode" >
              <option value="entidad_nombre" selected>Entidad</option>
              <option value="proponente_nombre">Proponente</option>
            </select>
            <svg id="piechart" width="300" height="300"></svg>
            <div id="legend" style="width: 100%; height: 100px; overflow: auto;"></div>
          </div>
        </div>
        <div id="basedatos-table"></div>
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
  mesEl.value = 0;

  container.querySelector('#buscar-btn').addEventListener('click', () => fetchItems(container));

  const cod_catalogo = container.querySelector("#cod_catalogo");
  const cod_catalogo_sugerencias = container.querySelector("#cod_catalogo_sugerencias");
  cod_catalogo.addEventListener("input", async (e) => {
      const text = e.target.value.trim();
      cod_catalogo_sugerencias.innerHTML = "";
      if (text.length === 0) return;
      const results = await searchCatalogo(text);
      results.hits.slice(0, 5).forEach(hit => {
      const { cod, descripcion } = hit.document;
      let matchedDesc = "";
      matchedDesc = descripcion.find(d => d.toLowerCase().includes(text)) || descripcion[0];
      const div = document.createElement("div");
      div.textContent = `${cod} - ${matchedDesc}`;
      div.style.cursor = "pointer";
      div.addEventListener("click", () => {
        cod_catalogo.value = hit.document.id;
        cod_catalogo_sugerencias.innerHTML = "";
      });

      cod_catalogo_sugerencias.appendChild(div);
    });
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

  const histogramModeEl = container.querySelector("#histogram-mode");
  histogramModeEl.addEventListener("change", () => fetchItems(container));

  const piechartModeEl = container.querySelector("#piechart-mode");
  piechartModeEl.addEventListener("change", () => fetchItems(container));
}

async function searchCatalogo(query) {
  const searchResults = await client.collections('catalogo').documents().search({
    q: query,
    query_by: 'cod,descripcion'
  });
  console.log(searchResults.hits);
  return searchResults;
}

async function searchProponente(query) {
  const searchResults = await client.collections('proponentes').documents().search({
    q: query,
    query_by: 'nombre'
  });
  console.log(searchResults.hits);
  return searchResults;
}

async function searchEntidad(query) {
  const searchResults = await client.collections('entidades').documents().search({
    q: query,
    query_by: 'nombre'
  });
  console.log(searchResults.hits);
  return searchResults;
}

// Fetch all items (for potential future use)
async function fetchItems(container) {
  const catalogoEl = container.querySelector('#cod_catalogo');
  const proponenteEl = container.querySelector('#proponente_nombre');
  const entidadEl = container.querySelector('#entidad_nombre');
  const estadoEl = container.querySelector('#estado');
  const gestionEl = container.querySelector('#gestion-select');
  const mesEl = container.querySelector('#mes-select');
  let q = db.collection('items');

  // Apply filters
  const cod_catalogo = catalogoEl.value;
  if (cod_catalogo && cod_catalogo !== "Todos") {
    console.log("Filtering by cod_catalogo:", cod_catalogo);
    q = q.where('cod_catalogo', '==', cod_catalogo);
  }
  const entidad_nombre = entidadEl.value;
  if (entidad_nombre && entidad_nombre !== "Todos") {
    console.log("Filtering by entidad_nombre:", entidad_nombre);
    q = q.where('entidad_nombre', '==', entidad_nombre);
  }
  const proponente_nombre = proponenteEl.value;
  if (proponente_nombre && proponente_nombre !== "Todos") {
    console.log("Filtering by proponente_nombre:", proponente_nombre);
    q = q.where('proponente_nombre', '==', proponente_nombre);
  }
  const estado = estadoEl.value;
  if (estado && estado !== "Todos") {
    console.log("Filtering by estado:", estado);
    q = q.where('estado', '==', estado);
  }
  const gestion = parseInt(gestionEl.value);
  const mes = parseInt(mesEl.value);
  if (mes && mes != 0) {
    const startDate = new Date(gestion, mes - 1, 1);
    const endDate = new Date(gestion, mes, 1);
    console.log("Filtering dates from", startDate, "to", endDate);
    q = q.where('fecha_publicacion', '>=', startDate).where('fecha_publicacion', '<', endDate);
  } else {
    const startDate = new Date(gestion, 0, 1);
    const endDate = new Date(gestion + 1, 0, 1);
    console.log("Filtering dates from", startDate, "to", endDate);
    q = q.where('fecha_publicacion', '>=', startDate).where('fecha_publicacion', '<', endDate);
    
  }

  const snapshot = await q.limit(50).get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log("Fetched items:", data);

  drawHistogram(data);
  drawPieChart(data);
  renderItems(data);
}

// Render items (if needed)
function renderItems(data) {
  const columnNames = {
    cuce: "CUCE",
    cod_catalogo: "Código del catálogo",
    descripcion: "Descripción del item",
    cantidad_solicitada: "Cantidad solicitada",
    cantidad_recepcionada: "Cantidad recepcionada",
    medida: "Unidad de medida",
    precio_referencial: "Precio referencial",
    precio_adjudicado: "Precio adjudicado",
    precio_referencial_total: "Monto total referencial",
    precio_adjudicado_total: "Monto total adjudicado",
    entidad_nombre: "Entidad",
    proponente_nombre: "Proponente adjudicado",
    margen: "Margen de preferencia",
    destacado: "Destacado",
    fecha_publicacion: "Fecha de publicación"
  };
  const container = document.getElementById("basedatos-table");
  container.innerHTML = "";
  if (data.length === 0) {
    container.innerHTML = "<p>No items found.</p>";
    return;
  }
  let table = document.createElement("table");
  table.border = "1";
  table.style.borderCollapse = "collapse";
  table.style.margin = "auto";
  table.style.width = "100%";
  table.style.overflowX = "auto";

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
    Object.keys(columnNames).forEach(key => {
      let cell = row.insertCell();
      cell.style.padding = "8px";
      cell.textContent = (key == 'fecha_publicacion') ? doc[key].toDate().toISOString().split("T")[0] : doc[key] || "";
    });
  });

  container.appendChild(table);
}

// Draw histogram using D3.js
async function drawHistogram(data) {
  //console.log("Drawing histogram with data:", data);
  // Collect dates (resolve all promises)
  const dates = data.map(d => d.fecha_publicacion ? d.fecha_publicacion.toDate() : null);
  //console.log("Dates:", dates);

  // Count per month
  const monthCounts = {};
  dates.forEach(date => {
    if (!date) return;
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[yearMonth] = (monthCounts[yearMonth] || 0) + 1;
  });
  //console.log("Month Counts:", monthCounts);

  let histogramData = Object.entries(monthCounts).map(([month, count]) => ({ month, count }))
  histogramData.sort((a, b) => a.month.localeCompare(b.month));
  //console.log("Histogram Data:", histogramData);
  const svg = d3.select("#histogram"),
      width = +svg.attr("width"),
      height = +svg.attr("height"),
      margin = {top: 20, right: 20, bottom: 50, left: 50};
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale (months)
  const x = d3.scaleBand()
    .domain(histogramData.map(d => d.month))
    .range([0, innerWidth])
    .padding(0.1);

  // Y scale (counts)
  const y = d3.scaleLinear()
    .domain([0, d3.max(histogramData, d => d.count)])
    .nice()
    .range([innerHeight, 0]);

  // Bars
  g.selectAll("rect")
    .data(histogramData)
    .enter().append("rect")
      .attr("x", d => x(d.month))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.count))
      .attr("fill", "steelblue");

  // X Axis
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  // Y Axis
  g.append("g")
    .call(d3.axisLeft(y));
}
// Draw pie chart using D3.js
async function drawPieChart(data) {
  //console.log("Drawing pie chart with data:", data);

  const piechartModeEl = document.getElementById("piechart-mode");
  const mode = piechartModeEl.value;

  // Count per proponente
  const counts = {};
  data.forEach(d => {
    if (!d[mode]) return;
    counts[d[mode]] = (counts[d[mode]] || 0) + 1;
  });
  //console.log(mode, " Counts:", counts);
  const pieData = Object.entries(counts).map(([nombre, count]) => ({ nombre, count }));
  pieData.sort((a, b) => b.count - a.count);
  //console.log("Pie Data:", pieData);
  const svg = d3.select("#piechart"),
      width = +svg.attr("width"),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2;
  svg.selectAll("*").remove();
  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const pie = d3.pie().value(d => d.count);
  const path = d3.arc().outerRadius(radius - 10).innerRadius(0);
  const label = d3.arc().outerRadius(radius).innerRadius(radius - 80);
  const arcs = g.selectAll(".arc")
    .data(pie(pieData))
    .enter().append("g")
      .attr("class", "arc");
  arcs.append("path")
      .attr("d", path)
      .attr("fill", d => color(d.data.nombre));
      
  // Legend
  const legend = d3.select("#legend");
  legend.innerHTML = "";
  const legendItems = legend.selectAll(".legend-item")
    .data(pieData)
    .enter().append("div")
      .attr("class", "legend-item")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-bottom", "4px");
  legendItems.append("div")
      .style("width", "12px")
      .style("height", "12px")
      .style("background-color", d => color(d.nombre))
      .style("margin-right", "8px");
  legendItems.append("span")
      .text(d => `${d.nombre} (${d.count})`);
}

export { showBasedatos };
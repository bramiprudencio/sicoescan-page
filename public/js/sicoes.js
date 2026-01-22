function showSicoes(container) {
  container.innerHTML = `
    <div id="sicoes-page">
      
      <div class="sicoes-hero">
        <div class="hero-content">
          <img src="../assets/sicoes.png" alt="SICOES Logo" class="sicoes-logo"/>
          <h1>Sistema de Contrataciones Estatales</h1>
          <p class="hero-subtitle">La plataforma oficial para gestionar y transparentar las contrataciones públicas en Bolivia.</p>
          <a href="https://www.sicoes.gob.bo/portal/index.php#" target="_blank" class="sicoes-btn">
            Visitar Sitio Oficial
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>
      </div>

      <div class="sicoes-grid">
        
        <div class="sicoes-card">
          <div class="card-icon">🏛️</div>
          <h2>¿Qué es el SICOES?</h2>
          <p>
            El <strong>SICOES</strong> es la plataforma oficial del Estado Plurinacional de Bolivia. Su objetivo principal es centralizar la información relacionada con licitaciones, convocatorias, adjudicaciones y contratos.
          </p>
          <ul class="sicoes-list">
            <li>Promueve la igualdad de condiciones entre participantes.</li>
            <li>Garantiza el uso eficiente de los recursos públicos.</li>
            <li>Permite a cualquier ciudadano verificar montos y empresas ganadoras.</li>
          </ul>
        </div>

        <div class="sicoes-card">
          <div class="card-icon">💼</div>
          <h2>Oportunidades de Negocio</h2>
          <p>
            Para las empresas bolivianas, dominar el uso del SICOES es fundamental. Representa una puerta de acceso directa a un gran volumen de oportunidades con instituciones públicas a nivel:
          </p>
          <div class="tags-row">
            <span class="sicoes-tag">Nacional</span>
            <span class="sicoes-tag">Departamental</span>
            <span class="sicoes-tag">Municipal</span>
          </div>
        </div>

        <div class="sicoes-card full-width bg-gray">
          <h2>El Desafío de SICOES</h2>
          <p>
            Aunque SICOES contiene información valiosa (desde materias primas hasta obras de construcción), <strong>no la presenta de manera ordenada</strong>. 
            Tradicionalmente, la única forma de acceder a estos datos era revisarlos manualmente, lo que implicaba una gran inversión de tiempo y esfuerzo.
          </p>
        </div>

        <div class="sicoes-card full-width highlight-card">
          <div class="highlight-content">
            <h2>🚀 La Solución: SICOEsCAN</h2>
            <p>
              SICOEsCAN es una plataforma diseñada para automatizar y optimizar este proceso. Centraliza, organiza y clasifica los datos de SICOES automáticamente.
            </p>
            <div class="features-grid">
              <div class="feature-item">
                <strong>📊 Análisis de Datos</strong>
                <span>Accede fácilmente a precios, cantidades y frecuencia de compra.</span>
              </div>
              <div class="feature-item">
                <strong>🔔 Notificaciones</strong>
                <span>Recibe alertas personalizadas de procesos relevantes para tu empresa.</span>
              </div>
              <div class="feature-item">
                <strong>🏷️ Filtro UNSPSC</strong>
                <span>Filtramos ítems específicos usando códigos UNSPSC para que no pierdas ninguna oportunidad.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export { showSicoes };
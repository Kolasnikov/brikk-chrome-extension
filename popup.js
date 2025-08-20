document.addEventListener("DOMContentLoaded", () => {
  // --- REFERENCIAS A ELEMENTOS DEL DOM ---
  const listaFavoritos = document.getElementById("lista-favoritos");
  const borrarTodoBtn = document.getElementById("borrar-todo");
  const compararBtn = document.getElementById("comparar-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const filterStatusEl = document.getElementById("filter-status");
  const sortByEl = document.getElementById("sort-by");
  const controlsBar = document.querySelector('.controls-bar');
  const mainButtons = document.querySelector('.main-buttons');

  // --- ESTADO INICIAL ---
  let favoritosGlobal = [];

function acortarVeredicto(veredictoCompleto) {
  if (!veredictoCompleto || veredictoCompleto === "Sin analizar") return "Sin analizar";
  
  const lowerCaseVeredicto = veredictoCompleto.toLowerCase();
  
  if (lowerCaseVeredicto.includes('buena') || lowerCaseVeredicto.includes('sólida') || lowerCaseVeredicto.includes('clara')) {
    return "Buena Inversión";
  }
  if (lowerCaseVeredicto.includes('interesante') || lowerCaseVeredicto.includes('moderada') || lowerCaseVeredicto.includes('equilibrada')) {
    return "Oportunidad Media";
  }
  if (lowerCaseVeredicto.includes('riesgo') || lowerCaseVeredicto.includes('arriesgada') || lowerCaseVeredicto.includes('cautela')) {
    return "Inversión con Riesgo";
  }
  // Si no coincide con ninguna palabra clave, devuelve las primeras 2 palabras.
  return veredictoCompleto.split(' ').slice(0, 2).join(' ');
}

  // --- FUNCIONES PRINCIPALES ---
  function renderFavoritos() {
    let favoritosFiltrados = [...favoritosGlobal];

    // Lógica de filtrar y ordenar
    const statusFiltro = filterStatusEl.value;
    if (statusFiltro !== "todos") {
      favoritosFiltrados = favoritosFiltrados.filter(fav => fav.status === statusFiltro);
    }
    const orden = sortByEl.value;
    if (orden === "precio-asc") {
      favoritosFiltrados.sort((a, b) => a.precio - b.precio);
    } else if (orden === "precio-desc") {
      favoritosFiltrados.sort((a, b) => b.precio - a.precio);
    } else if (orden === "rentabilidad-desc") {
      favoritosFiltrados.sort((a, b) => (a.analisis_financiero?.rentabilidad_neta_anual_estimada || -999) - (b.analisis_financiero?.rentabilidad_neta_anual_estimada || -999));
    }

    listaFavoritos.innerHTML = "";
    if (favoritosFiltrados.length === 0) {
      listaFavoritos.innerHTML = `<div class="vacío">No hay favoritos guardados.</div>`;
      return;
    }

    favoritosFiltrados.forEach(item => {
      const originalIndex = favoritosGlobal.findIndex(fav => fav.url === item.url);
      const div = document.createElement("div");
      div.className = "favorito";
      div.dataset.index = originalIndex;

      const semaforo = item.semaforo || "🟡";
      const veredicto = acortarVeredicto(item.veredicto);
      
      // La métrica principal ahora es la Rentabilidad Neta
      const metricaPrincipal = item.analisis_financiero?.rentabilidad_neta_anual_estimada ?
        `📈 ${item.analisis_financiero.rentabilidad_neta_anual_estimada}% Neta` : "📊 N/D%";
      
      const statusOptions = ["Prospecto", "Analizando", "Contacto Realizado", "Visitado", "Oferta Realizada", "Descartado"];
      
      div.innerHTML = `
        <div class="favorito-main">
          <input type="checkbox" class="seleccionar" data-index="${originalIndex}">
          <div class="favorito-info">
            <a href="${item.url}" target="_blank">${item.titulo}</a>
            <small>${item.direccion}</small>
            <div class="favorito-stats">
              <span>💶 ${item.precio?.toLocaleString('es-ES')} €</span>
              <span>${semaforo} ${veredicto}</span>
              <span>${metricaPrincipal}</span>
            </div>
          </div>
          <div class="favorito-controls">
            <div class="expand-indicator">▼</div>
            <button class="borrar-individual" data-index="${originalIndex}" title="Eliminar">🗑️</button>
          </div>
        </div>
        <div class="favorito-details">
          <div class="detail-section status-section">
            <label>Estado:</label>
            <select class="status-select" data-index="${originalIndex}">
              ${statusOptions.map(opt => `<option value="${opt}" ${item.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
          </div>
          <div class="detail-section notes-section">
            <label>Notas:</label>
            <textarea class="notes-textarea" data-index="${originalIndex}" placeholder="Añade tus notas aquí...">${item.notes || ''}</textarea>
          </div>
          <div class="detail-section ai-analysis-section">
            <button class="toggle-ai-btn">Mostrar/Ocultar Análisis IA</button>
            <div class="ai-content" style="display: none;">
              <p><b>Resumen:</b> ${item.resumen || 'N/A'}</p>
              <p><b>Cash Flow:</b> ${item.analisis_financiero?.cash_flow_mensual_estimado?.toLocaleString('es-ES') || 'N/A'} €/mes</p>
              <p><b>ROCE:</b> ${item.analisis_financiero?.roce_anual_estimado || 'N/A'}%</p>
              <b>Estrategia:</b> <ul>${(item.estrategia_inversion?.valor_anadido || item.estrategia_inversion?.oportunidades_optimizacion)?.map(p => `<li>${p}</li>`).join('') || '<li>N/A</li>'}</ul>
              <b>Puntos de Negociación:</b> <ul>${item.estrategia_inversion?.puntos_negociacion?.map(c => `<li>${c}</li>`).join('') || '<li>N/A</li>'}</ul>
              <b>Inquilino Ideal:</b> <p>${item.estrategia_inversion?.perfil_inquilino || 'N/A'}</p>
            </div>
          </div>
        </div>
      `;
      listaFavoritos.appendChild(div);
    });
  }

  function mostrarComparacion(indices, favoritos) {
    controlsBar.style.display = 'none';
    listaFavoritos.innerHTML = '';
    mainButtons.style.display = 'none';

    listaFavoritos.innerHTML = `
      <h2 style="margin-top: 15px;">Tabla Comparativa</h2>
      <table class="comparacion-table">
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Precio (€)</th>
            <th>Veredicto</th>
            <th>Rentab. Neta (%)</th>
            <th>Cash Flow (€/mes)</th>
            <th>ROCE (%)</th>
          </tr>
        </thead>
        <tbody>
          ${indices.map(index => {
            const item = favoritos[index];
            return `
              <tr>
                <td><a href="${item.url}" target="_blank">${item.titulo}</a></td>
                <td class="editable-cell" contenteditable="true">${item.precio?.toLocaleString('es-ES') || "0"}</td>
                <td>${item.semaforo || "🟡"} ${item.veredicto || "Sin analizar"}</td>
                <td class="editable-cell" contenteditable="true">${item.analisis_financiero?.rentabilidad_neta_anual_estimada || "0"}</td>
                <td class="editable-cell" contenteditable="true">${item.analisis_financiero?.cash_flow_mensual_estimado || "0"}</td>
                <td class="editable-cell" contenteditable="true">${item.analisis_financiero?.roce_anual_estimado || "0"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      <button id="volver-btn">Volver a favoritos</button>
    `;

    document.getElementById("volver-btn").addEventListener("click", () => {
      controlsBar.style.display = 'flex';
      mainButtons.style.display = 'flex';
      cargarFavoritosInicial();
    });
  }

  function cargarFavoritosInicial() {
    chrome.storage.local.get(["brikk_favoritos"], (res) => {
      favoritosGlobal = (res.brikk_favoritos || []).reverse();
      const hayFavoritos = favoritosGlobal.length > 0;
      [compararBtn, exportCsvBtn, borrarTodoBtn].forEach(btn => btn.style.display = hayFavoritos ? 'block' : 'none');
      renderFavoritos();
    });
  }

  function exportarACSV() {
    if (favoritosGlobal.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Titulo", "URL", "Precio", "Ubicacion", "Habitaciones", "Estado", "Veredicto", "Rentabilidad Neta (%)", "Cash Flow Mensual", "ROCE (%)", "Notas"];
    csvContent += headers.join(",") + "\r\n";
    favoritosGlobal.forEach(item => {
      const row = [
        `"${item.titulo}"`, item.url, item.precio, `"${item.direccion}"`, item.habitaciones, item.status,
        `"${item.veredicto}"`, item.analisis_financiero?.rentabilidad_neta_anual_estimada, item.analisis_financiero?.cash_flow_mensual_estimado,
        item.analisis_financiero?.roce_anual_estimado, `"${(item.notes || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(",") + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "brikk_favoritos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- EVENT LISTENERS ---
  cargarFavoritosInicial();

  filterStatusEl.addEventListener("change", renderFavoritos);
  sortByEl.addEventListener("change", renderFavoritos);
  exportCsvBtn.addEventListener("click", exportarACSV);

  listaFavoritos.addEventListener('click', (e) => {
    const target = e.target;
    const favoritoDiv = target.closest('.favorito');
    if (!favoritoDiv) return;
    const index = parseInt(favoritoDiv.dataset.index);

    if (target.classList.contains('borrar-individual')) {
      favoritosGlobal.splice(index, 1);
      chrome.storage.local.set({ brikk_favoritos: favoritosGlobal.reverse() }, cargarFavoritosInicial);
    } else if (target.classList.contains('toggle-ai-btn')) {
      const content = favoritoDiv.querySelector('.ai-content');
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    } else if (!['A', 'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName) && !target.closest('.editable-cell')) {
      favoritoDiv.classList.toggle('expanded');
    }
  });
  
  listaFavoritos.addEventListener('change', (e) => {
    const target = e.target;
    if (target.classList.contains('seleccionar')) {
       const seleccionados = Array.from(document.querySelectorAll(".seleccionar:checked"));
       compararBtn.disabled = !(seleccionados.length >= 2 && seleccionados.length <= 3);
    } else {
      const index = parseInt(target.dataset.index);
      if (target.classList.contains('status-select')) {
        favoritosGlobal[index].status = target.value;
        chrome.storage.local.set({ brikk_favoritos: favoritosGlobal.reverse() });
      }
    }
  });
  
  listaFavoritos.addEventListener('input', (e) => {
    const target = e.target; // Definimos target aquí
    if (target.classList.contains('notes-textarea')) {
      const index = parseInt(target.dataset.index);
      favoritosGlobal[index].notes = target.value;
      chrome.storage.local.set({ brikk_favoritos: favoritosGlobal.reverse() });
    }
  });

  borrarTodoBtn.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres borrar todos los favoritos?")) {
      chrome.storage.local.set({ brikk_favoritos: [] }, cargarFavoritosInicial);
    }
  });

  compararBtn.addEventListener("click", () => {
    const seleccionados = Array.from(document.querySelectorAll(".seleccionar:checked"))
                               .map(cb => parseInt(cb.dataset.index));
    if (seleccionados.length >= 2) {
      mostrarComparacion(seleccionados, favoritosGlobal);
    }
  });
});

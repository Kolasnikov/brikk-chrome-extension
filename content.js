window.addEventListener('load', async () => {
  console.log("BrikkLens activo en Idealista 🟢");

  if (!window.location.href.includes("/inmueble/")) return;
  if (document.getElementById("brikklens-widget")) return;
   let ultimoAnalisisRealizado = null;

  try {
    // --- INICIO: LÓGICA DE ONBOARDING ---
    chrome.storage.local.get(['hasSeenOnboarding'], (res) => {
      // Si la variable 'hasSeenOnboarding' no existe o es falsa, mostramos el mensaje
      if (!res.hasSeenOnboarding) {
        mostrarOnboarding();
      }
    });
    // --- Extraer datos básicos ---
    let precioTexto = document.querySelector('[data-test="price-value"]')?.innerText || null;
    if (!precioTexto) {
      const posibles = Array.from(document.querySelectorAll("span,h1,h2,p"))
        .map(e => e.innerText)
        .find(txt => txt && txt.includes("€") && /\d/.test(txt));
      if (posibles) precioTexto = posibles;
    }

    console.log("PrecioTexto crudo:", precioTexto);
    const precio = parsePriceText(precioTexto) || 0;
    console.log("Precio parseado:", precio);

    const superficieMatch = document.body.innerText.match(/(\d+(?:[.,]\d+)?)\s*m²|\d+(?:[.,]\d+)?m²/i) ||
                           document.body.innerText.match(/(\d+)\s*m²|\d+m²/i);
    console.log("SuperficieMatch:", superficieMatch);
    const superficie = superficieMatch ? parseSurfaceText(superficieMatch[0]) : null;
    
    console.log("Superficie parseada:", superficie);

    const precioPorM2 = (precio && superficie) ? Math.round(precio / superficie) : null;
    console.log("Precio por m²:", precioPorM2);
    const titulo = document.querySelector("h1")?.innerText || "Anuncio sin título";

    let direccion = "Dirección no encontrada";
    const mapaLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === "Ver mapa");
    if (mapaLink?.parentElement?.querySelector("span")?.textContent.trim()) {
      direccion = mapaLink.parentElement.querySelector("span").textContent.trim();
    }

// --- INICIO: CÓDIGO FINAL Y ROBUSTO PARA EXTRAER HABITACIONES ---
let habitaciones = null;

// 1. Buscamos todos los 'span' dentro del contenedor '.info-features' que has encontrado
const detallesInmueble = Array.from(document.querySelectorAll('.info-features span'));

// 2. De esa lista, encontramos el que contiene el texto "hab."
const habFeature = detallesInmueble.find(el => el.innerText.includes('hab.'));

// 3. Si lo encontramos, extraemos el número que contiene
if (habFeature) {
    const numeroMatch = habFeature.innerText.match(/\d+/);
    if (numeroMatch) {
        habitaciones = parseInt(numeroMatch[0], 10);
    }
}
// --- FIN: CÓDIGO FINAL ---

    const comunidadAutonomica = (() => {
      const txt = document.body.innerText.toLowerCase();
      if (txt.includes("andalucía")) return "andalucia";
      if (txt.includes("madrid")) return "madrid";
      if (txt.includes("cataluña") || txt.includes("catalunya")) return "cataluña";
      if (txt.includes("murcia")) return "murcia";
      if (txt.includes("valencia")) return "valencia";
      if (txt.includes("galicia")) return "galicia";
      if (txt.includes("castilla y león")) return "castillayleon";
      if (txt.includes("castilla-la mancha") || txt.includes("castilla la mancha")) return "castillalamancha";
      if (txt.includes("país vasco") || txt.includes("euskadi")) return "paisvasco";
      if (txt.includes("navarra")) return "navarra";
      if (txt.includes("extremadura")) return "extremadura";
      if (txt.includes("aragón")) return "aragon";
      if (txt.includes("asturias")) return "asturias";
      if (txt.includes("cantabria")) return "cantabria";
      if (txt.includes("la rioja")) return "larioja";
      if (txt.includes("islas baleares") || txt.includes("baleares")) return "baleares";
      if (txt.includes("canarias")) return "canarias";
      if (txt.includes("ceuta")) return "ceuta";
      if (txt.includes("melilla")) return "melilla";
      return null;
    })();

    const tasasITP = {
      andalucia: 0.07,
      madrid: 0.06,
      cataluña: 0.10,
      murcia: 0.08,
      valencia: 0.10,
      galicia: 0.10,
      castillayleon: 0.08,
      castillalamancha: 0.08,
      paisvasco: 0.07,
      navarra: 0.07,
      extremadura: 0.08,
      aragon: 0.08,
      asturias: 0.08,
      cantabria: 0.08,
      larioja: 0.08,
      baleares: 0.08,
      canarias: 0.06,
      ceuta: 0.05,
      melilla: 0.05
    };

    const porcentajeGastos = 0.02;
    const tasaITP = comunidadAutonomica ? tasasITP[comunidadAutonomica] || 0.07 : 0.07;
    const gastosCompra = precio ? Math.round(precio * (tasaITP + porcentajeGastos)) : null;
    let costeTotalAdquisicion = precio ? precio + (gastosCompra || 0) : null;

    const url = window.location.href;
    
// --- INICIO: CÓDIGO FINAL CON EL SELECTOR CORRECTO ---
let municipio = "Ubicación no encontrada";

// Usamos el selector que has identificado desde el CSS.
// Le decimos que busque un elemento con la clase '.main-info__title-minor'.
const selectorFinal = '.main-info__title-minor'; 

const locationElement = document.querySelector(selectorFinal);

if (locationElement && locationElement.innerText) {
    // Cogemos el texto y quitamos la parte de "Ver mapa" por si acaso
    municipio = locationElement.innerText.replace('Ver mapa', '').trim();
}
// --- FIN: CÓDIGO FINAL ---

    // Recopila los datos para la IA
const propertyData = {
  titulo,
  precio,
  superficie,
  habitaciones,
  municipio,
  direccion,
  comunidadAutonomica,
  precioPorM2,
  url
};


// La llamada a la IA ahora se hace con el botón "Analizar inversión con IA"



    function parsePriceText(txt) {
      if (!txt) return null;
      const cleaned = txt.replace(/\./g, '').replace(',', '.').match(/[\d.]+/g);
      if (!cleaned) return null;
      const num = parseFloat(cleaned[0]);
      return isNaN(num) ? null : num;
    }

    function parseSurfaceText(txt) {
      if (!txt) return null;
      const m2match = txt.replace(/\./g, '').match(/(\d+(\.\d+)?)\s?m²/i);
      if (m2match) {
        const val = parseFloat(m2match[1].replace(',', '.'));
        return isNaN(val) ? null : val;
      }
      const num = parseFloat(txt.replace(/[^\d,\.]/g, '').replace(',', '.'));
      return isNaN(num) ? null : num;
    }

    function extractLocationSlug() {
      // Mejora: Busca en breadcrumb más genérico
      let breadcrumb = document.querySelector('.breadcrumb-item.active, .breadcrumb-item:last-child')?.textContent.trim().toLowerCase() || '';
      if (breadcrumb) {
        console.log("Breadcrumb encontrado:", breadcrumb);
        return normalizeText(breadcrumb);  // Normaliza directamente
      }
      
      // Mejora: Busca en URL con más flexibilidad (ej. ignora números)
      const urlParts = window.location.pathname.split('/').filter(part => part && !/^\d+$/.test(part) && part.length > 2);
      const possibleSlug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];  // Toma penúltimo o último
      if (possibleSlug) {
        console.log("Slug de URL encontrado:", possibleSlug);
        return normalizeText(possibleSlug);
      }
      
      // Nuevo: Busca en elementos comunes de Idealista (ej. título o dirección)
      const titleElem = document.querySelector('h1, [itemprop="name"]')?.innerText.toLowerCase() || '';
      const addressElem = document.querySelector('.details-property-location, span[itemprop="address"]')?.innerText.toLowerCase() || '';
      const combined = (titleElem + ' ' + addressElem).trim();
      if (combined) {
        console.log("Ubicación de título/dirección:", combined);
        return normalizeText(combined.split(',')[0].trim());  // Toma primera parte (municipio)
      }
      
      console.log("No se encontró slug/ubicación");
      return null;
    }

    function normalizeText(text) {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_");
    }

    function fallbackSimple() {
      let semaforo = '🔴';
      let message = 'Precio elevado.';
      if (precioPorM2 < 2000) {
        semaforo = '🟢';
        message = 'Buena oportunidad!';
      } else if (precioPorM2 <= 3000) {
        semaforo = '🟡';
        message = 'Precio razonable.';
      }
      return {semaforo, message};
    }

async function analizarConIA(propertyData) {
  try {
    // 1. Llama a tu servidor en Vercel
    const response = await fetch('https://brikklens-api.vercel.app/api/analizar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // 2. Envía directamente los datos del inmueble. Tu servidor construirá el prompt.
      body: JSON.stringify(propertyData) 
    });

    if (!response.ok) {
      // Si tu servidor devuelve un error, lo mostramos para depurar
      const errorData = await response.json();
      console.error('Error desde tu API en Vercel:', errorData);
      throw new Error(`Tu servidor respondió con un error: ${response.status}`);
    }

    const data = await response.json();
    
    // 3. El 'data' que recibes es la respuesta completa de xAI que te ha reenviado tu servidor.
    //    Ahora extraemos el contenido del análisis como antes.
    const aiResponse = data.choices[0].message.content.trim();
    let result;

    try {
      // Buscamos un bloque JSON dentro de la respuesta de la IA
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Si la IA responde con texto pero no es JSON
        throw new Error("La IA no devolvió un JSON válido.");
      }
    } catch (parseError) {
      console.error('Error al procesar la respuesta de la IA:', parseError, 'Respuesta recibida:', aiResponse);
      // Fallback por si el JSON está mal formado
      result = { oportunidad: "🟡", mensaje: "La IA respondió pero el formato era incorrecto.", rentabilidad: 0 };
    }
    return result;

  } catch (error) {
    console.error('Error en la llamada a la API de BrikkLens:', error);
    mostrarToast(`❌ Error al analizar: ${error.message}`);
    // Devolvemos un objeto de error para que la interfaz lo muestre al usuario
    return { oportunidad: "🔴", mensaje: "No se pudo conectar con el servidor de análisis.", rentabilidad: 0 };
  }
}
// REEMPLAZA TU FUNCIÓN 'displayAnalysis' ACTUAL EN content.js POR ESTA:

function displayAnalysis(analysis) {
  const div = document.getElementById('ai-analysis');

  div.innerHTML = `
    <div style="font-weight: bold; color: #5A46A0; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d3c2f1; padding-bottom: 5px;">
      <span>Análisis con IA</span>
      <button id="toggle-ai-analysis" style="width: auto; padding: 2px 8px; font-size: 11px; margin: 0; background-color: #e9e3f5; color: #5A46A0; border: 1px solid #d3c2f1;">Ocultar [-]</button>
    </div>
    
    <div id="ai-analysis-content">
      <div style="font-size: 1.1em; font-weight: bold; margin: 8px 0;">
        Veredicto: <span style="font-size: 1.3em;">${analysis.semaforo || '🟡'}</span> ${analysis.veredicto || 'Revisar'}
      </div>
      <p style="font-style: italic; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">${analysis.resumen || 'Análisis no disponible.'}</p>

      <div style="margin-top: 8px;">
        <b>Análisis Financiero (Proforma)</b>
        <ul style="margin: 2px 0 0 15px; padding: 0; list-style-type: none;">
          <li>💰 <b>Cash Flow Mensual:</b> ${analysis.analisis_financiero?.cash_flow_mensual_estimado?.toLocaleString('es-ES') || 'N/A'} €</li>
          <li>🎯 <b>ROCE (Anual):</b> ${analysis.analisis_financiero?.roce_anual_estimado || 'N/A'}%</li>
          
          <li>📊 <b>Rentabilidad Bruta:</b> ${analysis.analisis_financiero?.rentabilidad_bruta_anual_estimada || 'N/A'}%</li>

          <li>📈 <b>Rentabilidad Neta:</b> ${analysis.analisis_financiero?.rentabilidad_neta_anual_estimada || 'N/A'}%</li>
          <li>💶 <b>Alquiler Estimado:</b> ${analysis.analisis_financiero?.alquiler_mensual_estimado?.toLocaleString('es-ES') || 'N/A'} €/mes</li>
        </ul>
        <details style="margin-left: 15px; font-size: 11px; color: #666;">
          <summary style="cursor: pointer; outline: none;">Ver supuestos del cálculo</summary>
          <ul style="margin: 2px 0 0 15px; padding: 0;">
            <li>Financiación: ${analysis.analisis_financiero?.supuestos?.ltv_financiacion || 'N/A'}%</li>
            <li>Interés asumido: ${analysis.analisis_financiero?.supuestos?.tipo_interes_anual || 'N/A'}%</li>
            <li>Gastos compra: ${analysis.analisis_financiero?.supuestos?.gastos_compra_porcentaje || 'N/A'}%</li>
            <li>Reforma estimada: ${analysis.analisis_financiero?.supuestos?.coste_reforma_estimado?.toLocaleString('es-ES') || 'N/A'} €</li>
          </ul>
        </details>
      </div>

      <div style="margin-top: 8px;">
        <b>Análisis de Mercado</b>
        <ul style="margin: 2px 0 0 15px; padding: 0; list-style-type: none;">
          <li>⚖️ <b>Precio/m²:</b> ${analysis.analisis_mercado?.benchmark_precio_m2 || 'N/A'}</li>
          <li>🚀 <b>Revalorización:</b> ${analysis.analisis_mercado?.potencial_revalorizacion || 'N/A'}</li>
        </ul>
      </div>

      <div style="margin-top: 8px;">
        <b>Estrategia de Inversión</b>
        <ul style="margin: 2px 0 0 15px; padding: 0; list-style-type: none;">
            <li>👍 <b>Valor Añadido:</b> ${analysis.estrategia_inversion?.valor_anadido?.[0] || 'N/A'}</li>
            <li>👎 <b>Punto de Negociación:</b> ${analysis.estrategia_inversion?.puntos_negociacion?.[0] || 'N/A'}</li>
            <li>👤 <b>Inquilino Ideal:</b> ${analysis.estrategia_inversion?.perfil_inquilino || 'N/A'}</li>
        </ul>
      </div>

      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 11px; color: #888; font-style: italic;">
        ${"Para obtener datos más precisos con tu financiación y gastos reales, es recomendable utilizar la calculadora manual."}
      </div>
    </div>
  `;

  // --- Lógica para el botón de Ocultar/Mostrar ---
  const toggleButton = document.getElementById('toggle-ai-analysis');
  const analysisContent = document.getElementById('ai-analysis-content');

  toggleButton.addEventListener('click', () => {
    const isHidden = analysisContent.style.display === 'none';
    if (isHidden) {
      analysisContent.style.display = 'block';
      toggleButton.textContent = 'Ocultar [-]';
    } else {
      analysisContent.style.display = 'none';
      toggleButton.textContent = 'Mostrar [+]';
    }
  });
}

function mostrarOnboarding() {
  // Creamos el fondo oscuro
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';

  // Creamos la ventana modal
  const modal = document.createElement('div');
  modal.className = 'onboarding-modal';

  modal.innerHTML = `
    <h2>Bienvenido a Brikk</h2>
    <p>
      Esta herramienta te ayudará a analizar cualquier inmueble en segundos.
      Utiliza el widget "Brikk Copilot" en la esquina inferior derecha para:
    </p>
    <ul style="text-align: left; display: inline-block;">
      <li>🤖 Obtener un análisis financiero de la inversión con IA.</li>
      <li>📈 Calcular la rentabilidad con tus propios números.</li>
      <li>⭐ Guardar y comparar tus propiedades favoritas.</li>
    </ul>
    <p>¡Feliz inversión!</p>
    <button id="onboarding-close-btn">¡Entendido!</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Lógica para el botón de cerrar
  document.getElementById('onboarding-close-btn').addEventListener('click', () => {
    // Marcamos que el usuario ya ha visto el onboarding
    chrome.storage.local.set({ hasSeenOnboarding: true });
    // Eliminamos la ventana
    overlay.remove();
  });
}

    function displayFallback() {
      const {semaforo, message} = fallbackSimple();
      const div = document.getElementById('ai-analysis');
      div.innerHTML = `
        <div>🚦 <b>Oportunidad:</b> ${semaforo} ${message}</div>
        <div>🏠 <b>Alquiler estimado:</b> N/D</div>
        <div>💡 <b>Rentabilidad bruta:</b> N/D</div>
        <div>📝 <b>Opinion:</b> Análisis fallback basado en precio por m².</div>
      `;
    }

    // --- Crear widget con datos estimados ---
    const widget = document.createElement("div");
    widget.id = "brikklens-widget";
 widget.innerHTML = `
      <div id="brikk-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <div style="font-weight: bold; font-size: 15px; color: #5A46A0;">Brikk Copilot</div>
        <button id="brikk-minimize-btn" title="Ocultar">&#9662;</button>
      </div>
      <div class="widget-content">
      <div style="margin-bottom: 4px;">💶 <b>Precio:</b> ${precio?.toLocaleString() || "N/D"} €</div>
      <div style="margin-bottom: 4px;">📍 <b>Ubicación:</b> ${municipio}</div>
      <div style="margin-bottom: 4px;">📐 <b>Superficie:</b> ${superficie || "N/D"} m²</div>
      <div style="margin-bottom: 4px;">🛏️ <b>Habitaciones:</b> ${propertyData.habitaciones || "N/D"}</div>
      <div style="margin-bottom: 4px;">📏 <b>Coste m²:</b> ${precioPorM2 || "N/D"} €/m²</div>
      <div id="ai-analysis" style="margin-top: 10px;"></div>
      <div style="display: flex; gap: 6px; margin-top: 6px;">
        <button id="brikk-copy-btn" style="flex: 1; background-color: #8A6EFF; color: white; border: none; border-radius: 6px; padding: 6px; font-size: 13px; cursor: pointer; transition: background-color 0.2s ease;">📋 Copiar</button>
        <button id="brikk-fav-btn" style="flex: 1; background-color: #8A6EFF; color: white; border: none; border-radius: 6px; padding: 6px; font-size: 13px; cursor: pointer; transition: background-color 0.2s ease;">⭐ Guardar</button>
      </div>
      <button id="brikk-ai-btn" style="margin-top: 8px; width: 100%; background-color: #8A6EFF; color: white; border: none; border-radius: 6px; padding: 6px; font-size: 13px; cursor: pointer; transition: background-color 0.2s ease;">🤖 Analizar inversión con IA</button>
      <button id="brikk-calc-btn" style="margin-top: 8px; width: 100%; background-color: #8A6EFF; color: white; border: none; border-radius: 6px; padding: 6px; font-size: 13px; cursor: pointer; transition: background-color 0.2s ease;">📈 Calcular rentabilidad (manual)</button>
      <div id="brikk-calc-form" style="display:none; margin-top: 10px;">
        <div style="max-height: 60vh; overflow-y: auto;">
          <hr style="margin: 10px 0;">
          <div style="font-weight: bold; margin-bottom: 6px;"> Costes de adquisición</div>
          <div style="font-size:11px; color:#666; margin-bottom:4px;">Precio base del anuncio</div>
          <input type="text" id="precio-compraventa" value="${precio ? precio.toLocaleString('es-ES') + ' €' : ''}" placeholder="💰 Precio de compraventa (€)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <div style="font-size:11px; color:#666; margin-bottom:4px;">Coste de la reforma</div>
          <input type="text" id="reforma" value="" placeholder="🔧 Reforma (€)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <div style="font-size:11px; color:#666; margin-bottom:4px;">ITP del ${Math.round(tasaITP * 100)}% + gastos aprox. 2%</div>
          <input type="text" id="gastos-compra" value="${gastosCompra ? gastosCompra.toLocaleString('es-ES') + ' €' : ''}" placeholder="📋 Gastos de compra (ITP + 2%) (€)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <div style="font-size:11px; color:#666; margin-bottom:4px;">Coste total de adquisición</div>
          <input type="text" id="coste-total-adquisicion" value="${costeTotalAdquisicion ? costeTotalAdquisicion.toLocaleString('es-ES') + ' €' : ''}" placeholder="💰 Coste total de adquisición (€)" style="width:100%; margin-bottom:16px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <hr style="margin: 10px 0;">
          <div style="font-weight: bold; margin-bottom: 6px;"> Financiación</div>
          <div style="margin: 6px 0;">
            <label style="font-size: 13px;">
              <input type="checkbox" id="usar-hipoteca" style="margin-right: 6px;">
              Calcular con hipoteca
            </label>
          </div>
       <div id="campos-hipoteca" style="display:none;">
            <div style="margin: 6px 0;">
              <label style="font-size: 13px; margin-right: 10px;">
                <input type="radio" name="tipo-hipoteca" value="fija" checked style="margin-right: 6px;"> Fija
              </label>
              <label style="font-size: 13px;">
                <input type="radio" name="tipo-hipoteca" value="variable" style="margin-right: 6px;"> Variable
              </label>
            </div>

            <div id="euribor-container" style="display:none;">
              <div style="font-size:11px; color:#666; margin-bottom:4px;">Euribor (media reciente)</div>
              <input type="text" id="euribor-base" value="2,2%" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
            </div>

            <div id="interes-label" style="font-size:11px; color:#666; margin-bottom:4px;">Tasa de interés anual (fija)</div>
            <input type="text" id="interes-hipoteca" placeholder="📊 Interés anual (ej. 3%)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">

            <div style="font-size:11px; color:#666; margin-bottom:4px;">Porcentaje de financiación sobre el precio</div>
            <input type="text" id="porcentaje-hipoteca" placeholder="🏦 % Hipoteca sobre precio (ej. 80%)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">

            <div id="variacion-label" style="font-size:11px; color:#666; margin-bottom:4px;">Simular una variación futura del Euribor</div>
            <input type="text" id="variacion-hipoteca" placeholder="📈 Variación anual (± ej. 0,5%)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;" value="0,5">

            <div style="font-size:11px; color:#666; margin-bottom:4px;">Duración del préstamo en años</div>
            <input type="text" id="plazo-hipoteca" placeholder="📆 Plazo (ej. 20 años)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
            <div style="font-size:11px; color:#666; margin-bottom:4px;">Pago mensual estimado de la hipoteca</div>
            <input type="text" id="cuota-hipoteca" value="" placeholder="💰 Cuota mensual hipoteca (€)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;" readonly>
            <div id="rango-cuota" style="font-size:11px; color:#666; margin-bottom:4px; display:none;">* Estimado, puede variar con el EURIBOR</div>
            <div style="font-size:11px; color:#666; margin-bottom:4px;">Parte del precio no cubierta por la hipoteca (entrada)</div>
            <input type="text" id="importe-no-financiado" value="" placeholder="💸 Importe no financiado (€)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
            <div style="font-size:11px; color:#666; margin-bottom:4px;">Capital total aportado (no financiado + gastos + reforma)</div>
            <input type="text" id="capital-aportado" value="" placeholder="💵 Capital aportado (real) (€)" style="width:100%; margin-bottom:16px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          </div>
          <div style="font-weight: bold; margin-bottom: 6px;"> Ingresos y gastos</div>
          <div style="font-size:11px; color:#666; margin-bottom:4px;">Estimación del alquiler mensual</div>
          <input type="text" id="alquiler" placeholder="💶 Alquiler mensual estimado (€)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <hr style="margin: 10px 0;">
          <div style="font-size:11px; color:#666; margin-bottom:4px;">IBI</div>
          <input type="text" id="ibi" value="" placeholder="💰 IBI (€/año)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <div style="font-size:11px; color:#666; margin-bottom:4px;">Comunidad</div>
          <input type="text" id="comunidad" value="" placeholder="🏘️ Comunidad (€/año)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <div style="font-size:11px; color:#666; margin-bottom:4px;">Seguros</div>
          <input type="text" id="seguros" value="" placeholder="🛡️ Seguros (€/año)" style="width:100%; margin-bottom:12px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <div style="font-size:11px; color:#666; margin-bottom:4px;">Otros (Opcional)</div>
          <input type="text" id="otros_gastos" value="" placeholder="🔧 Otros gastos (€/año)" style="width:100%; margin-bottom:16px; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:13px;">
          <button id="calcular-roi" style="margin-top: 8px; width: 100%; background-color: #8A6EFF; color: white; border: none; border-radius: 6px; padding: 6px; font-size: 13px; cursor: pointer;">📊 Ver resultados</button>
          <button id="reiniciar-form" style="margin-top: 8px; width: 100%; background-color: #ff4444; color: white; border: none; border-radius: 6px; padding: 6px; font-size: 13px; cursor: pointer;">🔄 Reiniciar</button>
          <div id="resultados-roi" style="margin-top: 10px; font-size: 14px; line-height: 1.5;"></div>
          </div>
        </div>
      </div>
    `;

    Object.assign(widget.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: "#f9f7fc",
      color: "#333",
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid #d3c2f1",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      fontFamily: "Segoe UI, Roboto, sans-serif",
      fontSize: "14px",
      zIndex: "99999",
      maxWidth: "310px",
      lineHeight: "1.5",
      maxHeight: "80vh",
      overflowY: "auto"
    });

    const style = document.createElement("style");
    style.textContent = `
      #brikk-copy-btn, #brikk-fav-btn, #brikk-calc-btn, #calcular-roi {
        background-color: #8A6EFF;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      #brikk-copy-btn:hover, #brikk-fav-btn:hover, #brikk-calc-btn:hover, #calcular-roi:hover {
        background-color: #6346e0;
      }
      #brikklens-overlay {
        position: fixed;
        z-index: 1000000;
        pointer-events: none;
      }
      #brikklens-toast {
        position: absolute;
        bottom: calc(100% + 10px);
        right: 0;
        background-color: #7B61FF;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        min-width: 320px;
        max-height: 40px;
        line-height: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #brikklens-overlay.active #brikklens-toast {
        opacity: 1;
        transform: translateY(0);
      }
       /* Estilo para el nuevo botón de minimizar/maximizar */
      #brikk-minimize-btn {
  background-color: #8A6EFF;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;  /* <-- Aumentado */
  line-height: 1;
  width: 28px;    /* <-- Aumentado */
  height: 28px;   /* <-- Aumentado */
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  margin-left: 15px; /* Añade un espacio de 15 píxeles a la izquierda del botón */
}
      #brikk-minimize-btn:hover {
        background-color: #6346e0; /* Color más oscuro al pasar el ratón */
      }

      /* La regla clave para minimizar el widget */
      #brikklens-widget.minimized .widget-content {
        display: none;
      }
      /* Estilo mejorado para el estado minimizado */
      #brikklens-widget.minimized {
        padding: 8px 12px; /* Reducimos el padding para un look más compacto */
        height: auto;
        max-height: 44px; /* Ajustamos la altura al contenido */
        overflow: hidden;
        /* ¡La clave! Añadimos una transición suave para la animación */
        transition: all 0.3s ease-in-out;
      }

      /* Cuando el widget está minimizado, eliminamos el margen inferior de la cabecera */
      #brikklens-widget.minimized #brikk-header {
        margin-bottom: 0;
      }
        /* --- INICIO: ESTILOS PARA LA ANIMACIÓN DE CARGA (SPINNER) --- */
      .brikk-loader {
        border: 4px solid #e9e3f5; /* Color del círculo base */
        border-top: 4px solid #8A6EFF; /* Color de la parte que gira */
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      /* --- FIN: ESTILOS PARA LA ANIMACIÓN DE CARGA --- */
      /* --- INICIO: ESTILOS PARA EL ONBOARDING --- */

.onboarding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.onboarding-modal {
  background-color: #f9f7fc;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #d3c2f1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  text-align: center;
  font-family: "Segoe UI", Roboto, sans-serif;
  color: #333;
}

.onboarding-modal h2 {
  color: #5A46A0;
  margin-top: 0;
}

.onboarding-modal p {
  line-height: 1.6;
  margin-bottom: 20px;
}

.onboarding-modal button {
    background-color: #8A6EFF;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 15px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.onboarding-modal button:hover {
    background-color: #6346e0;
}
/* --- FIN: ESTILOS PARA EL ONBOARDING --- */
    `;
    document.head.appendChild(style);
    document.body.appendChild(widget);

    // --- Formatear inputs con "." y "€" o "%" según el campo ---
    function aplicarFormatoMoneda(inputId) {
      const input = document.getElementById(inputId);
      if (!input) return;

      input.addEventListener("focus", () => {
        input.value = input.value.replace(/[^\d,]/g, '').replace(/,/g, '.');
      });

      input.addEventListener("input", (e) => {
        let val = e.target.value.replace(/[^\d,]/g, '');
        if (val.includes(',')) {
          const parts = val.split(',');
          if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('');
        }
        input.value = val;
      });

      input.addEventListener("blur", () => {
        let val = input.value.replace(/[^\d,]/g, '').replace(',', '.');
        if (val === "") {
          input.value = "";
          return;
        }
        val = parseFloat(val) || 0;
        if (["porcentaje-hipoteca", "interes-hipoteca", "variacion-hipoteca"].includes(inputId)) {
          input.value = val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',') + "%";
        } else if (inputId === "plazo-hipoteca") {
          input.value = val.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + " años";
        } else if (inputId === "cuota-hipoteca") {
          input.value = val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',') + " €";
        } else {
          input.value = val.toLocaleString('es-ES') + " €";
        }
      });
    }

    [
      "precio-compraventa",
      "reforma",
      "gastos-compra",
      "coste-total-adquisicion",
      "alquiler",
      "ibi",
      "comunidad",
      "seguros",
      "otros_gastos",
      "porcentaje-hipoteca",
      "interes-hipoteca",
      "variacion-hipoteca",
      "plazo-hipoteca",
      "importe-no-financiado",
      "cuota-hipoteca",
      "capital-aportado"
    ].forEach(aplicarFormatoMoneda);

    // Actualizar coste total de adquisición al cambiar precio o reforma
    function actualizarCostesAdquisicion() {
      const precioCompraventa = parseInt(document.getElementById("precio-compraventa").value.replace(/[^\d]/g, '')) || 0;
      const reforma = parseInt(document.getElementById("reforma").value.replace(/[^\d]/g, '')) || 0;
      const tasaITPlocal = comunidadAutonomica ? tasasITP[comunidadAutonomica] || 0.07 : 0.07;
      const porcentajeGastosLocal = 0.02;
      const gastosCompraLocal = Math.round(precioCompraventa * (tasaITPlocal + porcentajeGastosLocal));
      const costeTotalAdquisicionLocal = precioCompraventa + (gastosCompraLocal || 0) + (reforma || 0);

      document.getElementById("gastos-compra").value = gastosCompraLocal ? gastosCompraLocal.toLocaleString('es-ES') + ' €' : '';
      document.getElementById("coste-total-adquisicion").value = costeTotalAdquisicionLocal ? costeTotalAdquisicionLocal.toLocaleString('es-ES') + ' €' : '';
      costeTotalAdquisicion = costeTotalAdquisicionLocal;
      actualizarFinanciacion();
    }

    document.getElementById("precio-compraventa").addEventListener("blur", () => {
      aplicarFormatoMoneda("precio-compraventa");
      actualizarCostesAdquisicion();
    });
    document.getElementById("reforma").addEventListener("blur", () => {
      aplicarFormatoMoneda("reforma");
      actualizarCostesAdquisicion();
    });

    function mostrarToast(mensaje) {
      let overlay = document.getElementById("brikklens-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "brikklens-overlay";
        const toast = document.createElement("div");
        toast.id = "brikklens-toast";
        overlay.appendChild(toast);
        document.body.appendChild(overlay);
        const widgetEl = document.getElementById("brikklens-widget");
        if (widgetEl) {
          overlay.style.bottom = `${parseInt(widgetEl.style.bottom) + widgetEl.offsetHeight + 10}px`;
          overlay.style.right = widgetEl.style.right;
        }
      }
      const toast = document.getElementById("brikklens-toast");
      toast.textContent = mensaje;
      overlay.classList.add("active");
      setTimeout(() => overlay.classList.remove("active"), 2500);
    }

    // Verificar cambios de precio en favoritos
    async function verificarPreciosFavoritos() {
      chrome.storage.local.get(["brikk_favoritos"], async (res) => {
        const favoritos = res.brikk_favoritos || [];
        for (const favorito of favoritos) {
          if (favorito.alertasActivas !== false) {
            try {
              const response = await fetch(favorito.url);
              const html = await response.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, "text/html");
              const nuevoPrecioTexto = doc.querySelector('[data-test="price-value"]')?.innerText ||
                Array.from(doc.querySelectorAll("span,h1,h2")).map(e => e.innerText).find(txt => txt.includes("€") && /\d/.test(txt));
              const nuevoPrecioLimpio = nuevoPrecioTexto?.replace(/[^\d]/g, '');
              const nuevoPrecio = parseInt(nuevoPrecioLimpio);

              if (nuevoPrecio && favorito.precio !== nuevoPrecio) {
                const diferencia = favorito.precio - nuevoPrecio;
                const mensaje = diferencia > 0
                  ? `📉 Precio de ${favorito.titulo} bajó de ${favorito.precio.toLocaleString()} € a ${nuevoPrecio.toLocaleString()} € (-${Math.abs(diferencia).toLocaleString()} €)`
                  : `📈 Precio de ${favorito.titulo} subió de ${favorito.precio.toLocaleString()} € a ${nuevoPrecio.toLocaleString()} € (+${Math.abs(diferencia).toLocaleString()} €)`;
                chrome.notifications.create({
                  type: "basic",
                  iconUrl: "icon48.png",
                  title: "Cambio de precio detectado",
                  message: mensaje,
                  priority: 2
                });
                favorito.precio = nuevoPrecio;
                chrome.storage.local.set({ brikk_favoritos: favoritos });
              }
            } catch (error) {
              console.error(`Error al verificar precio para ${favorito.url}:`, error);
            }
          }
        }
      });
    }

async function analyzeWithAI() {
  const aiButton = document.getElementById('brikk-ai-btn');
  aiButton.textContent = '🤖 Analizando...';
  aiButton.disabled = true;

  const analysisContainer = document.getElementById('ai-analysis');
  analysisContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; padding: 20px 0; color: #5A46A0;">
        <div class="brikk-loader"></div>
        <p style="margin-top: 10px; font-size: 13px;">Analizando, por favor espera...</p>
    </div>
  `;

  try {
    const analysisResult = await analizarConIA(propertyData);
    displayAnalysis(analysisResult);
    ultimoAnalisisRealizado = analysisResult

    chrome.storage.local.get({ "brikk_favoritos": [] }, (res) => {
      let favoritos = res.brikk_favoritos;
      const currentUrlPath = new URL(propertyData.url).pathname;
      const index = favoritos.findIndex(fav => new URL(fav.url).pathname === currentUrlPath);

      if (index !== -1) {
        // --- INICIO DEL CAMBIO IMPORTANTE ---
        // En lugar de modificar el array existente, creamos uno nuevo.
        const nuevosFavoritos = favoritos.map((favorito, i) => {
          // Si este es el favorito que queremos actualizar...
          if (i === index) {
            // ...devolvemos una nueva versión fusionando el favorito antiguo con los nuevos datos del análisis.
            return { ...favorito, ...analysisResult };
          }
          // Si no, devolvemos el favorito sin cambios.
          return favorito;
        });
        // --- FIN DEL CAMBIO IMPORTANTE ---

        // Guardamos el array completamente nuevo.
        chrome.storage.local.set({ brikk_favoritos: nuevosFavoritos }, () => {
          console.log("¡NUEVO ARRAY de favoritos guardado en memoria!");
          mostrarToast("⭐ Favorito actualizado con análisis");
        });

      } else {
        console.log("AVISO: La propiedad analizada no se encontró en la lista de favoritos.");
      }
    });

  } catch (error) {
    console.error("Fallo completo del análisis IA:", error);
    mostrarToast('❌ El análisis con IA falló.');
    document.getElementById('ai-analysis').innerHTML = `<div style="color:red;">Error en el análisis.</div>`;
  } finally {
    aiButton.textContent = '🤖 Analizar inversión con IA';
    aiButton.disabled = false;
  }
}
document.getElementById("brikk-copy-btn").addEventListener("click", () => {
      // Construimos el nuevo texto usando el objeto 'propertyData'
      // para asegurar que tenemos la información más reciente y correcta.
      const textoACopiar = `
💶 Precio: ${propertyData.precio?.toLocaleString('es-ES') || 'N/D'} €
📍 Ubicación: ${propertyData.municipio || 'N/D'}
📐 Superficie: ${propertyData.superficie || 'N/D'} m²
🛏️ Habitaciones: ${propertyData.habitaciones || 'N/D'}
📏 €/m²: ${propertyData.precioPorM2?.toLocaleString('es-ES') || 'N/D'} €/m²
🔗 ${propertyData.url}
      `.trim(); // Usamos trim() para eliminar espacios en blanco innecesarios

      // Copiamos el nuevo texto al portapapeles
      navigator.clipboard.writeText(textoACopiar).then(() => {
        mostrarToast("📋 Datos actualizados copiados");
      });
    });

document.getElementById("brikk-fav-btn").addEventListener("click", () => {
      chrome.storage.local.get({ "brikk_favoritos": [] }, (res) => {
        let favoritos = res.brikk_favoritos;
        
        if (favoritos.some(f => f.url === propertyData.url)) {
          mostrarToast("❗ Este inmueble ya está guardado");
          return;
        }

        // Creamos un objeto favorito base con los datos por defecto
        let nuevoFavorito = {
          url: propertyData.url,
          titulo: propertyData.titulo,
          precio: propertyData.precio,
          direccion: propertyData.municipio,
          habitaciones: propertyData.habitaciones,
          semaforo: "🟡",
          veredicto: "Sin analizar",
          resumen: null,
          analisis_financiero: null,
          analisis_mercado: null,
          estrategia_inversion: null,
          status: "Prospecto",
          notes: "",
          alertasActivas: false
        };

        // Si hay un análisis reciente en nuestra "memoria", lo fusionamos
        if (ultimoAnalisisRealizado) {
          console.log("Usando análisis en memoria para guardar el nuevo favorito.");
          nuevoFavorito = { ...nuevoFavorito, ...ultimoAnalisisRealizado };
        }

        favoritos.push(nuevoFavorito);
        
        chrome.storage.local.set({ brikk_favoritos: favoritos }, () => {
          mostrarToast("✅ Inmueble guardado en favoritos");
        });
      });
    });

    document.getElementById("brikk-ai-btn").addEventListener("click", analyzeWithAI);

    document.getElementById("brikk-calc-btn").addEventListener("click", () => {
      const form = document.getElementById("brikk-calc-form");
      form.style.display = form.style.display === "none" ? "block" : "none";
    });

    // Mostrar/ocultar campos hipoteca y ajustar campos de variable
    document.getElementById("usar-hipoteca").addEventListener("change", (e) => {
      const visible = e.target.checked;
      const camposHipoteca = document.getElementById("campos-hipoteca");
      camposHipoteca.style.display = visible ? "block" : "none";
      if (visible) actualizarFinanciacion();
    });

    document.querySelectorAll('input[name="tipo-hipoteca"]').forEach(radio => {
      radio.addEventListener("change", () => {
        actualizarFormularioHipoteca(); // Llama a la nueva función de UI
        actualizarFinanciacion();   // Llama a la función de cálculo
      });
    });

    // Llama a la función una vez al principio para establecer el estado inicial correcto
    actualizarFormularioHipoteca();


    // ... aquí termina el código anterior (probablemente un addEventListener) ...

// =================================================================
// PEGA LA NUEVA FUNCIÓN COMPLETA EXACTAMENTE AQUÍ
// =================================================================
function actualizarFormularioHipoteca() {
  const tipoSeleccionado = document.querySelector('input[name="tipo-hipoteca"]:checked').value;
  const interesLabel = document.getElementById('interes-label');
  const interesInput = document.getElementById('interes-hipoteca');
  
  // Ocultamos/mostramos los campos del EURIBOR
  const euriborContainer = document.getElementById('euribor-container');
  const variacionLabel = document.getElementById('variacion-label');
  const variacionInput = document.getElementById('variacion-hipoteca');

  if (tipoSeleccionado === 'fija') {
    interesLabel.textContent = 'Tasa de interés anual (fija)';
    interesInput.placeholder = '📊 Interés anual (ej. 2,5%)';
    
    // Ocultamos todo lo relacionado con el EURIBOR
    if (euriborContainer) euriborContainer.style.display = 'none';
    variacionLabel.style.display = 'none';
    variacionInput.style.display = 'none';

  } else { // Si es 'variable'
    interesLabel.textContent = 'Diferencial sobre el EURIBOR';
    interesInput.placeholder = '📊 Diferencial (ej. 1,5%)';

    // Mostramos todo lo relacionado con el EURIBOR
    if (euriborContainer) euriborContainer.style.display = 'block';
    variacionLabel.style.display = 'block';
    variacionInput.style.display = 'block';
  }
}

// Y justo debajo de tu nueva función, debe estar la que ya tenías:
// Actualizar campos de financiación automáticamente

function actualizarFinanciacion() {
  const usarHipoteca = document.getElementById("usar-hipoteca").checked;
  // ... resto de la función ...
}
function actualizarFormularioHipoteca() {
  const tipoSeleccionado = document.querySelector('input[name="tipo-hipoteca"]:checked').value;
  const interesLabel = document.getElementById('interes-label');
  const interesInput = document.getElementById('interes-hipoteca');
  const variacionLabel = document.getElementById('variacion-label');
  const variacionInput = document.getElementById('variacion-hipoteca');
  const euriborContainer = document.getElementById('euribor-container');

  if (tipoSeleccionado === 'fija') {
    interesLabel.textContent = 'Tasa de interés anual (fija)';
    interesInput.placeholder = '📊 Interés anual (ej. 3%)';
    euriborContainer.style.display = 'none';
    variacionLabel.style.display = 'none';
    variacionInput.style.display = 'none';

  } else { // Si es 'variable'
    interesLabel.textContent = 'Diferencial sobre el Euribor';
    interesInput.placeholder = '📊 Diferencial (ej. 0,9%)';
    euriborContainer.style.display = 'block';
    variacionLabel.style.display = 'block';
    variacionInput.style.display = 'block';
  }
}
    // Actualizar campos de financiación automáticamente
    function actualizarFinanciacion() {
      const usarHipoteca = document.getElementById("usar-hipoteca").checked;
      if (!usarHipoteca || document.getElementById("campos-hipoteca").style.display !== "block") return;

      const precioCompraventa = parseInt(document.getElementById("precio-compraventa").value.replace(/[^\d]/g, '')) || 0;
      const porcentajeHipoteca = parseFloat(document.getElementById("porcentaje-hipoteca").value.replace(/[^\d,]/g, '').replace(',', '.')) / 100 || 0;
      const interesAnual = parseFloat(document.getElementById("interes-hipoteca").value.replace(/[^\d,]/g, '').replace(',', '.')) / 100 || 0;
      const variacionAnual = parseFloat(document.getElementById("variacion-hipoteca").value.replace(/[^\d,]/g, '').replace(',', '.')) / 100 || 0.005;
      const plazoAnos = parseInt(document.getElementById("plazo-hipoteca").value.replace(/[^\d]/g, '')) || 0;
      const gastosCompraLocal = parseInt(document.getElementById("gastos-compra").value.replace(/[^\d]/g, '')) || 0;
      const reformaLocal = parseInt(document.getElementById("reforma").value.replace(/[^\d]/g, '')) || 0;

      const importeFinanciado = precioCompraventa * porcentajeHipoteca;
      const importeNoFinanciado = precioCompraventa - importeFinanciado;
      document.getElementById("importe-no-financiado").value = importeNoFinanciado ? importeNoFinanciado.toLocaleString('es-ES') + ' €' : '';

      const tipoHipoteca = document.querySelector('input[name="tipo-hipoteca"]:checked').value;
      let cuotaMensual = 0;
      if (tipoHipoteca === "fija" && interesAnual > 0 && plazoAnos > 0) {
        const interesMensual = interesAnual / 12;
        const numPagos = plazoAnos * 12;
        cuotaMensual = importeFinanciado * (interesMensual * Math.pow(1 + interesMensual, numPagos)) / (Math.pow(1 + interesMensual, numPagos) - 1) || 0;
      } else if (tipoHipoteca === "variable" && interesAnual > 0 && plazoAnos > 0) {
        const euriborBaseTexto = document.getElementById('euribor-base').value || '0%';
const euriborBase = parseFloat(euriborBaseTexto.replace(/[^\d,]/g, '').replace(',', '.')) / 100 || 0;
      const interesTotal = euriborBase + interesAnual; // "interesAnual" ahora es el diferencial
        const interesMensual = interesTotal / 12;
        const numPagos = plazoAnos * 12;
        cuotaMensual = importeFinanciado * (interesMensual * Math.pow(1 + interesMensual, numPagos)) / (Math.pow(1 + interesMensual, numPagos) - 1) || 0;
      }

      document.getElementById("cuota-hipoteca").value = !isNaN(cuotaMensual) ? cuotaMensual.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',') + ' €' : '';
      document.getElementById("rango-cuota").style.display = "none";

      const capitalAportado = importeNoFinanciado + (gastosCompraLocal || 0) + (reformaLocal || 0);
      document.getElementById("capital-aportado").value = capitalAportado ? capitalAportado.toLocaleString('es-ES') + ' €' : '';
    }

    ["porcentaje-hipoteca", "interes-hipoteca", "variacion-hipoteca", "plazo-hipoteca"].forEach(id => {
      document.getElementById(id).addEventListener("blur", () => {
        aplicarFormatoMoneda(id);
        actualizarFinanciacion();
      });
    });

    // Evento para calcular rentabilidad
    document.getElementById("calcular-roi").addEventListener("click", () => {
      const parseValor = (id) => {
        const val = document.getElementById(id)?.value || "";
        return parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      };

      const alquiler = parseValor("alquiler");
      const ibi = parseValor("ibi");
      const gastosComunidad = parseValor("comunidad");
      const seguros = parseValor("seguros");
      const otros_gastos = parseValor("otros_gastos");
      const reformaROI = parseValor("reforma");
      const gastosCompraROI = parseValor("gastos-compra");
      const costeTotalAdquisicionROI = parseValor("coste-total-adquisicion");
      const usarHipotecaROI = document.getElementById("usar-hipoteca").checked;
      const porcentajeHipotecaROI = parseValor("porcentaje-hipoteca") / 100;
      const interesAnualROI = parseValor("interes-hipoteca") / 100;
      const variacionAnualROI = parseValor("variacion-hipoteca") / 100;
      const plazoAnosROI = parseValor("plazo-hipoteca");
      const capitalAportadoROI = parseValor("capital-aportado");
      const cuotaMensualHipotecaROI = parseValor("cuota-hipoteca");
      const precioCompraventaROI = parseValor("precio-compraventa");

      if (
        !alquiler ||
        !costeTotalAdquisicionROI ||
        (usarHipotecaROI && (!porcentajeHipotecaROI || !interesAnualROI || !plazoAnosROI || !capitalAportadoROI))
      ) {
        const camposFaltantes = [];
        if (!alquiler) camposFaltantes.push("Alquiler mensual");
        if (!costeTotalAdquisicionROI) camposFaltantes.push("Coste total de adquisición");
        if (usarHipotecaROI) {
          if (!porcentajeHipotecaROI) camposFaltantes.push("Porcentaje de hipoteca");
          if (!interesAnualROI) camposFaltantes.push("Interés anual o diferencial");
          if (!plazoAnosROI) camposFaltantes.push("Plazo de hipoteca");
          if (!capitalAportadoROI) camposFaltantes.push("Capital aportado");
        }
        mostrarToast(`⚠️ Completa los siguientes campos: ${camposFaltantes.join(", ")}`);
        return;
      }

      const ingresosAnuales = alquiler * 12;
      const gastosAnuales = ibi + gastosComunidad + seguros + otros_gastos;
      const cuotasAnuales = usarHipotecaROI ? cuotaMensualHipotecaROI * 12 : 0;
      const importeFinanciadoROI = precioCompraventaROI * porcentajeHipotecaROI;
      const interesesAnuales = usarHipotecaROI ? (importeFinanciadoROI * interesAnualROI) : 0;
      const cashflowAnual = ingresosAnuales - gastosAnuales - cuotasAnuales;
      const cashflowMensual = cashflowAnual / 12;
      const costeFinal = costeTotalAdquisicionROI + (reformaROI || 0) + (gastosCompraROI || 0);

      const rentabilidadBruta = (ingresosAnuales / costeFinal) * 100;
      const rentabilidadNeta = (ingresosAnuales - gastosAnuales - interesesAnuales) / costeFinal * 100;

      const beneficioAnual = ingresosAnuales - gastosAnuales - (usarHipotecaROI ? cuotasAnuales : 0);
      const roce = (beneficioAnual / capitalAportadoROI) * 100;
      const payback = beneficioAnual > 0 ? (capitalAportadoROI / beneficioAnual).toFixed(1) : "∞";

      const resultados = `
        📈 <b>Rentabilidad Bruta:</b> ${rentabilidadBruta.toFixed(1)}%<br/>
        💸 <b>Rentabilidad Neta:</b> ${rentabilidadNeta.toFixed(1)}%<br/>
        💰 <b>Cashflow Anual:</b> ${cashflowAnual.toFixed(0)} €<br/>
        📅 <b>Cashflow Mensual:</b> ${cashflowMensual.toFixed(0)} €<br/>
        🔁 <b>ROCE:</b> ${roce.toFixed(1)}%<br/>
        ⏳ <b>Payback:</b> ${payback} años
      `;

      document.getElementById("resultados-roi").innerHTML = resultados;
      document.getElementById("resultados-roi").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Reiniciar formulario
    document.getElementById("reiniciar-form").addEventListener("click", () => {
      document.getElementById("precio-compraventa").value = precio ? precio.toLocaleString('es-ES') + ' €' : '';
      document.getElementById("reforma").value = '';
      document.getElementById("gastos-compra").value = gastosCompra ? gastosCompra.toLocaleString('es-ES') + ' €' : '';
      document.getElementById("coste-total-adquisicion").value = costeTotalAdquisicion ? costeTotalAdquisicion.toLocaleString('es-ES') + ' €' : '';
      document.getElementById("usar-hipoteca").checked = false;
      document.getElementById("campos-hipoteca").style.display = "none";
      document.querySelector('input[name="tipo-hipoteca"][value="fija"]').checked = true;
      document.getElementById("porcentaje-hipoteca").value = '';
      document.getElementById("interes-hipoteca").value = '';
      document.getElementById("variacion-hipoteca").value = '0,5%';
      document.getElementById("plazo-hipoteca").value = '';
      document.getElementById("cuota-hipoteca").value = '';
      document.getElementById("importe-no-financiado").value = '';
      document.getElementById("capital-aportado").value = '';
      document.getElementById("alquiler").value = '';
      document.getElementById("ibi").value = '';
      document.getElementById("comunidad").value = '';
      document.getElementById("seguros").value = '';
      document.getElementById("otros_gastos").value = '';
      document.getElementById("resultados-roi").innerHTML = '';
      document.getElementById("variacion-label").style.display = "none";
      document.getElementById("variacion-hipoteca").disabled = true;
      document.getElementById("rango-cuota").style.display = "none";
    });

   // --- Lógica para minimizar/restaurar el widget ---
    const minimizeBtn = document.getElementById('brikk-minimize-btn');
    const widgetEl = document.getElementById('brikklens-widget');

    minimizeBtn.addEventListener('click', () => {
      widgetEl.classList.toggle('minimized');
      
      const isMinimized = widgetEl.classList.contains('minimized');
      // Cambia entre el triángulo hacia abajo (maximizar) y hacia arriba (minimizar)
      minimizeBtn.innerHTML = isMinimized ? '&#9652;' : '&#9662;';
      minimizeBtn.title = isMinimized ? 'Mostrar' : 'Ocultar';
    });

    // Inicializaciones
    verificarPreciosFavoritos();
    setInterval(verificarPreciosFavoritos, 6 * 60 * 60 * 1000);
  } catch (error) {
    console.error('❌ Error en BrikkLens:', error);
    const errorWidget = document.createElement("div");
    errorWidget.id = "brikklens-widget";
    errorWidget.innerHTML = `<div style="color: red;">Error: Widget no se cargó. Detalle: ${error.message}</div>`;
    Object.assign(errorWidget.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: "#f9f7fc",
      padding: "10px",
      borderRadius: "6px",
      border: "1px solid #d3c2f1",
      zIndex: "99999"
    });
    document.body.appendChild(errorWidget);
  }
});
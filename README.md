📊 Brikk Copilot - Extensión de Chrome

Brikk Copilot es una extensión de navegador diseñada para ser el co-piloto indispensable del inversor inmobiliario en España. Se integra directamente en el portal Idealista para ofrecer un análisis de inversión completo, impulsado por IA, directamente en la página del anuncio.

Este proyecto nació de la necesidad de acelerar y profesionalizar el proceso de análisis de propiedades, reemplazando horas de trabajo manual en hojas de cálculo por un informe instantáneo y accionable.

-----

✨ Características Principales
Análisis Instantáneo con IA: Obtén un análisis financiero proforma completo con un solo clic, incluyendo:

Veredicto y Semáforo (🟢🟡🔴) para una evaluación rápida.

Métricas financieras clave como Cash Flow mensual, ROCE y Rentabilidad Neta.

Análisis de Mercado con comparativa de precio/m² y potencial de revalorización.

Estrategia de Inversión con puntos de negociación y sugerencias de valor añadido.

Panel de Favoritos Avanzado: Un CRM completo para tus prospectos.

Guarda, filtra y ordena propiedades.

Añade notas personales y gestiona el estado de cada inversión (Prospecto, Visitado, etc.).

Compara hasta 3 propiedades en una tabla editable.

Exporta todos tus datos a un archivo CSV.

Calculadora de Rentabilidad Manual: Simula tus propias condiciones de financiación (hipoteca fija/variable) y gastos para un cálculo 100% personalizado.

Interfaz Moderna y No Intrusiva: Un widget elegante que se puede minimizar o cerrar para no interferir con tu navegación.

🛠️ Tecnologías Utilizadas
Este proyecto está dividido en dos partes principales: la extensión del lado del cliente y un backend serverless.

Extensión (Frontend):

HTML5

CSS3

JavaScript (Vanilla JS)

APIs de Extensiones de Chrome (chrome.storage, chrome.runtime, etc.)

Servidor (Backend):

Node.js

Vercel Serverless Functions para alojar el endpoint de la API.

APIs Externas:

xAI API (Grok) para el análisis de IA.

🚀 Instalación y Puesta en Marcha (para Desarrolladores)
Si quieres ejecutar este proyecto en tu propio entorno de desarrollo, sigue estos pasos:

1. Configurar el Servidor (brikklens-api)
Clona el repositorio del servidor:

Bash

git clone https://github.com/Kolasnikov/brikklens-api.git
cd brikklens-api
Despliega en Vercel: Importa el repositorio a tu cuenta de Vercel.

Configura las Variables de Entorno: En el panel de tu proyecto en Vercel, añade tu clave de API de xAI como una variable de entorno. Por ejemplo:

XAI_API_KEY = xai-xxxxxxxxxx

2. Configurar la Extensión
Clona el repositorio de la extensión:

Bash

git clone https://github.com/Kolasnikov/brikk-chrome-extension.git
cd brikk-chrome-extension
Actualiza la URL del Servidor: En el archivo content.js, asegúrate de que la URL en la función analizarConIA apunte a tu propio despliegue de Vercel.

Carga la extensión en Chrome:

Abre Chrome y ve a chrome://extensions.

Activa el "Modo de desarrollador" en la esquina superior derecha.

Haz clic en "Cargar descomprimida" y selecciona la carpeta de tu extensión.

¡Y listo! Ahora la extensión debería estar funcionando en tu navegador, conectada a tu propio servidor.

Este proyecto es un MVP (Producto Mínimo Viable) en constante evolución. Cualquier feedback o contribución es bienvenida.

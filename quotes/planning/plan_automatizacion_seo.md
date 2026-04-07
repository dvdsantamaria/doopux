# Plan de Automatización SEO con IA (Weekly Retainer)

Este documento detalla cómo ejecutar el *Weekly Retainer* propuesto utilizando Inteligencia Artificial para maximizar la eficiencia y reducir las horas operativas a casi cero en las tareas de reporte y análisis, dejando el esfuerzo humano exclusivamente para la implementación técnica y el diseño.

## 1. Automatización del Reporte Semanal (Zero-Touch Reporting)

El objetivo es que todos los lunes se genere y envíe un reporte de alto valor sin intervención manual, combinando extracción de datos y el análisis de un LLM.

### Arquitectura de la Solución

**Paso 1: Extracción de Datos (Cron Job dominical)**
- **Google Search Console API:** Extraer métricas clave de los últimos 7 días frente a los 7 días anteriores (Impresiones, Clicks, CTR, Posición Promedio) y el top de movimientos de keywords.
- **Google Analytics 4 API:** Extraer el tráfico específico de la página de contacto u otros eventos de conversión.

**Paso 2: Análisis Automatizado (API de LLM como OpenAI / Anthropic)**
- Un script envía un payload JSON con los datos crudos al modelo con un *System Prompt* estricto.
- **Ejemplo de Prompt:** *"Eres un consultor SEO experto. Compara los datos de esta semana con la anterior para una empresa constructora. Redacta en formato Markdown directo al cliente: 1) Top movimientos de keywords, 2) Resumen corto del tráfico (impresiones y clicks), 3) 'One key win' (un logro destacado basado en los datos), 4) Una acción recomendada para la semana que viene."*

**Paso 3: Ensamblaje y Envío**
- El script (Python o Node.js) toma el Markdown generado por la IA, lo inyecta en una plantilla HTML/PDF y lo envía vía email (usando un servicio como Resend o Amazon SES) directamente al cliente. 
- *Alternativa:* Puede enviarse primero a un canal de Slack/Discord interno para que le des el "OK" antes de que le llegue al cliente.

---

## 2. Ejecución de las Actividades Semanales con IA

A continuación, cómo se aborda cada punto del *Weekly Retainer* separando lo que automatiza la IA de lo que requiere intervención humana:

### 🟢 100% Automatizable (Cero horas humanas tras el setup)

*   **Search Console monitoring:** Se lee vía API. La IA interpreta las tendencias (caídas o subidas) y te alerta por Slack solo si hay un problema técnico urgente que requiere tu atención.
*   **Keyword ranking tracking:** Se trackea automáticamente en el script semanal comparando las posiciones promedio.
*   **Weekly Report (Every Monday):** Completamente generado y sintetizado por la IA a partir de los datos recolectados (ver sección 1).

### 🟡 Híbrido: Inteligencia + Operador (Poco tiempo humano)

*   **On-page copy updates and optimisation tweaks:**
    *   **Rol de la IA:** A través de herramientas o prompts manuales, la IA identifica cómo mejorar el texto para CTR (nuevos títulos, reescritura de párrafos con mejores palabras clave).
    *   **Rol Humano:** Copiar, revisar el tono comercial y pegar el texto final en el código fuente o CMS.
*   **FAQ content additions as Google surfaces new question patterns:**
    *   **Rol de la IA:** Un script o la IA busca las nuevas preguntas frecuentes ("People Also Ask") para el nicho y redacta las respuestas formateadas en JSON-LD (Schema `FAQPage`).
    *   **Rol Humano:** Validar las respuestas y subir el bloque de código a la web.

### 🔴 Cuellos de Botella (Donde se cobra el trabajo humano técnico)

Aquí es donde la IA actúa actuará como tu consultor o diagnosticador, pero la ejecución requiere *poner manos a la obra*. Estas son las tareas por las que el cliente realmente está pagando tu expertise técnico y tiempo de implementación:

*   **Technical fixes as flagged by Search Console:**
    *   **Diagnóstico (IA):** Google te envía un error de "Core Web Vitals", bloqueo de recursos, o discrepancia en canonicals. La IA te explica por qué pasó.
    *   **Implementación (Humano):** Debes ir al código fuente de la web, refactorizar CSS/JS, optimizar imágenes, arreglar el bug localmente, hacer testing y hacer el deploy a producción.
*   **New page or content section recommendations as opportunities appear:**
    *   **Diagnóstico (IA):** Detecta que hay un volumen de búsqueda alto para "Home extensions in Newcastle" y te da el *wireframe* o el texto de la landing.
    *   **Implementación (Humano):** Tienes que maquetar esa nueva página entera, asegurarte de que luzca visualmente espectacular basada en el sistema de diseño, aplicar los estilos correctamente y agregarla a la arquitectura del sitio.
*   **Local SEO & Backlink monitoring:**
    *   **Implementación (Humano):** Analizar por qué se perdieron enlaces o actualizar promociones, fotos de obras recientes e información precisa en los perfiles de Google Business no se puede delegar 100% a la IA sin correr riesgos de marca. Requiere revisión manual.

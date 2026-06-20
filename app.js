// Configuración de conexión a tu Supabase (Accesos Oficiales de Encuéntralo PZO)
const SUPABASE_URL = 'https://xhgsxguqivqmkmbphgfm.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZ3N4Z3VxaXZxbWttYnBoZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjMwMzYsImV4cCI6MjA5NjkzOTAzNn0.BD8GToWv_sAYPWx4Rmnxzom_ebHnc0ZQNNIaViBeMd4'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Listado estático de referencia para los nombres de categorías base
const CATEGORIAS_BASE = {
    1: "🍰 Pastelerías y Reposterías",
    2: "🍔 Restaurantes y Comida Rápida",
    3: "🛠️ Ferreterías y Construcción",
    4: "🏍️ Repuestos y Mecánica",
    5: "🛍️ Tiendas de Ropa y Calzado"
};

// Captura de los elementos REALES de tu index.html
const inputBusqueda = document.getElementById('input-busqueda');
const btnBuscar = document.getElementById('btn-buscar');
const contenedorComercios = document.getElementById('resultados-busqueda');

// Caché optimizada en memoria para búsquedas instantáneas en Guayana
let todosLosNegociosActivos = [];
let negociosFiltradosEnMemoria = [];

// FUNCIÓN AUXILIAR PRO: Limpia mayúsculas, espacios y remueve acentos para evitar fallos de escritura
function normalizarTextoParaFiltro(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// PASO 1: Descargar base de datos inicial de Supabase al entrar
async function inicializarInterfaz() {
    contenedorComercios.innerHTML = "<p style='text-align:center; color:#666; font-size:14px;'>Sincronizando comercios de Guayana...</p>";
    
    try {
        const { data: negocios, error } = await supabaseClient
            .from('negocios')
            .select('*')
            .eq('estado', 'activo');

        if (error) throw error;

        todosLosNegociosActivos = negocios || [];
        negociosFiltradosEnMemoria = [...todosLosNegociosActivos];
        
        // Renderizamos inicialmente tus hermosos botones de categorías
        mostrarArbolCategoriasDisponibles();

    } catch (err) {
        console.error("Error de sincronización inicial:", err.message);
        contenedorComercios.innerHTML = "<p style='text-align:center; color:red; font-size:14px;'>Error de conexión con el servidor comercial.</p>";
    }
}

// PASO 2: RENDERIZA TUS BOTONES OVALADOS HORIZONTALES E INYECTA EL ICONO DE PROMOCIONES EN FILA
function mostrarArbolCategoriasDisponibles() {
    let mapaContador = {};
    
    todosLosNegociosActivos.forEach(negocio => {
        let nombreRubro = "";
        if (negocio.categoria_id && negocio.categoria_id !== 99) {
            nombreRubro = CATEGORIAS_BASE[negocio.categoria_id] || "Otros Rubros";
        } else {
            nombreRubro = negocio.categoria_nombre || "⚠️ Rubro sin clasificar";
        }
        mapaContador[nombreRubro] = (mapaContador[nombreRubro] || 0) + 1;
    });

    let htmlBotones = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            <span style="font-weight: bold; color: #444; font-size: 15px;">Explora por categorías:</span>
            <button onclick="cargarPantallaSoloPromociones()" style="background-color: #FF5722; border: none; border-radius: 25px; padding: 6px 16px; font-size: 13px; font-weight: bold; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(255,87,34,0.25);">
                <span>🔥 PROMOCIONES</span>
            </button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; align-items: center; margin-top: 5px;">
    `;
    
    Object.keys(mapaContador).sort().forEach(rubro => {
        let rubroLimpio = rubro.replace(/[\u1F00-\u1F9F]|[\u2700-\u27BF]|[\u2600-\u26FF]/g, "").trim();
        
        htmlBotones += `
            <button onclick="filtrarPorRubroSeleccionado('${rubro}')" style="background-color: white; border: 1px solid #eef2f5; border-radius: 25px; padding: 10px 22px; font-size: 14px; font-weight: bold; color: #222; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
                <span style="color: #FF5722;">✨</span>
                <span>${rubroLimpio.toUpperCase()}</span>
            </button>
        `;
    });

    htmlBotones += '</div>';
    contenedorComercios.innerHTML = htmlBotones;
}

// PASO 3: Filtrar comercios al hacer clic en un rubro específico
function filtrarPorRubroSeleccionado(nombreRubro) {
    let filtrados = todosLosNegociosActivos.filter(negocio => {
        let rubroTienda = (negocio.categoria_id && negocio.categoria_id !== 99) 
            ? CATEGORIAS_BASE[negocio.categoria_id] 
            : negocio.categoria_nombre;
        return rubroTienda === nombreRubro;
    });

    renderizarTarjetasEnLista(filtrados, `Rubro: ${nombreRubro}`);
}

// PASO 4: Motor de búsqueda al vuelo unificado (Filtra por nombre, tags o dirección)
// PASO 4: Motor de búsqueda REESTRUCTURADO (Categorías Primero)
function ejecutarFiltroBuscadorGeneral() {
    const palabraClave = normalizarTextoParaFiltro(inputBusqueda.value);
    
    if (palabraClave === "") {
        mostrarArbolCategoriasDisponibles();
        return;
    }

    // 1. Filtramos los negocios que coinciden
    let resultados = todosLosNegociosActivos.filter(negocio => {
        const nombre = normalizarTextoParaFiltro(negocio.nombre_negocio);
        const tags = normalizarTextoParaFiltro(negocio.productos_tags);
        const direccion = normalizarTextoParaFiltro(negocio.direccion);
        return nombre.includes(palabraClave) || tags.includes(palabraClave) || direccion.includes(palabraClave);
    });

    if (resultados.length === 0) {
        contenedorComercios.innerHTML = "<p style='text-align:center; color:#888; padding: 20px;'>No encontramos comercios que coincidan con tu búsqueda.</p>";
        return;
    }

    // 2. Extraemos categorías únicas de los resultados encontrados
    const categoriasUnicas = [...new Set(resultados.map(n => {
        return (n.categoria_id && n.categoria_id !== 99) ? CATEGORIAS_BASE[n.categoria_id] : n.categoria_nombre;
    }))];

    // 3. Renderizamos botones de categorías para que el usuario elija
    let htmlBotones = `
        <div style="margin-bottom: 20px; text-align: center;">
            <h3 style="color: #444;">Categorías encontradas:</h3>
            <p style="font-size: 13px; color: #666;">Selecciona una para ver los negocios:</p>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 15px;">
    `;

    categoriasUnicas.forEach(cat => {
        htmlBotones += `
            <button onclick="filtrarBusquedaPorCategoria('${cat}', '${inputBusqueda.value}')" 
            style="background: white; border: 1px solid #007BFF; border-radius: 20px; padding: 8px 16px; font-weight: bold; color: #007BFF; cursor: pointer;">
                ${cat}
            </button>
        `;
    });
    htmlBotones += `</div></div>`;
    
    contenedorComercios.innerHTML = htmlBotones;
}

// NUEVA FUNCIÓN AUXILIAR PARA EL FILTRO FINAL
function filtrarBusquedaPorCategoria(catElegida, terminoBusqueda) {
    const filtrados = todosLosNegociosActivos.filter(n => {
        const rubro = (n.categoria_id && n.categoria_id !== 99) ? CATEGORIAS_BASE[n.categoria_id] : n.categoria_nombre;
        const nombre = normalizarTextoParaFiltro(n.nombre_negocio);
        const tags = normalizarTextoParaFiltro(n.productos_tags);
        const direccion = normalizarTextoParaFiltro(n.direccion);
        const terminoNormalizado = normalizarTextoParaFiltro(terminoBusqueda);
        
        return rubro === catElegida && (nombre.includes(terminoNormalizado) || tags.includes(terminoNormalizado) || direccion.includes(terminoNormalizado));
    });

    renderizarTarjetasEnLista(filtrados, `Resultados en "${catElegida}"`);
}

// PASO 5: Construir e inyectar las tarjetas de tiendas en el HTML
function renderizarTarjetasEnLista(listaNegocios, tituloContexto) {
    let htmlTarjetas = `
        <div style="margin-top: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin:0; font-size: 16px; color: #444;">${tituloContexto}</h3>
            <button onclick="mostrarArbolCategoriasDisponibles()" style="background: #e0e0e0; border: none; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; cursor: pointer;">⬅️ Volver</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 40px;">
    `;

    if (listaNegocios.length === 0) {
        htmlTarjetas += "<p style='text-align:center; color:#888; padding: 20px;'>No encontramos comercios que coincidan.</p></div>";
        contenedorComercios.innerHTML = htmlTarjetas;
        return;
    }

    listaNegocios.forEach(negocio => {
        let whatsappVisual = negocio.whatsapp;
        let linkMapsHTML = negocio.maps 
            ? `<a href="${negocio.maps}" target="_blank" onclick="event.stopPropagation();" style="color: #ff5722; font-size: 13px; font-weight: bold; text-decoration: underline;">📍 Ver Mapa</a>` 
            : "";

        htmlTarjetas += `
            <div onclick="window.location.href='perfil.html?id=${negocio.id}'" style="background: white; border-radius: 12px; border: 1px solid #eef2f5; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); cursor: pointer; display: flex; flex-direction: column; gap: 6px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <h4 style="margin: 0; font-size: 16px; color: #111;">${negocio.nombre_negocio}</h4>
                    <span style="font-size: 11px; background: #f0f4f8; color: #555; padding: 3px 8px; border-radius: 10px; font-weight: bold; white-space: nowrap;">
                        ${(negocio.categoria_id && negocio.categoria_id !== 99) ? CATEGORIAS_BASE[negocio.categoria_id] : (negocio.categoria_nombre || "General")}
                    </span>
                </div>

                <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.4;">
                    ${negocio.direccion}
                </p>

                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        ${linkMapsHTML}
                        <span style="color: #007BFF; font-size: 13px; font-weight: bold; text-decoration: underline;">📄 Ver Perfil</span>
                    </div>
                    
                    <a href="https://wa.me/${negocio.whatsapp}" target="_blank" onclick="event.stopPropagation();" style="background-color: #25D366; color: white; padding: 6px 12px; text-decoration: none; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(37, 211, 102, 0.15);">
                        💬 ${whatsappVisual}
                    </a>
                </div>
            </div>
        `;
    });

    htmlTarjetas += '</div>';
    contenedorComercios.innerHTML = htmlTarjetas;
}

// PASO 6: AL HACER CLIC EN EL ICONO, MUESTRA EL FORMATO EXACTO SOLICITADO
function cargarPantallaSoloPromociones() {
    const localesConOferta = todosLosNegociosActivos.filter(n => n.promocion_texto && n.promocion_texto.trim() !== "");

    let htmlPromos = `
        <div style="margin-top: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin:0; font-size: 16px; color: #dc3545; font-weight: bold;">🔥 Promociones Activas:</h3>
            <button onclick="mostrarArbolCategoriasDisponibles()" style="background: #e0e0e0; border: none; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; cursor: pointer;">⬅️ Volver</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 40px;">
    `;

    if (localesConOferta.length === 0) {
        htmlPromos += "<p style='text-align:center; color:#888; padding: 20px; font-style: italic;'>No hay promociones comerciales activas en este momento.</p></div>";
        contenedorComercios.innerHTML = htmlPromos;
        return;
    }

    localesConOferta.forEach(local => {
        htmlPromos += `
            <div style="background: white; border-radius: 10px; border: 1px dashed #dc3545; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 6px;">
                <div style="font-size: 14px; line-height: 1.5; color: #222;">
                    <strong style="color: #111;">${local.nombre_negocio.toUpperCase()}</strong> – <span style="font-weight: 500; color: #4a5568;">${local.promocion_texto}</span>
                </div>
                <div style="text-align: right; margin-top: 4px;">
                    <a href="perfil.html?id=${local.id}" style="color: #007BFF; font-size: 13px; font-weight: bold; text-decoration: underline;">Ver Perfil de la Empresa ➡️</a>
                </div>
            </div>
        `;
    });

    htmlPromos += '</div>';
    contenedorComercios.innerHTML = htmlPromos;
}

inputBusqueda.addEventListener('input', ejecutarFiltroBuscadorGeneral);
btnBuscar.addEventListener('click', ejecutarFiltroBuscadorGeneral);

inicializarInterfaz();
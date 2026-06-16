// Configuración de conexión a tu Supabase (Mismos accesos oficiales)
const SUPABASE_URL = 'https://xhgsxguqivqmkmbphgfm.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_ttX_2zAlp3GGNAqzeLUnAA_3Za4rFSf'; 
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
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remueve marcas de acentos de forma limpia
}

// Inicializador de categorías dinámicas en la página de inicio
async function inicializarInterfaz() {
    negociosFiltradosEnMemoria = [];
    if(inputBusqueda) inputBusqueda.value = ""; 
    
    if (contenedorComercios) {
        contenedorComercios.innerHTML = "<p style='text-align:center; color:#666; margin-top: 20px;'>Sincronizando los rubros comerciales de la ciudad...</p>";
    }

    // Descarga preventiva en segundo plano de todos los comercios aprobados para velocidad instantánea
    try {
        const { data, error } = await supabaseClient
            .from('negocios')
            .select('*')
            .eq('estado', 'activo');
            
        if (!error && data) {
            todosLosNegociosActivos = data;
        }
    } catch (e) {
        console.error("Error cargando caché inicial:", e);
    }

    // --- CONSTRUCCIÓN DINÁMICA FILTRADA: SOLO CATEGORÍAS CON COMERCIOS REALES ---
    let arrayCategoriasFinales = [];
    let rubrosVistos = new Set();

    // Recorremos los comercios descargados para extraer UNICAMENTE rubros que tengan tiendas reales activas
    todosLosNegociosActivos.forEach(negocio => {
        if (negocio.categoria_id !== 99) {
            const nombreBase = CATEGORIAS_BASE[negocio.categoria_id];
            if (nombreBase && !rubrosVistos.has(nombreBase.toLowerCase())) {
                rubrosVistos.add(nombreBase.toLowerCase());
                arrayCategoriasFinales.push({
                    esPersonalizada: false,
                    id: negocio.categoria_id,
                    nombre: nombreBase
                });
            }
        } else if (negocio.categoria_nombre && negocio.categoria_nombre.trim() !== "" && negocio.categoria_nombre !== "Ninguno (Eligió del listado)") {
            const nombrePersonalizado = negocio.categoria_nombre.trim();
            if (!rubrosVistos.has(nombrePersonalizado.toLowerCase())) {
                rubrosVistos.add(nombrePersonalizado.toLowerCase());
                arrayCategoriasFinales.push({
                    esPersonalizada: true,
                    id: 99,
                    nombre: nombrePersonalizado
                });
            }
        }
    });

    // CORRECCIÓN SÚPER PRO: Si no hay comercios activos en todo el sistema, mostramos un mensaje limpio
    if (arrayCategoriasFinales.length === 0) {
        if (contenedorComercios) {
            contenedorComercios.innerHTML = `
                <p style='text-align:center; color:#555; margin-top:30px; font-weight:500;'>
                    🚀 ¡El directorio inteligente está preparándose para el gran lanzamiento!<br>
                    <span style='font-size:13px; color:#888; font-weight:normal;'>Pronto verás los primeros comercios verificados de la ciudad aquí.</span>
                </p>`;
        }
        return;
    }

    // ORDEN ALFABÉTICO INTACTO: Ordenamos el arreglo de la A a la Z ignorando emojis iniciales
    arrayCategoriasFinales.sort((a, b) => {
        const textoA = a.nombre.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim().toLowerCase();
        const textoB = b.nombre.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim().toLowerCase();
        return textoA.localeCompare(textoB);
    });

    // Inyectamos la estructura visual exacta respetando tus colores, fuentes y tamaños de botón
    let htmlEstructura = `
        <div id="contenedor-bloque-categorias" style="width:100%;">
            <p style="text-align: center; font-weight: bold; color: #555; margin: 10px 0 15px 0; font-size: 14px;">
                Explora por categorías:
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 25px; justify-content: center;">
    `;
    
    arrayCategoriasFinales.forEach(cat => {
        if (!cat.esPersonalizada) {
            htmlEstructura += `
                <button onclick="cargarNegociosDirectoPorCategoria(${cat.id})" style="padding: 10px 16px; border: none; background: white; border-radius: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); color: #333; font-size: 14px; transition: all 0.2s; border: 1px solid #eaeaea;" onmouseover="this.style.background='#007BFF'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='#333';">
                    ${cat.nombre}
                </button>
            `;
        } else {
            htmlEstructura += `
                <button onclick="filtrarComerciosDirectoPorRubroPersonalizado('${cat.nombre}')" style="padding: 10px 16px; border: none; background: white; border-radius: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); color: #333; font-size: 14px; transition: all 0.2s; border: 1px solid #eaeaea;" onmouseover="this.style.background='#FF5722'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='#333';">
                    ✨ ${cat.nombre}
                </button>
            `;
        }
    });
    
    htmlEstructura += `
            </div>
        </div>
        <div id="bloque-comercios-dinamicos" style="width:100%;"></div>
    `;
    
    if (contenedorComercios) {
        contenedorComercios.innerHTML = htmlEstructura;
    }
}

// Cargar directo al hacer clic en las categorías principales raíz
async function cargarNegociosDirectoPorCategoria(idCategoria) {
    const bloqueComercios = document.getElementById('bloque-comercios-dinamicos');
    if (bloqueComercios) {
        bloqueComercios.innerHTML = "<p style='text-align:center; color:#666; margin-top: 20px;'>Cargando comercios...</p>";
    }
    
    const { data: negocios, error } = await supabaseClient
        .from('negocios')
        .select('*')
        .eq('estado', 'activo')
        .eq('categoria_id', idCategoria)
        .order('nombre_negocio', { ascending: true });

    mostrarTarjetasFinales(negocios, error);
}

// Cargar directo al hacer clic en un rubro dinámico personalizado
async function filtrarComerciosDirectoPorRubroPersonalizado(nombreRubro) {
    const bloqueComercios = document.getElementById('bloque-comercios-dinamicos');
    if (bloqueComercios) {
        bloqueComercios.innerHTML = "<p style='text-align:center; color:#666; margin-top: 20px;'>Filtrando rubros...</p>";
    }

    const { data: negocios, error } = await supabaseClient
        .from('negocios')
        .select('*')
        .eq('estado', 'activo')
        .eq('categoria_id', 99)
        .eq('categoria_nombre', nombreRubro)
        .order('nombre_negocio', { ascending: true });

    mostrarTarjetasFinales(negocios, error);
}

// Búsqueda inteligente por Texto Potenciada (Enter y Botón)
async function buscarPorTexto() {
    if (!inputBusqueda) return;
    const terminoOriginal = inputBusqueda.value.trim();
    const terminoLimpio = normalizarTextoParaFiltro(terminoOriginal);
    
    if (terminoLimpio === "") {
        inicializarInterfaz();
        return;
    }

    if (contenedorComercios) {
        contenedorComercios.innerHTML = "<p style='text-align:center; color:#666; margin-top: 20px;'>Buscando rubros relacionados...</p>";
    }

    let negocios = [];
    if (todosLosNegociosActivos.length > 0) {
        negocios = todosLosNegociosActivos.filter(negocio => {
            const nombre = normalizarTextoParaFiltro(negocio.nombre_negocio).includes(terminoLimpio);
            const tags = normalizarTextoParaFiltro(negocio.productos_tags).includes(terminoLimpio);
            const rubroCat = normalizarTextoParaFiltro(negocio.categoria_nombre).includes(terminoLimpio);
            return nombre || tags || rubroCat;
        });
    } else {
        const { data, error } = await supabaseClient
            .from('negocios')
            .select('*')
            .eq('estado', 'activo')
            .or(`nombre_negocio.ilike.%${terminoOriginal}%,productos_tags.ilike.%${terminoOriginal}%,categoria_nombre.ilike.%${terminoOriginal}%`);
        if (!error && data) negocios = data;
    }

    if (!negocios || negocios.length === 0) {
        if (contenedorComercios) {
            contenedorComercios.innerHTML = `
                <p style='text-align:center; color:#666; margin-top:30px;'>No encontramos resultados para "<strong>${inputBusqueda.value.trim()}</strong>".</p>
                <div style="text-align:center; margin-top:15px;">
                    <button onclick="inicializarInterfaz()" style="padding: 8px 15px; background:#007BFF; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Ver todo</button>
                </div>
            `;
        }
        return;
    }

    negociosFiltradosEnMemoria = negocios;

    let categoriesEncontradas = [];
    let rubrosPersonalizadosVistos = new Set();

    negocios.forEach(negocio => {
        if (negocio.categoria_id !== 99) {
            if (!categoriesEncontradas.some(c => c.id === negocio.categoria_id)) {
                categoriesEncontradas.push({
                    id: negocio.categoria_id,
                    nombre: CATEGORIAS_BASE[negocio.categoria_id],
                    esPersonalizado: false
                });
            }
        } else if (negocio.categoria_nombre && negocio.categoria_nombre.trim() !== "") {
            const nombreNormalizado = negocio.categoria_nombre.trim();
            if (!rubrosPersonalizadosVistos.has(nombreNormalizado.toLowerCase())) {
                rubrosPersonalizadosVistos.add(nombreNormalizado.toLowerCase());
                categoriesEncontradas.push({
                    id: 99,
                    nombre: nombreNormalizado,
                    esPersonalizado: true
                });
            }
        }
    });

    categoriesEncontradas.sort((a, b) => a.nombre.localeCompare(b.nombre));

    let htmlFiltroCategorias = `
        <div id="contenedor-bloque-categorias" style="width:100%;">
            <p style="text-align: center; font-weight: bold; color: #FF5722; margin: 10px 0 15px 0; font-size: 14px;">
                🔍 Rubros que ofrecen "${inputBusqueda.value.trim()}":
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 25px; justify-content: center;">
    `;

    categoriesEncontradas.forEach(cat => {
        if (!cat.esPersonalizado) {
            htmlFiltroCategorias += `
                <button onclick="filtrarComerciosEnMemoriaPorCategoriaId(${cat.id})" style="padding: 10px 16px; border: none; background: #e0f2fe; border-radius: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); color: #0369a1; font-size: 14px; border: 1px solid #bae6fd;">
                    ${cat.nombre}
                </button>
            `;
        } else {
            htmlFiltroCategorias += `
                <button onclick="filtrarComerciosEnMemoriaPorNombreRubro('${cat.nombre}')" style="padding: 10px 16px; border: none; background: #fef3c7; border-radius: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); color: #b45309; font-size: 14px; border: 1px solid #fde68a;">
                    ✨ ${cat.nombre}
                </button>
            `;
        }
    });

    htmlFiltroCategorias += `
            </div>
            <div style="text-align:center; margin-bottom: 20px;">
               <span onclick="inicializarInterfaz()" style="color:#666; font-size:12px; cursor:pointer; text-decoration:underline;">❌ Salir de la búsqueda</span>
            </div>
        </div>
        <div id="bloque-comercios-dinamicos" style="width:100%;"></div>
    `;

    if (contenedorComercios) {
        contenedorComercios.innerHTML = htmlFiltroCategorias;
    }
}

function filtrarComerciosEnMemoriaPorCategoriaId(idCategoria) {
    const tiendasFiltradas = negociosFiltradosEnMemoria.filter(n => n.categoria_id === idCategoria);
    mostrarTarjetasFinales(tiendasFiltradas, null);
}

function filtrarComerciosEnMemoriaPorNombreRubro(nombreRubro) {
    const objetivo = normalizarTextoParaFiltro(nombreRubro);
    const tiendasFiltradas = negociosFiltradosEnMemoria.filter(n => 
        n.categoria_id === 99 && 
        n.categoria_nombre && 
        normalizarTextoParaFiltro(n.categoria_nombre) === objetivo
    );
    mostrarTarjetasFinales(tiendasFiltradas, null);
}

function mostrarTarjetasFinales(negocios, error) {
    const bloqueComercios = document.getElementById('bloque-comercios-dinamicos');
    if (!bloqueComercios) return;

    if (error) {
        bloqueComercios.innerHTML = "<p style='text-align:center; color:red;'>Error al cargar comercios.</p>";
        return;
    }

    if (!negocios || negocios.length === 0) {
        bloqueComercios.innerHTML = "<p style='text-align:center; color:#666; margin-top:15px;'>No hay comercios activos en esta sección.</p>";
        return;
    }

    let htmlTarjetas = '<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 10px; width:100%;">';

    negocios.forEach(negocio => {
        let rubroAMostrar = "Rubro Especializado";
        if (negocio.categoria_nombre && negocio.categoria_nombre.trim() !== "" && negocio.categoria_nombre !== "Ninguno (Eligió del listado)") {
            rubroAMostrar = negocio.categoria_nombre;
        } else if (CATEGORIAS_BASE[negocio.categoria_id]) {
            rubroAMostrar = CATEGORIAS_BASE[negocio.categoria_id];
        }

        const linkMapsHTML = negocio.maps 
            ? `<a href="${negocio.maps}" target="_blank" onclick="event.stopPropagation();" style="color: #007BFF; text-decoration: none; font-size: 13px; font-weight: bold;">📍 Ubicación</a>`
            : `<span style="color: #888; font-size: 13px;">📍 Sin mapa</span>`;

        const whatsappVisual = negocio.whatsapp ? `+${negocio.whatsapp}` : 'WhatsApp';

        htmlTarjetas += `
            <div onclick="window.location.href='perfil.html?id=${negocio.id}'" style="background: white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); padding: 16px; border: 1px solid #eef2f5; display: flex; flex-direction: column; gap: 8px; cursor: pointer; max-width: 550px; margin: 0 auto; width: 100%; box-sizing: border-box; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <h3 style="margin: 0; font-size: 17px; color: #222; font-weight: bold;">${negocio.nombre_negocio}</h3>
                    <span style="background: #eef2f5; color: #4b5563; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; white-space: nowrap;">
                        ${rubroAMostrar}
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
    bloqueComercios.innerHTML = htmlTarjetas;
}

if (btnBuscar) btnBuscar.addEventListener('click', buscarPorTexto);
if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarPorTexto();
        }
    });
}

inicializarInterfaz();
// Configuración de Supabase
const SUPABASE_URL = 'https://xhgsxguqivqmkmbphgfm.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_ttX_2zAlp3GGNAqzeLUnAA_3Za4rFSf'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const idNegocio = urlParams.get('id');
const contenedorPerfil = document.getElementById('contenedor-perfil');

// Variables globales para la navegación de fotos
let fotosDelPerfilGlobal = [];
let indiceFotoActual = 0;

function abrirVistaGrande(index) {
    const modal = document.getElementById('mi-visor-modal');
    const imgGrande = document.getElementById('img-modal-grande');
    if (modal && imgGrande && fotosDelPerfilGlobal.length > 0) {
        indiceFotoActual = index;
        imgGrande.src = fotosDelPerfilGlobal[indiceFotoActual];
        modal.style.display = 'flex';
    }
}

function cerrarVistaGrande() {
    const modal = document.getElementById('mi-visor-modal');
    if (modal) modal.style.display = 'none';
}

function cambiarFotoModal(direccion, evento) {
    if (evento) evento.stopPropagation(); // Evita que se cierre el fondo oscuro al tocar la flecha
    
    indiceFotoActual += direccion;
    
    // Si llega al final de la galería, vuelve a la primera
    if (indiceFotoActual >= fotosDelPerfilGlobal.length) {
        indiceFotoActual = 0;
    } 
    // Si le da hacia atrás en la primera, va a la última
    else if (indiceFotoActual < 0) {
        indiceFotoActual = fotosDelPerfilGlobal.length - 1;
    }
    
    const imgGrande = document.getElementById('img-modal-grande');
    imgGrande.src = fotosDelPerfilGlobal[indiceFotoActual];
}

async function cargarDetalleDelNegocio() {
    if (!contenedorPerfil) return;
    if (!idNegocio) {
        contenedorPerfil.innerHTML = `<p style="text-align:center; color:red; margin-top:20px;">Error: No se especificó comercio en el enlace.</p>`;
        return;
    }

    try {
        const { data: negocio, error } = await supabaseClient
            .from('negocios')
            .select('*')
            .eq('id', idNegocio)
            .single();

        if (error || !negocio) {
            contenedorPerfil.innerHTML = `<p style="text-align:center; color:red; margin-top:20px;">Error al obtener los datos del comercio solicitado.</p>`;
            return;
        }

        let rubroAMostrar = negocio.categoria_nombre || "Rubro Comercial";

        // --- DESCODIFICACIÓN LÓGICA DEL ARREGLO DE FOTOS ---
        let fotosArray = [];
        let campoFotos = negocio.fotos_urls || "";

        if (campoFotos) {
            campoFotos = campoFotos.trim();
            if (campoFotos.startsWith('[') && campoFotos.endsWith(']')) {
                try { fotosArray = JSON.parse(campoFotos); } catch(e) { fotosArray = []; }
            } else {
                fotosArray = campoFotos.split(',').map(f => f.trim());
            }
        }

        fotosArray = fotosArray.filter(url => url && url.length > 10).slice(0, 6);

        let galeriaHTML = '';
        if (fotosArray.length > 0) {
            galeriaHTML = `
                <div style="margin-bottom: 5px;">
                    <h3 style="margin: 0 0 5px 0; color: #444; font-size: 15px; font-weight: bold;">📸 Galería del Comercio</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #888;">👉 Toca cualquier imagen para verla en tamaño completo</p>
                </div>
                <div class="galeria-grid">
            `;
            
            // Cargamos el arreglo al sistema global de navegación
            fotosDelPerfilGlobal = fotosArray;

            // Ahora enviamos el "índice" de la foto en lugar del enlace
            fotosArray.forEach((urlFoto, index) => {
                galeriaHTML += `
                    <div class="galeria-item" onclick="abrirVistaGrande(${index})">
                        <img src="${urlFoto}" alt="Imagen de catálogo" class="galeria-img">
                    </div>
                `;
            });
            
            galeriaHTML += `</div><hr style="border:0; border-top: 1px solid #eee; margin: 15px 0;">`;
        }

        let botonUbicacionHTML = negocio.maps ? `
            <a href="${negocio.maps}" target="_blank" style="display: block; text-align: center; background-color: #007BFF; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 10px; font-size: 14px;">
                📍 Ubicación en Google Maps
            </a>
        ` : '';

        // --- CORRECCIÓN DINÁMICA DE BOTÓN DE INSTAGRAM CON USUARIO VISIBLE ---
        let botonInstagramHTML = '';
        if (negocio.instagram && negocio.instagram.trim() !== "") {
            let usuarioLimpio = negocio.instagram.trim();
            if (!usuarioLimpio.startsWith('@')) {
                usuarioLimpio = '@' + usuarioLimpio;
            }
            const urlInstagram = usuarioLimpio.replace('@', '');
            
            botonInstagramHTML = `
                <a href="https://instagram.com/${urlInstagram}" target="_blank" style="display: block; text-align: center; background-color: #E1306C; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 10px; font-size: 14px;">
                    📸 Ver Instagram: ${usuarioLimpio}
                </a>
            `;
        }

        // --- CORRECCIÓN DINÁMICA DE BOTÓN DE WHATSAPP CON NÚMERO VISIBLE ---
        // --- ESCUDO INTELIGENTE DE WHATSAPP ---
        let numeroLimpio = negocio.whatsapp ? negocio.whatsapp.replace(/\D/g, '') : '';
        if (numeroLimpio.startsWith('0')) {
            numeroLimpio = '58' + numeroLimpio.substring(1);
        } else if (numeroLimpio.length === 10) {
            numeroLimpio = '58' + numeroLimpio;
        }

        let botonWhatsappHTML = '';
        if (numeroLimpio && numeroLimpio.length >= 11) {
            botonWhatsappHTML = `
                <a href="https://api.whatsapp.com/send?phone=${numeroLimpio}" target="_blank" style="display: block; text-align: center; background-color: #25D366; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 10px; font-size: 14px;">
                    💬 Contactar por WhatsApp: +${numeroLimpio}
                </a>
            `;
        }

        // --- LÓGICA DE CALIFICACIONES (ESTRELLAS) ---
        let totalVotos = negocio.total_votos || 0;
        let sumaCalificaciones = negocio.suma_calificaciones || 0;
        let promedio = totalVotos === 0 ? 0 : (sumaCalificaciones / totalVotos).toFixed(1);
        
        // Verificamos si la memoria de este celular ya tiene registrado un voto para este local
        const yaVoto = localStorage.getItem(`voto_${idNegocio}`);
        
        let bloqueCalificacionHTML = `<hr style="border:0; border-top: 1px solid #eee; margin: 25px 0 15px 0;">`;
        bloqueCalificacionHTML += `<div style="text-align: center; margin-bottom: 10px; background: #fafafa; padding: 15px; border-radius: 12px; border: 1px solid #eee;">`;
        bloqueCalificacionHTML += `<h3 style="margin: 0 0 5px 0; color: #444; font-size: 15px; font-weight: bold;">⭐ Calificación de Usuarios</h3>`;
        
        if (yaVoto) {
            // MODO ESTÁTICO: El usuario ya votó, solo mostramos el promedio pintado
            let estrellasPintadas = '';
            for(let i=1; i<=5; i++) {
                estrellasPintadas += `<span style="font-size: 32px; color: ${i <= Math.round(promedio) ? '#FFD700' : '#ddd'};">★</span>`;
            }
            bloqueCalificacionHTML += `<div>${estrellasPintadas}</div>`;
            bloqueCalificacionHTML += `<p style="margin: 5px 0 0 0; font-size: 13px; color: #28a745; font-weight:bold;">¡Gracias por tu voto!</p>`;
        } else {
            // MODO INTERACTIVO: El usuario no ha votado, mostramos el sistema táctil (leídas de derecha a izquierda por el CSS RTL)
            bloqueCalificacionHTML += `
                <div class="clasificacion">
                    <span class="clasificacion-estrella" onclick="enviarCalificacion(5)">★</span>
                    <span class="clasificacion-estrella" onclick="enviarCalificacion(4)">★</span>
                    <span class="clasificacion-estrella" onclick="enviarCalificacion(3)">★</span>
                    <span class="clasificacion-estrella" onclick="enviarCalificacion(2)">★</span>
                    <span class="clasificacion-estrella" onclick="enviarCalificacion(1)">★</span>
                </div>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">Toca una estrella para calificar</p>
            `;
        }
        
        bloqueCalificacionHTML += `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555; font-weight: bold;">Promedio: <span style="color:#111;">${promedio} / 5</span> <span style="font-size: 12px; font-weight: normal;">(${totalVotos} opiniones)</span></p>`;
        bloqueCalificacionHTML += `</div>`;

        contenedorPerfil.innerHTML = `
            <div style="max-width: 550px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); box-sizing: border-box;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="margin: 0 0 5px 0; font-size: 24px; color: #222; font-weight: bold;">${negocio.nombre_negocio}</h1>
                    <span style="background: #eef2f5; color: #4b5563; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        ✨ ${rubroAMostrar}
                    </span>
                </div>
                <hr style="border:0; border-top: 1px solid #eee; margin: 15px 0;">
                ${galeriaHTML}
                <div>
                    <h3 style="margin: 0 0 8px 0; color: #444; font-size: 15px; font-weight: bold;">📋 ¿Qué ofrece este negocio?</h3>
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5; background: #f9fafb; padding: 12px; border-radius: 8px;">
                        ${negocio.productos_tags || 'Información general.'}
                    </p>
                </div>
                <hr style="border:0; border-top: 1px solid #eee; margin: 15px 0;">
                <div>
                    <h3 style="margin: 0 0 8px 0; color: #444; font-size: 15px; font-weight: bold;">🏢 Dirección Física Exacta</h3>
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.4;">${negocio.direccion}</p>
                </div>
                <hr style="border:0; border-top: 1px solid #eee; margin: 15px 0;">
                <div style="margin-bottom: 25px;">
                    <h3 style="margin: 0 0 8px 0; color: #444; font-size: 15px; font-weight: bold;">🕒 Horario de Atención</h3>
                    <p style="margin: 0; color: #555; font-size: 14px; font-weight: 500;">${negocio.horario || 'Consultar horario.'}</p>
                </div>
                <hr style="border:0; border-top: 1px solid #eee; margin: 15px 0;">
                
                <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 10px;">
                    ${botonWhatsappHTML}
                    ${botonInstagramHTML}
                    ${botonUbicacionHTML}
                </div>

                ${bloqueCalificacionHTML}

                <div style="text-align: center; margin-top: 25px;">
                    <a href="index.html" style="color: #666; font-size: 13px; text-decoration: underline;">⬅️ Volver a las categorías</a>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Error crítico de renderizado:", err);
        contenedorPerfil.innerHTML = `<p style="text-align:center; color:red; margin-top:20px;">Ocurrió un error inesperado al renderizar el perfil.</p>`;
    }
}

// BLINDAJE DE ASINCRONÍA: Aseguramos que corra solo cuando el navegador esté 100% cargado
window.addEventListener('DOMContentLoaded', () => {
    cargarDetalleDelNegocio();
});

// --- FUNCIÓN PARA PROCESAR Y ENVIAR EL VOTO A SUPABASE ---
window.enviarCalificacion = async function(estrellasDadas) {
    if (!idNegocio) return;
    
    // Doble candado: Si ya votó, abortamos.
    if (localStorage.getItem(`voto_${idNegocio}`)) return;

    try {
        // 1. Leemos los datos en tiempo real directo de Supabase para no pisar el voto de otro cliente simultáneo
        const { data: negocioActual, error: errorLectura } = await supabaseClient
            .from('negocios')
            .select('suma_calificaciones, total_votos')
            .eq('id', idNegocio)
            .single();

        if (errorLectura) throw errorLectura;

        // 2. Calculamos las nuevas matemáticas
        let nuevosVotos = (negocioActual.total_votos || 0) + 1;
        let nuevaSuma = (negocioActual.suma_calificaciones || 0) + estrellasDadas;

        // 3. Enviamos el resultado actualizado
        const { error: errorUpdate } = await supabaseClient
            .from('negocios')
            .update({ 
                suma_calificaciones: nuevaSuma,
                total_votos: nuevosVotos 
            })
            .eq('id', idNegocio);

        if (errorUpdate) throw errorUpdate;

        // 4. Marcamos en el celular que este cliente ya votó por este local específico
        localStorage.setItem(`voto_${idNegocio}`, 'true');

        // 5. Refrescamos la pantalla para mostrar el cartel verde de agradecimiento y el nuevo promedio
        cargarDetalleDelNegocio();

    } catch (err) {
        console.error("Error al guardar calificación:", err);
        alert("Hubo un problema de conexión al enviar tu voto. Intenta en unos segundos.");
    }
};
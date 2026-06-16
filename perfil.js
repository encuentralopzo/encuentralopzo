// Configuración de Supabase
const SUPABASE_URL = 'https://xhgsxguqivqmkmbphgfm.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_ttX_2zAlp3GGNAqzeLUnAA_3Za4rFSf'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const idNegocio = urlParams.get('id');
const contenedorPerfil = document.getElementById('contenedor-perfil');

function abrirVistaGrande(url) {
    const modal = document.getElementById('mi-visor-modal');
    const imgGrande = document.getElementById('img-modal-grande');
    if (modal && imgGrande) {
        imgGrande.src = url;
        modal.style.display = 'flex';
    }
}

function cerrarVistaGrande() {
    const modal = document.getElementById('mi-visor-modal');
    if (modal) modal.style.display = 'none';
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
            
            fotosArray.forEach(urlFoto => {
                galeriaHTML += `
                    <div class="galeria-item" onclick="abrirVistaGrande('${urlFoto}')">
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
        const whatsappVisual = negocio.whatsapp ? `+${negocio.whatsapp}` : 'WhatsApp';

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
                    <a href="https://wa.me/${negocio.whatsapp}" target="_blank" style="display: block; text-align: center; background-color: #25D366; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 10px; font-size: 14px;">
                        💬 Contactar por WhatsApp: ${whatsappVisual}
                    </a>
                    ${botonInstagramHTML}
                    ${botonUbicacionHTML}
                </div>
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
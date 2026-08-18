// ======================================================
// CONFIGURA ESTO: pon aquí la URL de tu api.php en tu servidor
// Ejemplo: "https://tudominio.com/invitacion/api.php"
// ======================================================
const API_URL = "https://invitacion.gestionpqrs.com.co/api.php";

// Fecha estipulada en el evento (debe coincidir con el texto de la tarjeta)
const FECHA_PROPUESTA = "2026-08-19"; // Miércoles 19 de agosto de 2026

document.addEventListener("DOMContentLoaded", () => {
  initEnvelope();
  initDateRestriction();
  initRsvpButtons();
  initForm();
});

// ---------- Sobre animado ----------
function initEnvelope() {
  const envelope = document.getElementById("envelope");
  const envelopeScreen = document.getElementById("envelope-screen");
  const invitation = document.getElementById("invitation");

  const open = () => {
    if (envelope.classList.contains("is-open")) return;
    envelope.classList.add("is-open");
    setTimeout(() => {
      envelopeScreen.classList.add("is-leaving");
      setTimeout(() => {
        envelopeScreen.hidden = true;
        invitation.hidden = false;
        invitation.classList.add("is-entering");
        invitation.scrollIntoView({ behavior: "instant", block: "start" });
      }, 550);
    }, 650);
  };

  envelope.addEventListener("click", open);
  envelope.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
}

// ---------- Restringir fechas anteriores a mañana ----------
function initDateRestriction() {
  const fechaOkRadios = document.querySelectorAll('input[name="fecha_ok"]');
  const dateWrap = document.getElementById("date-picker-wrap");
  const dateInput = document.getElementById("fecha_alterna");

  // "mañana" calculado en el navegador de quien abre la página
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const minDateStr = toISODate(manana);
  dateInput.min = minDateStr;
  dateInput.value = minDateStr;

  fechaOkRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const eligeOtra = radio.value === "no" && radio.checked;
      dateWrap.hidden = !eligeOtra;
      dateInput.required = eligeOtra;
    });
  });
}

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------- Botones Sí / "Sí" (no hay otra opción) ----------
function initRsvpButtons() {
  const btnSi = document.getElementById("btn-si");
  const btnNo = document.getElementById("btn-no");
  const respuestaInput = document.getElementById("respuesta");

  btnSi.classList.add("is-selected");

  const seleccionar = () => {
    btnSi.classList.add("is-selected");
    respuestaInput.value = "si";
  };

  btnSi.addEventListener("click", seleccionar);
  // el botón "no" es una broma: también confirma que sí, con cariño
  btnNo.addEventListener("click", seleccionar);
}

// ---------- Envío del formulario ----------
function initForm() {
  const form = document.getElementById("rsvp-form");
  const errorBox = document.getElementById("form-error");
  const submitBtn = document.getElementById("btn-submit");
  const submitText = document.getElementById("btn-submit-text");
  const successBox = document.getElementById("success-message");
  const successText = document.getElementById("success-text");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.hidden = true;

    // Anti-spam: si el campo oculto viene lleno, no hacemos nada
    const honeypot = document.getElementById("empresa").value;
    if (honeypot) return;

    const fechaOk = form.querySelector('input[name="fecha_ok"]:checked').value;
    const fechaAlterna = document.getElementById("fecha_alterna").value;
    const respuesta = document.getElementById("respuesta").value;
    const mensaje = document.getElementById("mensaje").value.trim();

    let fechaFinal = FECHA_PROPUESTA;
    if (fechaOk === "no") {
      if (!fechaAlterna) {
        errorBox.textContent = "Por favor elige una fecha alterna 🙏";
        errorBox.hidden = false;
        return;
      }
      fechaFinal = fechaAlterna;
    }

    const payload = {
      fecha_propuesta: FECHA_PROPUESTA,
      fecha_confirmada: fechaFinal,
      acepto_fecha_propuesta: fechaOk === "si",
      respuesta: respuesta,
      mensaje: mensaje,
    };

    submitBtn.disabled = true;
    submitText.textContent = "Enviando…";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Respuesta del servidor no válida");
      const data = await res.json().catch(() => ({}));
      if (data && data.ok === false) throw new Error(data.error || "Error al guardar");

      form.hidden = true;
      successText.textContent =
        fechaOk === "si"
          ? "Ya guardé tu respuesta. ¡Nos vemos el 19 de agosto! 🕯️❤️"
          : `Ya guardé tu respuesta y la nueva fecha (${formatoBonito(fechaFinal)}). ¡Nos vemos mi pecosa! 🕯️❤️`;
      successBox.hidden = false;
    } catch (err) {
      errorBox.textContent =
        "No pude enviar tu respuesta 😢 revisa tu conexión e inténtalo de nuevo, o me avisas bb";
      errorBox.hidden = false;
      submitBtn.disabled = false;
      submitText.textContent = "Enviar mi respuesta";
    }
  });
}

function formatoBonito(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

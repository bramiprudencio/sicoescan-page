import { showBasedatos } from './basedatos.js';
import { showProcesos } from './convocatorias.js';
import { showInformacion } from './informacion.js';

const appDiv = document.getElementById('app');

function render() {
  // Get the path from the hash, removing the leading '#'
  // Example: '#/basedatos' becomes '/basedatos'
  const route = window.location.hash.substring(1) || '/'; 
  
  switch (route) {
    case '/procesos':
      showProcesos(appDiv);
      break;
    case '/basedatos':
      showBasedatos(appDiv);
      break;
    case '/informacion':
      showInformacion(appDiv);
      break;
    default:
      // Redirect to a default route if the hash is empty or unknown
      window.location.hash = '/informacion';
      break;
  }
}

// Listen for hash changes (when a link is clicked)
window.addEventListener('hashchange', render);

// Initial render for when the page first loads
render();
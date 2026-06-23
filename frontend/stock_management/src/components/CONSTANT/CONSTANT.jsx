// export const API_BASE_URL = `http://192.168.6.50:3002`;
// let apiHost;
// if (window.location.hostname === '192.168.6.50') {
//   apiHost = 'http://192.168.6.50:3001';
// } else if (window.location.hostname === '103.159.183.242') {
//   apiHost = 'http://103.159.183.242:3001';
// } else {
//   // default or fallback (e.g., localhost or production domain)
//   apiHost = 'http://localhost:3001';
// }

export const API_BASE_URL = `http://${window.location.hostname}:5042`;

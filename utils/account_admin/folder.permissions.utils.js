const axios = require("axios");

// Reutilizamos la misma estrategia de cliente con interceptores
const api = axios.create();
api.interceptors.request.use(cfg => {
  //console.log(`[API] ➜ ${cfg.method.toUpperCase()} ${cfg.url}`);
  return cfg;
});
api.interceptors.response.use(
  resp => resp,
  async err => {
    const { response, config } = err;
    if (response?.status === 429) {
      const waitSec = parseInt(response.headers["retry-after"], 10) || 1;
      console.warn(`[API] ✖ 429 en ${config.url}, espero ${waitSec}s…`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      return api(config);
    }
    console.error(`[API] ✖ ${response?.status} en ${config?.url}`);
    return Promise.reject(err);
  }
);

/**
 * Obtiene permisos de múltiples carpetas con concurrencia limitada.
 */
async function GetFolderPermissions(token, projectId, folders) {
  
  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(1);

  const calls = folders.map(f =>
    limit(async () => {
      const { data } = await api.get(
        `https://developer.api.autodesk.com/bim360/docs/v1/projects/${projectId}/folders/${f.id}/permissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return {
        folderId: f.id,
        folderName: f.name,
        permissions: data,
      };
    })
  );

  return Promise.all(calls);
}

module.exports = { GetFolderPermissions };
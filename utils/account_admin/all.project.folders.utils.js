const axios = require("axios");

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

async function getRootFolderId(token, accountId, projectId) {
  const { data } = await api.get(
    `https://developer.api.autodesk.com/project/v1/hubs/${accountId}/projects/${projectId}/topFolders`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const top = data.data || [];
  if (!top.length) throw new Error("No top folders found");
  const pf = top.find(f =>
    f.attributes.displayName === "Project Files" ||
    f.attributes.displayName.toLowerCase() === "archivos de proyecto"
  );
  return (pf || top[0]).id;
}

async function listFoldersRecursively(token, projectId, folderId) {
  // Pausa ligera para no saturar
  await new Promise(r => setTimeout(r, 300));

  const { data } = await api.get(
    `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const items = data.data || [];
  const folders = items.filter(i => i.type === "folders");

  const result = folders.map(f => ({
    id: f.id,
    name: f.attributes.displayName,
  }));

  // Import dinámico de p-limit y concurrencia a 1
  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(1);

  for (const f of folders) {
    const sub = await limit(() =>
      listFoldersRecursively(token, projectId, f.id)
    );
    result.push(...sub);
  }

  return result;
}

async function GetAllProjectFolders(token, accountId, projectId) {
  const rootId = await getRootFolderId(token, accountId, projectId);
  return listFoldersRecursively(token, projectId, rootId);
}

module.exports = { GetAllProjectFolders };
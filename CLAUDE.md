🔒 Reglas de Seguridad del Repositorio
Estas reglas son ABSOLUTAS. No las violes bajo ninguna circunstancia.
❌ NO TOCAR — Archivos y carpetas protegidos

NUNCA modificar archivos existentes en libs/acc/ excepto agregar imports si es necesario
NUNCA modificar libs/acc/issues/, libs/acc/rfis/, libs/acc/sheets/, libs/acc/submittals/, libs/acc/files/, libs/acc/account_admin/
NUNCA modificar routers existentes: auth.router.js, bim360.router.js, data.management.router.js, general.router.js, model.data.router.js
NUNCA modificar acc.router.js excepto para AGREGAR la nueva ruta de assets al final del archivo (nunca editar rutas existentes)
NUNCA modificar middleware de autenticación existente
NUNCA modificar package.json, package-lock.json ni instalar dependencias nuevas salvo que sea estrictamente necesario y se consulte primero
NUNCA modificar archivos .env, .env.example ni configuraciones de entorno
NUNCA modificar el archivo de entrada principal (normalmente app.js, server.js o index.js)
NUNCA eliminar ni renombrar archivos existentes

✅ SOLO CREAR — Archivos nuevos permitidos
Está permitido ÚNICAMENTE crear los siguientes archivos nuevos:
libs/acc/assets/
  ├── assets.lib.js           ← GET /assets (paginado + enriquecido)
  ├── categories.lib.js       ← GET /assets/categories
  ├── statuses.lib.js         ← GET /assets/asset-statuses
  ├── customAttributes.lib.js ← GET /assets/custom-attributes
  ├── categoryAttributes.lib.js ← GET /assets/categories/:categoryId/custom-attributes
  └── index.js                ← barrel export de todas las libs

controllers/
  └── assets.controller.js    ← orquesta llamadas y enriquece respuesta

(Agregar en acc.router.js solo el bloque de rutas de assets al final)

🏗️ Arquitectura del Proyecto
Stack

Runtime: Node.js
Framework: Express.js
Auth: Token Bearer de Autodesk (APS) — se obtiene del middleware existente, NO reimplementar
Patrón de libs: Cada lib hace exactamente UNA llamada a la API de APS y retorna la respuesta parseada. Sin lógica de negocio en las libs.
Patrón de controllers: Los controllers orquestan múltiples libs, enriquecen datos y manejan errores.

Convenciones que YA EXISTEN y debes respetar
Observa los archivos existentes en libs/acc/issues/, libs/acc/rfis/, etc. y replica EXACTAMENTE:

El mismo estilo de exportación de funciones
El mismo manejo de access_token y projectId como parámetros
El mismo uso de fetch o axios (usa el que ya está en el proyecto — NO cambiar)
El mismo formato de manejo de errores (try/catch con throw)
El mismo patrón de imports/requires (CommonJS require o ESM import — lo que ya usa el proyecto)
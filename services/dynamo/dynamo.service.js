const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDoc = DynamoDBDocumentClient.from(ddbClient);

const DATATABLE  = "bay-bim-app";
const MODELTABLE = "bay-bim-app-model";

const PK_ATTR       = "accountId#projectId";
const SK_ATTR       = "service#itemId";
const MODEL_SK_ATTR = "service#modelUrn";

async function dbConnection() {
  try {
    await ddbClient.send(new ListTablesCommand({ Limit: 1 }));
    console.log("✅ DynamoDB connection established successfully.");
  } catch (error) {
    console.error("❌ Error establishing DynamoDB connection:", error);
  }
}

/* ----------------------------- DATA TABLE ----------------------------- */

async function saveDataItem(item) {
  return ddbDoc.send(new PutCommand({ TableName: DATATABLE, Item: item }));
}

async function deleteDataItem(pk, sk) {
  return ddbDoc.send(
    new DeleteCommand({ TableName: DATATABLE, Key: { [PK_ATTR]: pk, [SK_ATTR]: sk } })
  );
}

async function queryDataService(accountId, projectId, service) {
  const sanitizeId = (s) => String(s).replace(/[.\-]/g, "_");
  const safeAccount = sanitizeId(accountId);

  const noB   = String(projectId).startsWith("b.") ? String(projectId).slice(2) : String(projectId);
  const pkNoB = `${safeAccount}#${sanitizeId(noB)}`;
  const pkB   = `${safeAccount}#${sanitizeId(projectId)}`;

  let svc = String(service).toLowerCase();
  if (svc.endsWith("s")) svc = svc.slice(0, -1);
  const skPrefix = `${svc}#`;

  const doQuery = async (pk) => {
    const resp = await ddbDoc.send(
      new QueryCommand({
        TableName: DATATABLE,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :svc)",
        ExpressionAttributeNames: { "#pk": PK_ATTR, "#sk": SK_ATTR },
        ExpressionAttributeValues: { ":pk": pk, ":svc": skPrefix },
      })
    );
    return resp.Items || [];
  };

  let items = await doQuery(pkNoB);
  if (!items.length && pkB !== pkNoB) items = await doQuery(pkB);
  return items;
}

/* ---------------------------- MODEL TABLE ----------------------------- */

async function saveModelItem(item) {
  return ddbDoc.send(new PutCommand({ TableName: MODELTABLE, Item: item }));
}

async function deleteModelItem(accountId, projectId, service, modelUrn, dbId) {
  const pk = `${accountId}#${projectId}`;
  const sk = `${service}#${modelUrn}#${dbId}`;
  return ddbDoc.send(
    new DeleteCommand({ TableName: MODELTABLE, Key: { [PK_ATTR]: pk, [MODEL_SK_ATTR]: sk } })
  );
}

/**
 * Consulta items del modelo.
 * - Estricto (default): filtra por `service#${modelUrn}`.
 * - Loose (opts.loose = true): ignora el URN y consulta por `service#`.
 */
async function queryModelService(accountId, projectId, service, modelUrn, opts = {}) {
  const pk = `${accountId}#${projectId}`;
  const loose = !!opts.loose;
  const prefix = loose ? `${service}#` : `${service}#${modelUrn || ""}`;

  const resp = await ddbDoc.send(
    new QueryCommand({
      TableName: MODELTABLE,
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :svc)",
      ExpressionAttributeNames: { "#pk": PK_ATTR, "#sk": MODEL_SK_ATTR },
      ExpressionAttributeValues: { ":pk": pk, ":svc": prefix },
    })
  );
  return resp.Items || [];
}

async function updateModelItem(accountId, projectId, service, modelUrn, dbId, updates) {
  const pk = `${accountId}#${projectId}`;
  const sk = `${service}#${modelUrn}#${dbId}`;

  const exprNames = {};
  const exprValues = {};
  const parts = [];

  for (const [field, value] of Object.entries(updates)) {
    const nameKey = `#${field}`;
    const valueKey = `:${field}`;
    exprNames[nameKey] = field;
    exprValues[valueKey] = value;
    parts.push(`${nameKey} = ${valueKey}`);
  }

  const UpdateExpression = `SET ${parts.join(", ")}`;

  return ddbDoc.send(
    new UpdateCommand({
      TableName: MODELTABLE,
      Key: { [PK_ATTR]: pk, [MODEL_SK_ATTR]: sk },
      UpdateExpression,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    })
  );
}

module.exports = {
  PK_ATTR,
  SK_ATTR,
  MODEL_SK_ATTR,
  dbConnection,
  saveDataItem,
  deleteDataItem,
  queryDataService,
  saveModelItem,
  queryModelService,
  deleteModelItem,
  updateModelItem,
};
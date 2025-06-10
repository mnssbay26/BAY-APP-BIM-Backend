const {
  DynamoDBClient,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDoc = DynamoDBDocumentClient.from(ddbClient);
const DATATABLE = "bay-bim-app";
const MODELTABLE = "bay-bim-app-model";


const PK_ATTR = "accountId#projectId";
const SK_ATTR = "service#itemId";
const MODEL_SK_ATTR = "service#modelUrn";

async function dbConnection() {
  try {
    await ddbClient.send(new ListTablesCommand({ Limit: 1 }));
    console.log("✅ DynamoDB connection established successfully.");
  } catch (error) {
    console.error("❌ Error establishing DynamoDB connection:", error);
  }
}

//DATA TABLE FUNCTIONS

/**Save data regarding items of issues, rfis , submittals and users */
async function saveDataItem(item) {
  return ddbDoc.send(new PutCommand({
    TableName: DATATABLE,
    Item: item
  }));
}

/**Delete items from the table of issues, rfis, submittals and users */
async function deleteDataItem(pk, sk) {
  return ddbDoc.send(new DeleteCommand({
    TableName: DATATABLE,
    Key: { [PK_ATTR]: pk, [SK_ATTR]: sk }
  }));
}

/** Get query of data items */
async function queryDataService(accountId, projectId, service) {
  const pk = `${accountId}#${projectId}`;
  const resp = await ddbDoc.send(new QueryCommand({
    TableName: DATATABLE,
    KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :svc)",
    ExpressionAttributeNames: {
      "#pk": PK_ATTR,
      "#sk": SK_ATTR
    },
    ExpressionAttributeValues: {
      ":pk": pk,
      ":svc": `${service}#`
    }
  }));
  return resp.Items || [];
}

//MODEL TABLE FUNCTIONS

/** Save model items */
async function saveModelItem(item) {
  return ddbDoc.send(new PutCommand({
    TableName: MODELTABLE,
    Item: item
  }));
}

/** Delete model items */
async function deleteModelItem(accountId, projectId, service,  modelUrn, dbId) {
const pk = `${accountId}#${projectId}`;
  const sk = `${service}#${modelUrn}#${dbId}`;
  return ddbDoc.send(new DeleteCommand({
    TableName: MODELTABLE,
    Key: { [PK_ATTR]: pk, [MODEL_SK_ATTR]: sk },
  }));
}

/** Query model items */
async function queryModelService(accountId, projectId, service, modelUrn) {
  const pk = `${accountId}#${projectId}`;
  const prefix = `${service}#${modelUrn}`;
  const resp = await ddbDoc.send(new QueryCommand({
    TableName: MODELTABLE,
    KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :svc)",
    ExpressionAttributeNames: { "#pk": PK_ATTR, "#sk": MODEL_SK_ATTR },
    ExpressionAttributeValues:{ ":pk": pk, ":svc": prefix },
  }));
  return resp.Items || [];
}

async function updateModelItem(accountId, projectId, service, modelUrn, dbId, updates) {
  const pk = `${accountId}#${projectId}`;
  const sk = `${service}#${modelUrn}#${dbId}`;

  // built UpdateExpression
  const exprNames  = {};
  const exprValues = {};
  const parts       = [];

  for (const [field, value] of Object.entries(updates)) {
    const nameKey  = `#${field}`;
    const valueKey = `:${field}`;
    exprNames[nameKey]  = field;
    exprValues[valueKey]= value;
    parts.push(`${nameKey} = ${valueKey}`);
  }

  const UpdateExpression = `SET ${parts.join(", ")}`;

  return ddbDoc.send(new UpdateCommand({
    TableName: MODELTABLE,
    Key: { [PK_ATTR]: pk, [MODEL_SK_ATTR]: sk },
    UpdateExpression,
    ExpressionAttributeNames:  exprNames,
    ExpressionAttributeValues: exprValues,
  }));
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
  updateModelItem
};

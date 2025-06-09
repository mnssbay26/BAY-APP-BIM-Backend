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
const TABLE = "bay-bim-app";

const PK_ATTR = "accountId#projectId";
const SK_ATTR = "service#itemId";

async function dbConnection() {
  try {
    await ddbClient.send(new ListTablesCommand({ Limit: 1 }));
    console.log("✅ DynamoDB connection established successfully.");
  } catch (error) {
    console.error("❌ Error establishing DynamoDB connection:", error);
  }
}

async function saveItem(item) {
  return ddbDoc.send(new PutCommand({
    TableName: TABLE,
    Item: item
  }));
}

async function deleteItem(pk, sk) {
  return ddbDoc.send(new DeleteCommand({
    TableName: TABLE,
    Key: { [PK_ATTR]: pk, [SK_ATTR]: sk }
  }));
}

async function queryService(accountId, projectId, service) {
  const pk = `${accountId}#${projectId}`;
  const resp = await ddbDoc.send(new QueryCommand({
    TableName: TABLE,
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

module.exports = {
  dbConnection,
  saveItem,
  deleteItem,
  queryService,
};

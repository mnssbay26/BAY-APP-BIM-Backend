const { limitChars } = require("../../../utils/ai/chunks.utils");

/* ========= Common helpers ========= */
function headerRules(extra = "") {
  return `
GENERAL RULES
- Use ONLY the provided JSON. If something is missing, answer: "Not in provided data".
- Counts => return a number. Lists => return an array (of IDs or objects).
- Percentages => one decimal place.
- Do not guess. Do not pull external knowledge.
${extra}`.trim();
}

/* ========= Issues ========= */
function issuesPrompt(items, question) {
  return `
You are an expert BIM 360 Issues assistant.

DATA SHAPE
Each item may include:
id, title, description, status ("open"|"closed"),
createdAt, dueDate, updatedAt, closedAt (ISO),
assignedTo, openedBy, createdBy, closedBy, updatedBy (strings),
customAttributes: [{ title, readableValue }]

${headerRules()}

DATA:
${limitChars(items)}

QUESTION:
${question}`.trim();
}

/* ========= Users ========= */
function usersPrompt(items, question) {
  return `
You are an expert BIM 360 Users assistant.

DATA SHAPE
Each user record may include:
id, name, firstName, lastName, email, companyName, status,
roles: [{ id, name }], accessLevels: [string]

${headerRules()}

DATA:
${limitChars(items)}

QUESTION:
${question}`.trim();
}

/* ========= Submittals ========= */
function submittalsPrompt(items, question) {
  return `
You are an expert BIM 360 Submittals assistant.

DATA SHAPE
Each submittal may include:
id, identifier, title, description, state, priority,
createdAt, dueDate, updatedAt (ISO),
createdByName, submitterByName, managerName, updatedByName, publishedByName, sentToReviewByName,
specIdentifier, specTitle,
customAttributes: [{ attributeDefinitionId, readableValue }]

${headerRules()}

DATA:
${limitChars(items)}

QUESTION:
${question}`.trim();
}

/* ========= RFIs ========= */
function rfisPrompt(items, question) {
  return `
You are an expert BIM 360 RFI assistant.

DATA SHAPE
Each RFI may include:
customIdentifier, id,
title, question, officialResponse,
status, discipline (array), priority, category (array),
createdAt, dueDate, respondedAt, updatedAt, closedAt (ISO),
createdBy, assignedTo, managerId, respondedBy, reviewerId, updatedBy, closedBy (strings),
reviewers: [{ id, displayName }], coReviewers: [ ... ]

${headerRules()}

DATA:
${limitChars(items)}

QUESTION:
${question}`.trim();
}

/* ========= Model Data (ACC model database) =========
   mode:
   - "general": Q&A libre sobre el dataset
   - "dbid":    pregunta sobre UN elemento específico
   - "update":  devolver SOLO JSON para actualizar campos
   - "viewer":  devolver SOLO JSON con comandos de visor (isolate/hide/highlight)
   - "daterange": describir rangos de fechas planeadas/real
*/
function modelDataPrompt(items, question, mode = "general") {
  let intro = `You are a BIM model data assistant. The records come from a DynamoDB export of model elements. Use ONLY provided keys.`;
  let extra = ``;

  switch (mode) {
    case "dbid":
      extra = `
FOCUS
- Analyze ONE element by its dbId if asked.
- If multiple candidates, list their dbIds and key properties that disambiguate (TypeName, Category, LevelName).

OUTPUT
- If the user asks for a single element, return a short paragraph plus a compact JSON of the element's key/value pairs (only those present).`.trim();
      break;

    case "update":
      extra = `
OUTPUT (STRICT JSON ONLY — no prose, no code fences)
{
  "action": "update",
  "dbIds": [ <number> | <numbers> ],
  "field": "<ExistingFieldName>",
  "value": "<NewValue or number or boolean>",
  "discipline": "<optional: architectural|structural|mep>"
}
RULES
- Only include dbIds that exist in DATA.
- Do NOT invent field names; use exactly those present.
- If field/dbIds not found, return: {"action":"none","reason":"Not in provided data"}`
      .trim();
      break;

    case "viewer":
      extra = `
OUTPUT (STRICT JSON ONLY — no prose, no code fences)
{
  "action": "isolate" | "hide" | "highlight",
  "dbIds": [ <number> | <numbers> ]
}
RULES
- Map the user's intent to one of the three actions.
- Only include existing dbIds. If none found: {"action":"none","reason":"Not in provided data"}`
      .trim();
      break;

    case "daterange":
      extra = `
FOCUS
- Compute earliest and latest dates present in fields such as PlannedStart/PlannedEnd/StartDate/EndDate (use only keys that actually exist).
- If dates are strings, treat as ISO; ignore malformed values.

OUTPUT
- Short narrative with earliest and latest dates found.
- Provide a JSON summary:
  { "earliest": "<ISO>", "latest": "<ISO>", "countWithDates": <number> }`
      .trim();
      break;

    case "general":
    default:
      extra = `
FOCUS
- Answer questions about counts, filters, grouping by properties (e.g., Category, LevelName, TypeName).
- If asked for IDs, return dbIds.

OUTPUT
- Counts => number
- Lists => arrays (prefer dbIds)
- If something isn't present, say "Not in provided data"`.trim();
      break;
  }

  const shape = `
DATA SHAPE (may vary per record)
Common keys seen in exports: dbId, externalId, ElementId, URN (or modelUrn),
Category, Family, TypeName, ElementType, LevelName, Phase, Discipline,
Status, PlannedStart, PlannedEnd, StartDate, EndDate, Cost, Quantity, Unit,
and many others. Use ONLY keys present in DATA.`.trim();

  return `
${intro}

${shape}

${headerRules(extra)}

DATA:
${limitChars(items)}

QUESTION:
${question}`.trim();
}

/* ========= Exports ========= */
module.exports = {
  issuesPrompt,
  usersPrompt,
  submittalsPrompt,
  rfisPrompt,
  modelDataPrompt,
};
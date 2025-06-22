const axios = require('axios');

const  getAllBusinessUnits = async (token, accountId) => {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!accountId) throw new Error('Account ID is required');

  let allBusinessUnits = [];
  let nextUrl = `https://developer.api.autodesk.com/hq/v1/accounts/${accountId}/business_units_structure?limit=20&offset=0`;

  while (nextUrl) {
    const { data: businessUnits } = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    allBusinessUnits = allBusinessUnits.concat(businessUnits.results);
    nextUrl = businessUnits.pagination.nextUrl;
  }

  return allBusinessUnits;
}

module.exports = { getAllBusinessUnits };

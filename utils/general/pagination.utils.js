const axios = require("axios");

/* This function fetches all paginated results from a given URL.
    It handles pagination by using the 'limit' and 'offset' parameters to retrieve results in chunks.
    The function continues to fetch results until there are no more pages left.
    It returns an array containing all the results fetched from the API.
    
    @param {string} initialUrl - The base URL to start fetching data from.
    @param {string} token - The authorization token for the API request.
    @param {number} pageSize - The number of results to fetch per page (default is 100).
    @returns {Promise<Array>} - A promise that resolves to an array of all results.
*/

const fetchAllPaginatedResults = async (initialUrl, token, pageSize = 100) => {
  const results = [];
  let offset = 0;
  let totalResults = Infinity;

  while (offset < totalResults) {
    const url = new URL(initialUrl);
    url.searchParams.set("limit", pageSize);
    url.searchParams.set("offset", offset);

    const { data } = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (Array.isArray(data.results)) {
      results.push(...data.results);
    } else {
      break;  
    }

    totalResults = data.pagination.totalResults;
    offset += data.pagination.limit;  
  }

  //console.log("results", results);
  return results;
};

module.exports = { fetchAllPaginatedResults };


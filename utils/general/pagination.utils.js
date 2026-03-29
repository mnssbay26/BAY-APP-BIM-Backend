const axios = require("axios");

/* This utility centralizes Autodesk pagination handling.
   It supports offset-based pagination, cursor-based pagination,
   nextUrl/links.next.href navigation, and common Autodesk result shapes.
*/

const getResultsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getPaginationFromResponse = (data) =>
  data?.pagination || data?.data?.pagination || null;

const getLinksFromResponse = (data) => data?.links || data?.data?.links || null;

const normalizePaginationOptions = (options) => {
  if (typeof options === "number") {
    return { limit: options, offset: 0 };
  }

  return options || {};
};

const resolveAbsoluteUrl = (candidate, currentUrl) => {
  if (typeof candidate !== "string" || !candidate.trim()) {
    return null;
  }

  try {
    return new URL(candidate, currentUrl).toString();
  } catch {
    return null;
  }
};

const resolveNextPageUrl = (data, currentUrl, cursorParam = "cursorState") => {
  const pagination = getPaginationFromResponse(data);
  const links = getLinksFromResponse(data);

  const linkedNextUrl = resolveAbsoluteUrl(
    pagination?.nextUrl || links?.next?.href || null,
    currentUrl
  );

  if (linkedNextUrl) {
    return linkedNextUrl;
  }

  try {
    const nextUrl = new URL(currentUrl);
    const currentCursor = nextUrl.searchParams.get(cursorParam);
    const nextCursor =
      typeof pagination?.cursorState === "string"
        ? pagination.cursorState.trim()
        : "";

    if (nextCursor && nextCursor !== currentCursor) {
      nextUrl.searchParams.set(cursorParam, nextCursor);
      return nextUrl.toString();
    }

    const limit = Number(
      pagination?.limit ?? nextUrl.searchParams.get("limit") ?? NaN
    );
    const offset = Number(
      pagination?.offset ?? nextUrl.searchParams.get("offset") ?? 0
    );
    const totalResults = Number(pagination?.totalResults);

    if (
      Number.isFinite(limit) &&
      limit > 0 &&
      Number.isFinite(offset) &&
      Number.isFinite(totalResults) &&
      offset + limit < totalResults
    ) {
      nextUrl.searchParams.set("limit", String(limit));
      nextUrl.searchParams.set("offset", String(offset + limit));
      return nextUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const buildInitialUrl = (initialUrl, options = {}) => {
  const normalizedOptions = normalizePaginationOptions(options);
  const url = new URL(initialUrl);

  if (normalizedOptions.limit && !url.searchParams.has("limit")) {
    url.searchParams.set("limit", String(normalizedOptions.limit));
  }

  if (
    normalizedOptions.offset !== undefined &&
    normalizedOptions.offset !== null &&
    !url.searchParams.has("offset")
  ) {
    url.searchParams.set("offset", String(normalizedOptions.offset));
  }

  return url.toString();
};

const collectPaginatedResults = async (initialUrl, token, options = {}) => {
  const normalizedOptions = normalizePaginationOptions(options);
  const results = [];
  const visitedUrls = new Set();
  const cursorParam = normalizedOptions.cursorParam || "cursorState";

  let nextUrl = buildInitialUrl(initialUrl, normalizedOptions);
  let firstData;

  while (nextUrl && !visitedUrls.has(nextUrl)) {
    visitedUrls.add(nextUrl);

    const { data } = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (firstData === undefined) {
      firstData = data;
    }

    results.push(...getResultsFromResponse(data));

    const resolvedNextUrl = resolveNextPageUrl(data, nextUrl, cursorParam);
    nextUrl =
      resolvedNextUrl && !visitedUrls.has(resolvedNextUrl)
        ? resolvedNextUrl
        : null;
  }

  return { firstData, results };
};

const normalizePagination = (pagination, totalResults) => {
  if (!pagination || typeof pagination !== "object") {
    return pagination;
  }

  const normalized = { ...pagination };

  if ("totalResults" in normalized) normalized.totalResults = totalResults;
  if ("offset" in normalized) normalized.offset = 0;
  if ("nextUrl" in normalized) normalized.nextUrl = null;
  if ("cursorState" in normalized) normalized.cursorState = null;

  return normalized;
};

const fetchAllPaginatedResults = async (initialUrl, token, options = {}) => {
  const { results } = await collectPaginatedResults(initialUrl, token, options);
  return results;
};

const fetchCompletePaginatedResponse = async (
  initialUrl,
  token,
  options = {}
) => {
  const { firstData, results } = await collectPaginatedResults(
    initialUrl,
    token,
    options
  );

  if (firstData === undefined) {
    return [];
  }

  if (Array.isArray(firstData)) {
    return results;
  }

  if (Array.isArray(firstData?.results)) {
    return {
      ...firstData,
      results,
      pagination: normalizePagination(firstData.pagination, results.length),
    };
  }

  if (Array.isArray(firstData?.data?.results)) {
    return {
      ...firstData,
      pagination: normalizePagination(firstData.pagination, results.length),
      data: {
        ...firstData.data,
        results,
        pagination: normalizePagination(firstData.data.pagination, results.length),
      },
    };
  }

  if (Array.isArray(firstData?.data)) {
    return {
      ...firstData,
      data: results,
      pagination: normalizePagination(firstData.pagination, results.length),
    };
  }

  return firstData;
};

module.exports = {
  fetchAllPaginatedResults,
  fetchCompletePaginatedResponse,
};

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const port = process.env.PORT || 3000;
const siteFolder = __dirname;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getApodArticles(startDate, endDate) {
  const startExclusive = new Date(`${startDate}T00:00:00Z`);
  startExclusive.setUTCDate(startExclusive.getUTCDate() - 1);

  const endExclusive = new Date(`${endDate}T00:00:00Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  const articles = [];
  let page = 1;
  let totalPages = 1;

  // Query from the previous day so midnight posts on the start date are included.
  while (page <= totalPages && page <= 11) {
    const query = new URLSearchParams({
      after: `${startExclusive.toISOString().slice(0, 10)}T00:00:00`,
      before: `${endExclusive.toISOString().slice(0, 10)}T00:00:00`,
      per_page: "100",
      page: String(page),
      orderby: "date",
      order: "asc",
      _fields: "date,link,title,content"
    });

    const nasaResponse = await fetch(
      `https://science.nasa.gov/wp-json/wp/v2/image-article?${query}`
    );

    if (!nasaResponse.ok) {
      throw new Error(`NASA's archive returned HTTP ${nasaResponse.status}.`);
    }

    const pageArticles = await nasaResponse.json();
    articles.push(...pageArticles);
    totalPages = Number(nasaResponse.headers.get("X-WP-TotalPages") || 1);
    page++;
  }

  return articles
    .filter(article => {
      const articleDate = article.date.slice(0, 10);
      return articleDate >= startDate && articleDate <= endDate &&
        article.title?.rendered?.startsWith("APOD:");
    })
    .map(article => ({
      date: article.date.slice(0, 10),
      title: article.title.rendered,
      link: article.link,
      content: article.content.rendered
    }));
}

const server = http.createServer(async (request, response) => {
  const requestURL = new URL(request.url, `http://${request.headers.host}`);

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Only GET requests are supported." });
    return;
  }

  if (requestURL.pathname === "/api/apod") {
    const startDate = requestURL.searchParams.get("start_date");
    const endDate = requestURL.searchParams.get("end_date");

    if (!isValidDate(startDate || "") || !isValidDate(endDate || "")) {
      sendJson(response, 400, { error: "Choose valid start and end dates." });
      return;
    }

    if (startDate > endDate) {
      sendJson(response, 400, { error: "Start date must be before end date." });
      return;
    }

    const numberOfDays =
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
        86400000 + 1;

    if (numberOfDays > 1000) {
      sendJson(response, 400, { error: "Choose a date range of 1000 days or less." });
      return;
    }

    try {
      const articles = await getApodArticles(startDate, endDate);
      sendJson(response, 200, articles);
    } catch (error) {
      sendJson(response, 502, { error: error.message });
    }

    return;
  }

  const requestedPath = decodeURIComponent(
    requestURL.pathname === "/" ? "/index.html" : requestURL.pathname
  );
  const filePath = path.resolve(siteFolder, `.${requestedPath}`);

  if (!filePath.startsWith(`${siteFolder}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = contentTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Space Explorer is running at http://localhost:${port}`);
});
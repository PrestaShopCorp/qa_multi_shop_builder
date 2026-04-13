const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");

const PORT = Number(process.env.PORT || 4173);
const MYTUN_PREFIX = "prestashop";
const UI_DIR = __dirname;
const ROOT_DIR = path.resolve(process.env.QA_SHOP_BUILDER_ROOT || path.join(__dirname, ".."));
const DATA_DIR = path.join(ROOT_DIR, ".qa-shop-builder");
const CREDENTIALS_FILE = path.join(DATA_DIR, "credentials.json");
const BUILD_LOG_MAX_CHARS = 120000;
const DEFAULT_SHOP_ID = 0;
const MAX_ZIP_UPLOAD_BYTES = 1024 * 1024 * 512;

const DEFAULT_CREDENTIALS = Object.freeze({
  mytun: {
    ACCOUNT_TAG: "",
    TUNNEL_SECRET: "",
    TUNNEL_ID: "",
    DOMAIN: "",
    PREFIX: MYTUN_PREFIX,
  },
  ngrok: {
    NGROK_AUTHTOKEN: "",
    PS_DOMAIN: "",
  },
});

let currentBuild = null;
let buildCounter = 0;
let buildPanels = [];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function cloneCredentials() {
  return JSON.parse(JSON.stringify(DEFAULT_CREDENTIALS));
}

function normalizeBuildRequest(payload = {}) {
  const raw = payload.build ?? payload;
  const imageType =
    raw.imageType === "flashlight" || raw.imageType === "multistore" ? raw.imageType : "official";
  const installMode = raw.installMode === "manual" ? "manual" : "auto";
  const parsedShopId = Number.parseInt(`${raw.shopId ?? DEFAULT_SHOP_ID}`, 10);
  const rawImages = raw.images ?? {};

  return {
    action: raw.action === "down" ? "down" : "up",
    provider: raw.provider === "ngrok" ? "ngrok" : "mytun",
    source: raw.source === "zip" ? "zip" : "image",
    imageType,
    installMode,
    shopId: Number.isNaN(parsedShopId) || parsedShopId < 0 ? DEFAULT_SHOP_ID : parsedShopId,
    images: {
      official: stripWrappingQuotes(normalizeString(rawImages.official)),
      flashlight: stripWrappingQuotes(normalizeString(rawImages.flashlight)),
      multistoreShop1: stripWrappingQuotes(normalizeString(rawImages.multistoreShop1)),
      multistoreShop2: stripWrappingQuotes(normalizeString(rawImages.multistoreShop2)),
    },
  };
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  if (
    (value.startsWith('\\"') && value.endsWith('\\"')) ||
    (value.startsWith("\\'") && value.endsWith("\\'"))
  ) {
    return value.slice(2, -2).trim();
  }

  return value;
}

function normalizeCredentialValue(value, expectedKey) {
  const normalized = normalizeString(value).split(/\r?\n/, 1)[0] || "";
  if (!normalized) {
    return "";
  }

  let sanitized = normalized.replace(/^export\s+/i, "");
  if (expectedKey) {
    const keyPattern = new RegExp(`^${expectedKey}\\s*=\\s*`, "i");
    sanitized = sanitized.replace(keyPattern, "");
  }

  return stripWrappingQuotes(sanitized);
}

function normalizeCredentials(payload = {}) {
  const raw = payload.credentials ?? payload;
  const normalized = cloneCredentials();

  normalized.mytun.ACCOUNT_TAG = normalizeCredentialValue(raw.mytun?.ACCOUNT_TAG, "ACCOUNT_TAG");
  normalized.mytun.TUNNEL_SECRET = normalizeCredentialValue(raw.mytun?.TUNNEL_SECRET, "TUNNEL_SECRET");
  normalized.mytun.TUNNEL_ID = normalizeCredentialValue(raw.mytun?.TUNNEL_ID, "TUNNEL_ID");
  normalized.mytun.DOMAIN = normalizeCredentialValue(raw.mytun?.DOMAIN, "DOMAIN");
  normalized.mytun.PREFIX = MYTUN_PREFIX;
  normalized.ngrok.NGROK_AUTHTOKEN = normalizeCredentialValue(
    raw.ngrok?.NGROK_AUTHTOKEN,
    "NGROK_AUTHTOKEN"
  );
  normalized.ngrok.PS_DOMAIN = normalizeCredentialValue(raw.ngrok?.PS_DOMAIN, "PS_DOMAIN");

  return normalized;
}

function deriveMytunPsDomain(mytunCredentials) {
  if (!mytunCredentials.DOMAIN) {
    return "";
  }

  return `${MYTUN_PREFIX}.${mytunCredentials.DOMAIN}`;
}

function imageTypeToMakeTarget(imageType) {
  if (imageType === "flashlight") {
    return "flashlight";
  }

  if (imageType === "multistore") {
    return "multistore";
  }

  return "monostore";
}

function getFlowSpec(buildRequest) {
  if (buildRequest.source === "image" && buildRequest.provider === "mytun") {
    const relativeWorkdir = "build-Shop_with_MyTun";
    const target = imageTypeToMakeTarget(buildRequest.imageType);

    return {
      relativeWorkdir,
      upArgs: [target],
      upCommand: `make ${target}`,
      requiresZip: false,
    };
  }

  if (buildRequest.source === "image" && buildRequest.provider === "ngrok") {
    const relativeWorkdir = "build-Shop_with_Ngrok";
    const target = imageTypeToMakeTarget(buildRequest.imageType);

    return {
      relativeWorkdir,
      upArgs: [target],
      upCommand: `make ${target}`,
      requiresZip: false,
    };
  }

  if (buildRequest.source === "zip" && buildRequest.provider === "mytun") {
    const relativeWorkdir = "build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed";

    return {
      relativeWorkdir,
      upArgs: [`SHOP_ID=${buildRequest.shopId}`, `ZIP_INSTALL_MODE=${buildRequest.installMode}`, "shop"],
      upCommand: `make SHOP_ID=${buildRequest.shopId} ZIP_INSTALL_MODE=${buildRequest.installMode} shop`,
      requiresZip: true,
      zipPath: path.join(ROOT_DIR, relativeWorkdir, "prestashop.zip"),
    };
  }

  const relativeWorkdir = "build-Shop_with_ZIP_Ngrok";
  return {
    relativeWorkdir,
    upArgs: [`ZIP_INSTALL_MODE=${buildRequest.installMode}`, "shop"],
    upCommand: `make ZIP_INSTALL_MODE=${buildRequest.installMode} shop`,
    requiresZip: true,
    zipPath: path.join(ROOT_DIR, relativeWorkdir, "prestashop.zip"),
  };
}

function getBuildSpec(buildRequest) {
  const flow = getFlowSpec(buildRequest);
  const cwd = path.join(ROOT_DIR, flow.relativeWorkdir);

  if (buildRequest.action === "down") {
    if (buildRequest.source === "zip" && buildRequest.provider === "mytun") {
      return {
        args: [`SHOP_ID=${buildRequest.shopId}`, "down"],
        command: `make SHOP_ID=${buildRequest.shopId} down`,
        cwd,
        relativeWorkdir: flow.relativeWorkdir,
        requiresZip: false,
      };
    }

    return {
      args: ["down"],
      command: "make down",
      cwd,
      relativeWorkdir: flow.relativeWorkdir,
      requiresZip: false,
    };
  }

  return {
    args: flow.upArgs,
    command: flow.upCommand,
    cwd,
    relativeWorkdir: flow.relativeWorkdir,
    requiresZip: flow.requiresZip,
    zipPath: flow.zipPath,
  };
}

function trimBuildLogs(logs) {
  if (logs.length <= BUILD_LOG_MAX_CHARS) {
    return logs;
  }

  return logs.slice(-BUILD_LOG_MAX_CHARS);
}

function appendBuildLogs(build, chunk) {
  const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
  build.logs = trimBuildLogs(`${build.logs}${text}`);
  build.updatedAt = new Date().toISOString();
}

function getBuildSlotKey(buildRequest) {
  if (buildRequest.provider === "mytun" && buildRequest.source === "zip") {
    return `mytun-zip-shop-${buildRequest.shopId}`;
  }

  return [
    buildRequest.provider,
    buildRequest.source,
    buildRequest.imageType,
    buildRequest.installMode,
    buildRequest.shopId,
  ].join(":");
}

function shouldRemovePanelAfterSuccess(build) {
  return (
    build &&
    build.action === "down" &&
    build.provider === "mytun" &&
    build.source === "zip"
  );
}

function removeBuildPanel(slotKey) {
  buildPanels = buildPanels.filter((panel) => panel.slotKey !== slotKey);
}

function getZipUploadSpec(provider) {
  if (provider === "ngrok") {
    return {
      relativePath: "build-Shop_with_ZIP_Ngrok/prestashop.zip",
      absolutePath: path.join(ROOT_DIR, "build-Shop_with_ZIP_Ngrok", "prestashop.zip"),
    };
  }

  return {
    relativePath: "build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed/prestashop.zip",
    absolutePath: path.join(
      ROOT_DIR,
      "build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed",
      "prestashop.zip"
    ),
  };
}

function serializeBuild(build) {
  if (!build) {
    return null;
  }

  return {
    slotKey: build.slotKey,
    id: build.id,
    status: build.status,
    action: build.action,
    provider: build.provider,
    source: build.source,
    imageType: build.imageType,
    installMode: build.installMode,
    images: build.images,
    shopId: build.shopId,
    command: build.command,
    workdir: build.workdir,
    logs: build.logs,
    exitCode: build.exitCode,
    errorMessage: build.errorMessage,
    startedAt: build.startedAt,
    endedAt: build.endedAt,
    updatedAt: build.updatedAt,
  };
}

function serializeBuildPanels() {
  return buildPanels.map((build) => serializeBuild(build));
}

function finalizeBuild(build, status, options = {}) {
  if (build.status !== "running") {
    return;
  }

  build.status = status;
  build.exitCode = options.exitCode ?? build.exitCode ?? null;
  build.errorMessage = options.errorMessage ?? build.errorMessage ?? "";
  build.endedAt = new Date().toISOString();
  build.updatedAt = build.endedAt;
  build.child = null;
}

function validateBuildCredentials(credentials, buildRequest) {
  if (buildRequest.action !== "up") {
    return "";
  }

  if (buildRequest.provider === "mytun" && !isMytunConfigured(credentials)) {
    return "MyTun credentials are incomplete for this build.";
  }

  if (buildRequest.provider === "ngrok" && !isNgrokConfigured(credentials)) {
    return "Ngrok credentials are incomplete for this build.";
  }

  if (buildRequest.source === "image" && buildRequest.imageType === "official" && !buildRequest.images.official) {
    return "Official image tag is missing for this build.";
  }

  if (
    buildRequest.source === "image" &&
    buildRequest.imageType === "flashlight" &&
    !buildRequest.images.flashlight
  ) {
    return "Flashlight image tag is missing for this build.";
  }

  if (
    buildRequest.source === "image" &&
    buildRequest.imageType === "multistore" &&
    (!buildRequest.images.multistoreShop1 || !buildRequest.images.multistoreShop2)
  ) {
    return "Multistore image tags are missing for this build.";
  }

  return "";
}

function getBuildEnv(buildRequest) {
  const env = { ...process.env };

  if (buildRequest.action !== "up") {
    return env;
  }

  if (buildRequest.source === "zip") {
    env.ZIP_INSTALL_MODE = buildRequest.installMode;
    return env;
  }

  if (buildRequest.imageType === "official") {
    env.SHOP1_IMAGE_TAG = buildRequest.images.official;
    return env;
  }

  if (buildRequest.imageType === "flashlight") {
    env.FLASHLIGHT_IMAGE_TAG = buildRequest.images.flashlight;
    return env;
  }

  env.SHOP1_IMAGE_TAG = buildRequest.images.multistoreShop1;
  env.SHOP2_IMAGE_TAG = buildRequest.images.multistoreShop2;
  return env;
}

function isMytunConfigured(credentials) {
  const mytun = credentials.mytun;
  return Boolean(
    mytun.ACCOUNT_TAG &&
      mytun.TUNNEL_SECRET &&
      mytun.TUNNEL_ID &&
      mytun.DOMAIN
  );
}

function isNgrokConfigured(credentials) {
  const ngrok = credentials.ngrok;
  return Boolean(ngrok.NGROK_AUTHTOKEN && ngrok.PS_DOMAIN);
}

function quoteEnvValue(value) {
  return `"${String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildEnvContent(entries) {
  return `${entries.map(([key, value]) => `${key}=${quoteEnvValue(value)}`).join("\n")}\n`;
}

async function loadCredentials() {
  try {
    const file = await fs.readFile(CREDENTIALS_FILE, "utf8");
    return normalizeCredentials(JSON.parse(file));
  } catch (error) {
    if (error.code === "ENOENT") {
      return cloneCredentials();
    }

    throw error;
  }
}

async function writeCredentials(credentials) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    CREDENTIALS_FILE,
    `${JSON.stringify({ credentials }, null, 2)}\n`,
    "utf8"
  );
}

async function persistNormalizedCredentials(credentials) {
  await writeCredentials(credentials);
  const updatedEnvFiles = await syncEnvFiles(credentials);

  return {
    credentials,
    updatedEnvFiles,
  };
}

async function syncEnvFiles(credentials) {
  const updates = [];

  if (isMytunConfigured(credentials)) {
    const mytunPsDomain = deriveMytunPsDomain(credentials.mytun);

    updates.push({
      relativePath: "build-Shop_with_MyTun/.env",
      absolutePath: path.join(ROOT_DIR, "build-Shop_with_MyTun", ".env"),
      content: buildEnvContent([
        ["ACCOUNT_TAG", credentials.mytun.ACCOUNT_TAG],
        ["TUNNEL_SECRET", credentials.mytun.TUNNEL_SECRET],
        ["TUNNEL_ID", credentials.mytun.TUNNEL_ID],
        ["PS_DOMAIN", mytunPsDomain],
      ]),
    });

    updates.push({
      relativePath: "build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed/.env",
      absolutePath: path.join(
        ROOT_DIR,
        "build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed",
        ".env"
      ),
      content: buildEnvContent([
        ["ACCOUNT_TAG", credentials.mytun.ACCOUNT_TAG],
        ["TUNNEL_SECRET", credentials.mytun.TUNNEL_SECRET],
        ["TUNNEL_ID", credentials.mytun.TUNNEL_ID],
        ["PREFIX", credentials.mytun.PREFIX],
        ["DOMAIN", credentials.mytun.DOMAIN],
      ]),
    });
  }

  if (isNgrokConfigured(credentials)) {
    updates.push({
      relativePath: "build-Shop_with_Ngrok/.env",
      absolutePath: path.join(ROOT_DIR, "build-Shop_with_Ngrok", ".env"),
      content: buildEnvContent([
        ["NGROK_AUTHTOKEN", credentials.ngrok.NGROK_AUTHTOKEN],
        ["PS_DOMAIN", credentials.ngrok.PS_DOMAIN],
      ]),
    });

    updates.push({
      relativePath: "build-Shop_with_ZIP_Ngrok/.env",
      absolutePath: path.join(ROOT_DIR, "build-Shop_with_ZIP_Ngrok", ".env"),
      content: buildEnvContent([
        ["NGROK_AUTHTOKEN", credentials.ngrok.NGROK_AUTHTOKEN],
        ["PS_DOMAIN", credentials.ngrok.PS_DOMAIN],
      ]),
    });
  }

  await Promise.all(
    updates.map((update) => fs.writeFile(update.absolutePath, update.content, "utf8"))
  );

  return updates.map((update) => update.relativePath);
}

async function persistCredentials(payload) {
  const credentials = normalizeCredentials(payload);
  return persistNormalizedCredentials(credentials);
}

async function ensureBuildPrerequisites(buildSpec) {
  if (!buildSpec.requiresZip) {
    return;
  }

  try {
    await fs.access(buildSpec.zipPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      const missingZipError = new Error("prestashop.zip is missing for the selected ZIP flow.");
      missingZipError.statusCode = 400;
      throw missingZipError;
    }

    throw error;
  }
}

async function launchBuild(payload) {
  const buildRequest = normalizeBuildRequest(payload);
  const credentials = normalizeCredentials(payload);
  const validationError = validateBuildCredentials(credentials, buildRequest);

  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  if (currentBuild && currentBuild.status === "running") {
    const error = new Error("A build is already running.");
    error.statusCode = 409;
    throw error;
  }

  const persistResult =
    buildRequest.action === "up"
      ? await persistNormalizedCredentials(credentials)
      : { credentials, updatedEnvFiles: [] };
  const buildSpec = getBuildSpec(buildRequest);
  await ensureBuildPrerequisites(buildSpec);

  const existingPanelIndex = buildPanels.findIndex(
    (panel) => panel.slotKey === getBuildSlotKey(buildRequest)
  );
  const previousPanel = existingPanelIndex >= 0 ? buildPanels[existingPanelIndex] : null;
  const previousLogs = previousPanel?.logs?.trim()
    ? `${previousPanel.logs}\n\n---\n\n`
    : "";
  const build = {
    slotKey: getBuildSlotKey(buildRequest),
    id: `build-${Date.now()}-${++buildCounter}`,
    status: "running",
    action: buildRequest.action,
    provider: buildRequest.provider,
    source: buildRequest.source,
    imageType: buildRequest.imageType,
    installMode: buildRequest.installMode,
    images: buildRequest.images,
    shopId: buildRequest.shopId,
    command: buildSpec.command,
    workdir: buildSpec.relativeWorkdir,
    logs: previousLogs,
    exitCode: null,
    errorMessage: "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    updatedAt: new Date().toISOString(),
    child: null,
  };

  if (existingPanelIndex >= 0) {
    buildPanels[existingPanelIndex] = build;
  } else {
    buildPanels.push(build);
  }

  currentBuild = build;
  appendBuildLogs(build, `$ ${build.command}\n\n`);

  const child = spawn("make", buildSpec.args, {
    cwd: buildSpec.cwd,
    env: getBuildEnv(buildRequest),
    stdio: ["ignore", "pipe", "pipe"],
  });

  build.child = child;

  child.stdout.on("data", (chunk) => {
    appendBuildLogs(build, chunk);
  });

  child.stderr.on("data", (chunk) => {
    appendBuildLogs(build, chunk);
  });

  child.on("error", (error) => {
    appendBuildLogs(build, `\n[error] ${error.message}\n`);
    finalizeBuild(build, "failed", { errorMessage: error.message });
  });

  child.on("close", (code, signal) => {
    if (signal) {
      appendBuildLogs(build, `\nProcess terminated by signal ${signal}.\n`);
      finalizeBuild(build, "failed", {
        exitCode: code,
        errorMessage: `Process terminated by signal ${signal}.`,
      });
      return;
    }

    if (code === 0) {
      appendBuildLogs(build, "\nProcess finished successfully.\n");
      finalizeBuild(build, "succeeded", { exitCode: 0 });
      if (shouldRemovePanelAfterSuccess(build)) {
        removeBuildPanel(build.slotKey);
      }
      return;
    }

    appendBuildLogs(build, `\nProcess exited with code ${code}.\n`);
    finalizeBuild(build, "failed", {
      exitCode: code,
      errorMessage: `Process exited with code ${code}.`,
    });
  });

  return {
    credentials: persistResult.credentials,
    build: serializeBuild(build),
    builds: serializeBuildPanels(),
    updatedEnvFiles: persistResult.updatedEnvFiles,
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

async function readBinaryBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_ZIP_UPLOAD_BYTES) {
        reject(new Error("ZIP upload is too large."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    request.on("error", reject);
  });
}

async function persistUploadedZip(request) {
  const provider = request.headers["x-provider"] === "ngrok" ? "ngrok" : "mytun";
  const uploadSpec = getZipUploadSpec(provider);
  const zipBuffer = await readBinaryBody(request);

  if (!zipBuffer.length) {
    const error = new Error("ZIP upload is empty.");
    error.statusCode = 400;
    throw error;
  }

  await fs.writeFile(uploadSpec.absolutePath, zipBuffer);

  return {
    provider,
    relativePath: uploadSpec.relativePath,
    size: zipBuffer.length,
  };
}

async function serveStaticFile(response, pathname) {
  const safePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const absolutePath = path.resolve(UI_DIR, safePath);

  if (!absolutePath.startsWith(`${UI_DIR}${path.sep}`)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await fs.readFile(absolutePath);
    const extension = path.extname(absolutePath);

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    sendJson(response, 500, { error: "Unable to read file" });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/credentials") {
      const credentials = await loadCredentials();
      sendJson(response, 200, { credentials });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/build") {
      sendJson(response, 200, {
        build: serializeBuild(currentBuild),
        builds: serializeBuildPanels(),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/credentials") {
      const payload = await readJsonBody(request);
      const result = await persistCredentials(payload);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/build") {
      const payload = await readJsonBody(request);
      const result = await launchBuild(payload);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/zip") {
      const result = await persistUploadedZip(request);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET") {
      await serveStaticFile(response, url.pathname);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unexpected server error",
      build: serializeBuild(currentBuild),
      builds: serializeBuildPanels(),
    });
  }
});

server.listen(PORT, () => {
  console.log(`QA Shop Builder UI available on http://127.0.0.1:${PORT}`);
});

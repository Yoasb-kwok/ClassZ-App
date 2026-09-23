const http = require("http")

const HOST = "0.0.0.0"
const PORT = Number(process.env.PORT || 3003)

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

function createToken(user) {
  const header = { alg: "none", typ: "JWT" }
  const payload = {
    email: user.email,
    name: user.name,
    role: user.role,
    center_id: 1,
    iat: Math.floor(Date.now() / 1000),
  }
  return `${base64url(header)}.${base64url(payload)}.`
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  })
  res.end(JSON.stringify(body))
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = ""
    req.on("data", (chunk) => {
      raw += chunk
    })
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {})
    return
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, { success: true, message: "Mock API is running" })
    return
  }

  if (req.method === "POST" && req.url === "/api/user/login") {
    const body = await readJson(req)
    const loginIdentifier = String(body.loginIdentifier || "").trim()
    const password = String(body.password || "")

    if (!loginIdentifier || !password) {
      sendJson(res, 400, { success: false, msg: "Enter any email/username and password" })
      return
    }

    const user = {
      email: loginIdentifier.includes("@") ? loginIdentifier : `${loginIdentifier}@classz.test`,
      name: loginIdentifier.includes("@") ? loginIdentifier.split("@")[0] : loginIdentifier,
      role: "parent",
    }

    sendJson(res, 200, {
      success: true,
      token: createToken(user),
      user,
    })
    return
  }

  sendJson(res, 404, { success: false, msg: `No mock route for ${req.method} ${req.url}` })
})

server.listen(PORT, HOST, () => {
  console.log(`Mock API listening at http://${HOST}:${PORT}`)
  console.log("Login endpoint: POST /api/user/login")
})

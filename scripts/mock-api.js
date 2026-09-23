const http = require("http")

const HOST = process.env.HOST || "0.0.0.0"
const PORT = Number(process.env.PORT || 3003)

const PARENT_ACCOUNT = {
  email: "parent@classz.test",
  password: "123456",
  name: "Emily Parent",
  role: "parent",
}

function encodeJwtPart(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

function createMockToken(user) {
  return [
    encodeJwtPart({ alg: "none", typ: "JWT" }),
    encodeJwtPart({
      email: user.email,
      name: user.name,
      role: user.role,
      center_id: 1,
      is_admin: 0,
      iat: Math.floor(Date.now() / 1000),
    }),
    "",
  ].join(".")
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

    const normalizedLogin = loginIdentifier.toLowerCase()
    const validParentLogin =
      normalizedLogin === PARENT_ACCOUNT.email || normalizedLogin === "parent" || normalizedLogin === "emily"

    if (!validParentLogin || password !== PARENT_ACCOUNT.password) {
      sendJson(res, 401, {
        success: false,
        msg: "Use parent@classz.test / 123456 for the mock parent account",
      })
      return
    }

    const user = {
      email: PARENT_ACCOUNT.email,
      name: PARENT_ACCOUNT.name,
      role: PARENT_ACCOUNT.role,
    }

    sendJson(res, 200, {
      success: true,
      token: createMockToken(user),
      user,
    })
    return
  }

  sendJson(res, 404, { success: false, msg: `No mock route for ${req.method} ${req.url}` })
})

server.listen(PORT, HOST, () => {
  console.log(`Mock API listening at http://${HOST}:${PORT}`)
  console.log("Health: GET /api/health")
  console.log("Login:  POST /api/user/login")
  console.log(`Parent account: ${PARENT_ACCOUNT.email} / ${PARENT_ACCOUNT.password}`)
})

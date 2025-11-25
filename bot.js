// index.js
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

// === CONFIG ===
// Put your real API credentials into environment variables when you run:
//   export API_ID=123456
//   export API_HASH="abcdef..."
//   export MTPROTO_ENABLED=true
const API_ID = process.env.API_ID || null;
const API_HASH = process.env.API_HASH || null;
const MTPROTO_ENABLED = process.env.MTPROTO_ENABLED === "true" || false;

// If you uploaded an image locally, we reference it here (developer asked to expose this path).
// This is the path you previously uploaded in this session — we'll serve it as /uploaded-image
const UPLOADED_IMAGE_PATH = "/mnt/data/970348BE-70BF-4A7F-8ABC-017B62EC9869.jpeg";

// Try to load MTProto client if available (optional).
let mtproto = null;
if (MTPROTO_ENABLED && API_ID && API_HASH) {
  try {
    // Try to require a popular MTProto client. If not installed, we'll leave mtproto = null.
    // NOTE: different MTProto libraries have different APIs. Adjust below if you use another lib.
    const { MTProto } = require("@mtproto/core");
    mtproto = new MTProto({
      api_id: Number(API_ID),
      api_hash: String(API_HASH)
    });
    console.log("MTProto client initialized (experimental).");
  } catch (e) {
    console.warn("MTProto not initialized — @mtproto/core not installed or failed to load.");
    mtproto = null;
  }
} else {
  console.log("MTProto disabled — using demo/mock mode.");
}

// Serve index.html and static (simple)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve uploaded image directly from the given local path
app.get("/uploaded-image", (req, res) => {
  if (fs.existsSync(UPLOADED_IMAGE_PATH)) {
    res.sendFile(UPLOADED_IMAGE_PATH);
  } else {
    res.status(404).send("Uploaded image not found on server.");
  }
});

// 1) SEND CODE
app.post("/sendCode", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ ok: false, error: "phone is required" });

    if (mtproto) {
      // Real MTProto call (may require adjustments for the MTProto library you're using)
      const result = await mtproto.call("auth.sendCode", {
        phone_number: phone,
        settings: { _: "codeSettings" }
      });
      // result.phone_code_hash is expected
      return res.json({ ok: true, phone_code_hash: result.phone_code_hash });
    } else {
      // Demo/mock response (for development/testing on environments without MTProto)
      // Generate a fake phone_code_hash so frontend can call verify
      const fakeHash = "demo_hash_" + Math.random().toString(36).slice(2, 10);
      console.log(`MOCK sendCode for ${phone} -> ${fakeHash}`);
      return res.json({ ok: true, phone_code_hash: fakeHash, demo: true });
    }
  } catch (err) {
    console.error("sendCode error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// 2) VERIFY CODE (sign in)
app.post("/verifyCode", async (req, res) => {
  try {
    const { phone, phone_code_hash, code } = req.body;
    if (!phone || !phone_code_hash || !code) {
      return res.status(400).json({ ok: false, error: "phone, phone_code_hash and code are required" });
    }

    if (mtproto) {
      // Real sign-in (may need additional error handling)
      const signIn = await mtproto.call("auth.signIn", {
        phone_number: phone,
        phone_code_hash,
        phone_code: code
      });
      return res.json({ ok: true, user: signIn.user });
    } else {
      // Demo verification: accept any 4-8 digit code for demo purposes
      console.log(`MOCK verify for ${phone} hash=${phone_code_hash} code=${code}`);
      if (code && code.length >= 3) {
        // Return fake user object
        return res.json({
          ok: true,
          demo: true,
          user: {
            id: Math.floor(Math.random() * 1000000),
            phone: phone,
            first_name: "Demo",
            username: "demo_user"
          }
        });
      } else {
        return res.json({ ok: false, error: "Invalid code (demo rules)" });
      }
    }
  } catch (err) {
    console.error("verifyCode error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Optional: serve all files in current dir (for simple static testing)
app.use("/static", express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log("Open / to see the frontend. Uploaded image served at /uploaded-image");
});
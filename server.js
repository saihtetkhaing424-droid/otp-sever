<!DOCTYPE html>
<html lang="my">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Telegram Login Demo</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f7fb; margin:0; padding:20px; display:flex; justify-content:center; }
    .card { width:100%; max-width:420px; background:#fff; border-radius:12px; padding:18px; box-shadow:0 6px 18px rgba(0,0,0,0.08); }
    h2 { margin-top:0; color:#0077b6; text-align:center; }
    label { display:block; margin-top:10px; font-size:14px; color:#333; }
    input { width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; margin-top:6px; font-size:15px; }
    button { width:100%; margin-top:14px; padding:12px; border-radius:8px; background:#0088cc; color:#fff; border:none; font-size:16px; }
    .muted { color:#666; font-size:13px; margin-top:6px; }
    img.uploaded { width:100%; border-radius:8px; margin-top:12px; object-fit:cover; }
    .row { display:flex; gap:8px; }
    .small { flex:1; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Telegram Login (Demo)</h2>

    <label>Phone number</label>
    <input id="phone" placeholder="+959xxxxxxxx" />

    <button id="sendBtn" onclick="sendCode()">Send Code</button>
    <p id="sendResult" class="muted"></p>

    <div id="codeArea" style="display:none;">
      <label>Phone code hash</label>
      <input id="phoneCodeHash" placeholder="phone_code_hash (auto-filled)" />
      <label>Enter code</label>
      <input id="code" placeholder="12345" />
      <div class="row">
        <button onclick="verifyCode()" class="small">Verify</button>
      </div>
      <p id="verifyResult" class="muted"></p>
    </div>

    <p class="muted">Uploaded image preview (from your uploaded file):</p>
    <!-- Developer requested we expose the uploaded path as a URL; server serves it at /uploaded-image -->
    <img class="uploaded" src="/uploaded-image" alt="uploaded image" onerror="this.style.display='none'">

    <p class="muted" style="margin-top:10px;">Note: This demo will run in <strong>mock mode</strong> unless you set MTProto env variables on the server (API_ID + API_HASH and MTPROTO_ENABLED=true).</p>
  </div>

<script>
  let lastPhoneHash = "";

  async function sendCode() {
    const phone = document.getElementById("phone").value.trim();
    if (!phone) return alert("Enter phone number");

    document.getElementById("sendBtn").disabled = true;
    document.getElementById("sendResult").innerText = "Sending code...";

    try {
      const res = await fetch("/sendCode", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.ok) {
        lastPhoneHash = data.phone_code_hash || "";
        document.getElementById("phoneCodeHash").value = lastPhoneHash;
        document.getElementById("sendResult").innerText = data.demo ? "Demo code sent (mock)." : "Code sent.";
        document.getElementById("codeArea").style.display = "block";
      } else {
        document.getElementById("sendResult").innerText = "Error: " + (data.error || "unknown");
      }
    } catch (e) {
      document.getElementById("sendResult").innerText = "Network error: " + e.message;
    } finally {
      document.getElementById("sendBtn").disabled = false;
    }
  }

  async function verifyCode() {
    const phone = document.getElementById("phone").value.trim();
    const code = document.getElementById("code").value.trim();
    const phone_code_hash = document.getElementById("phoneCodeHash").value.trim() || lastPhoneHash;
    if (!phone || !code || !phone_code_hash) return alert("phone, code and phone_code_hash are required");

    document.getElementById("verifyResult").innerText = "Verifying...";
    try {
      const res = await fetch("/verifyCode", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ phone, phone_code_hash, code })
      });
      const data = await res.json();
      if (data.ok) {
        document.getElementById("verifyResult").innerText = "Login success: " + (data.demo ? "demo user" : JSON.stringify(data.user));
      } else {
        document.getElementById("verifyResult").innerText = "Error: " + (data.error || "unknown");
      }
    } catch (e) {
      document.getElementById("verifyResult").innerText = "Network error: " + e.message;
    }
  }
</script>
</body>
</html>
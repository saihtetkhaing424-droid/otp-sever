const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("tdl");
const { TDLib } = require("tdl-tdlib-addon");

const app = express();
app.use(bodyParser.json());

const client = new Client(new TDLib(), {
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH
});

client.on("error", console.error);

client.on("update", (u) => {
  if (u["@type"] === "updateAuthorizationState") {
    console.log("Auth:", u.authorization_state["@type"]);
  }
});

app.post("/otp", async (req, res) => {
  const phone = req.body.phone;
  console.log("Contact shared:", phone);

  try {
    await client.login(() => ({
      phoneNumber: phone
    }));

    return res.json({ ok: true, msg: "OTP Request Triggered" });
  } catch (err) {
    console.log(err);
    return res.json({ ok: false, error: err.message });
  }
});

app.listen(3000, () => console.log("TDLib OTP Server Running"));
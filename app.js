require("dotenv").config();
const axios = require("axios");
const { AuthorizationCode } = require("simple-oauth2");

const express = require("express");
const app = express();

const config = {
  client: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  auth: {
    tokenHost: "https://ticktick.com",
    authorizePath: "/oauth/authorize",
    tokenPath: "/oauth/token",
  },
  options: {
    authorizationMethod: "body",
  },
  http: {
    json: "true",
  },
};

const redirect_uri = "http://localhost:3000/callback"; // Your callback URL

const client = new AuthorizationCode(config);

// Initial page redirecting to TickTick
app.get("/auth", (req, res) => {
  const authorizationUri = client.authorizeURL({
    redirect_uri,
    scope: "tasks:write tasks:read", // replace with the actual scope required
    state: "3(#0/!~",
  });

  res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
app.get("/callback", async (req, res) => {
  const { code } = req.query;
  const options = {
    code,
    redirect_uri,
    scope: "tasks:write tasks:read",
    grant_type: "authorization_code",
  };

  try {
    console.log("Before getToken");
    const accessToken = await client.getToken(options);
    console.log("After getToken", accessToken);

    // Now that we have the access token, we can make an API request
    const result = await axios({
      method: "get",
      url: "https://api.ticktick.com/open/v1/project", // Replace with the actual TickTick API endpoint
      headers: {
        Authorization: `Bearer ${accessToken.token.access_token}`,
      },
    });

    console.log(result.data);
    res.send("Check your console!");
  } catch (error) {
    console.error("Access Token Error", error.message);
    res.status(500).json("Authentication failed");
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Express server started on port 3000");
});

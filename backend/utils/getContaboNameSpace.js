const axios = require("axios");
const qs = require("qs");
require("dotenv").config();



// CONTABO_CLIENT_ID=INT-12349702
// CONTABO_CLIENT_SECRET=4Swd4rWiojL6ACXClXOlGRvb9Sy4OJwh
// CONTABO_USER_NAME=wfdshop@gmail.com
// CONTABO_PASSWORD=Jdu88R9JNF!77?


async function getAccessToken() {
  const data = qs.stringify({
    grant_type: "password",
    client_id: process.env.CONTABO_CLIENT_ID,
    client_secret: process.env.CONTABO_CLIENT_SECRET,
    username: process.env.CONTABO_USER_NAME,
    password: process.env.CONTABO_PASSWORD,
  });

  try {
    const response = await axios.post(
      "https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token",
      data,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error.response?.data || error.message);
    throw error;
  }
}

async function getNamespace() {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      "https://api.contabo.com/v1/object-storages",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-request-id": require("crypto").randomUUID(),
        },
      }
    );

    const storages = response.data.data;
    // console.log("Object Storages:", storages);

    // Assuming you want to retrieve the first storage's namespace
    if (storages.length > 0) {
      const namespace = storages[0].s3TenantId;
      console.log("Namespace:", namespace);
      return namespace;
    } else {
      console.log("No object storages found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching namespace:", error.response?.data || error.message);
    throw error;
  }
}

// // Execute the function
// getNamespace().catch((err) => console.error("Failed:", err.message));



module.exports={getNamespace}
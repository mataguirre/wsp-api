const { Client, LocalAuth } = require("whatsapp-web.js");
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = require("../libs/aws.credentials.js");
const qrcode = require("qrcode");

const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "us-east-1",
});

const s3 = new AWS.S3();

let clientInstance = null;
let contactList = [];

async function saveQRToS3(qrCode) {
  const qrImageBuffer = await qrcode.toBuffer(qrCode);
  const params = {
    Bucket: "wsp-api-bucket",
    Key: "qr-code.png",
    Body: qrImageBuffer,
    ContentType: "image/png",
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("QR code uploaded to S3:", data.Location);
  } catch (error) {
    console.error("Error uploading QR code to S3:", error);
  }
}

async function initializeClient() {
  clientInstance = new Client({
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  clientInstance.on("qr", async (qr) => {
    console.log("Please scan the following QR code\n");
    await saveQRToS3(qr);
  });

  clientInstance.on("authenticated", () => {
    console.log("succesfully authenticated\n");
  });

  clientInstance.on("auth_failure", (msg) => {
    console.error("authentication error", msg);
  });

  clientInstance.on("loading_screen", (porcentaje, mensaje) => {
    console.log(`\nloading session: ${porcentaje}%`);
  });

  clientInstance.on("ready", async () => {
    console.log("session is ready");
    console.log("\ngetting contact list");
    try {
      contactList = await clientInstance.getContacts();
    } catch (e) {
      console.log(`there was an error trying to fetch contacts: ${e}`);
    }
  });
}

async function initWspClient() {
  if (!clientInstance) {
    await initializeClient();
  }
  return await clientInstance.initialize();
}

async function sendWspMessage(to, message) {
  try {
    let contact = await getContactByName(to);

    if (!contact) {
      contact = await getContactByNumber(to);
    }

    if (!contact) {
      throw new Error(`contact cannot be found: "${to}"`);
    }

    console.log("\nsending message...\n");
    console.log(
      `${JSON.stringify({ contact: contact.id._serialized, message })}`
    );

    const response = await clientInstance.sendMessage(
      contact.id._serialized,
      message
    );

    if (!response) return;

    console.log("\nmessage was succesfully sent");

    return response;
  } catch (error) {
    const errorMessage = `error sending message to: "${to}"`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
}

function formatNumber(numero) {
  const numeroLimpio = numero.replace(/\D/g, "");

  if (numeroLimpio.startsWith("+")) {
    return numeroLimpio.substring(1);
  } else {
    return numeroLimpio;
  }
}

async function getContactByName(contactName) {
  return contactList.find((c) => {
    if (!c.name) return;

    return (
      c.name.toLowerCase().trim() == contactName.toLowerCase().trim() &&
      c.id._serialized.includes("@c.us")
    );
  });
}

async function getContactByNumber(contactNumber) {
  return contactList.find((c) => {
    if (!c.number) return;

    return (
      c.number == formatNumber(contactNumber) &&
      c.id._serialized.includes("@c.us")
    );
  });
}

module.exports = {
  initWspClient,
  sendWspMessage,
};

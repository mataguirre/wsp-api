const { Router } = require("express");
const { sendWspMessage, initWspClient } = require("../services/wspService");
const { s3UpdateFile, s3UploadFile } = require("../services/awsButtons.js");
const router = Router();

router.get("/", (req, res) => {
  res.send("app is working");
});

router.get("/init", async (req, res) => {
  try {
    await initWspClient();
    res.status(200).json("whatsApp client successfully initialized");
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: `There was an error: ${e}`,
    });
  }
});

router.post("/send", async (req, res) => {
  const { message, to } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      status: "error",
      message: "Invalid data",
    });
  }

  try {
    await sendWspMessage(to, message);
    res.status(200).json({
      status: "success",
      message: "Message sent successfully",
    });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: `There was an error: ${e}`,
    });
  }
});

router.get("/editar-botones", async (req, res) => {
  try {
    const editorUrl = await s3UpdateFile();
    res.send(`
      <p>Acceda a la siguiente URL para modificar su JSON:</p>
      <a href="${editorUrl}" target="_blank" class="text-decoration: none"><button>Editar JSON</button></a>
    `);
  } catch (error) {
    console.error("Error al obtener el archivo desde S3:", error);
    res.status(500).send("Error al obtener el archivo desde S3");
  }
});

router.post("/subir-botones", async (req, res) => {
  try {
    const uploadedFile = await s3UploadFile(req.body);
    res.status(200).json({
      status: "success",
      message: `Buttons successfully updated: ${uploadedFile}`,
    });
  } catch (e) {
    console.error("Error al obtener el archivo desde S3:", error);
    res.status(500).send("Error al obtener el archivo desde S3");
  }
});

module.exports = router;

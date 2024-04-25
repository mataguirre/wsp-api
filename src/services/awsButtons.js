const AWS = require("aws-sdk");
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = require("../libs/aws.credentials.js");

async function s3UpdateFile() {
  try {
    AWS.config.update({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: "us-east-1",
    });

    const s3 = new AWS.S3();

    const params = {
      Bucket: "wsp-api-bucket",
      Key: "buttons.json",
    };

    let data;

    data = await s3.getObject(params).promise();
    const bodyString = data.Body.toString("utf-8");
    const btnJSON = JSON.parse(bodyString);
    const jsonString = JSON.stringify(btnJSON);
    const encodedContent = encodeURIComponent(jsonString);

    return `https://jsoneditoronline.org/?json=${encodedContent}`;
  } catch (error) {
    console.error("Error al obtener los datos desde S3:", error);
    throw error;
  }
}

async function s3UploadFile(updatedJSON) {
  try {
    AWS.config.update({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: "us-east-1",
    });

    const s3 = new AWS.S3();

    const params = {
      Bucket: "wsp-api-bucket",
      Key: "buttons.json",
      Body: JSON.stringify(updatedJSON),
    };

    await s3.putObject(params).promise();
  } catch (error) {
    console.error("Error al subir el archivo a S3:", error);
    throw error;
  }
}

module.exports = {
  s3UpdateFile,
  s3UploadFile,
};

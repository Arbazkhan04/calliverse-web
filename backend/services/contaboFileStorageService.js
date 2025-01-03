const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getNamespace } = require("../utils/getContaboNameSpace");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const CustomError  = require("../utils/customError");

class ContaboService {
  constructor() {
    this.s3 = new S3Client({
      region: "eu",
      endpoint: "https://eu2.contabostorage.com",
      credentials: {
        accessKeyId: process.env.CONTABO_ACCESS_KEY,
        secretAccessKey: process.env.CONTABO_SECRET_KEY,
      },
      forcePathStyle: true,
    });
    this.bucketName = "calliverse";
  }

  /**
   * Upload a file to Contabo Object Storage
   */
  async uploadFile(fileBuffer, mimeType, folder, originalName) {
    try {
      const namespace = await getNamespace();
      const fileKey = `${folder}/${uuidv4()}${path.extname(originalName)}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3.send(command);

      return {
        fileUrl: `https://${namespace}:${this.bucketName}.contabostorage.com/${fileKey}`,
        fileName: originalName,
        fileSize: fileBuffer.length,
        fileType: mimeType.startsWith("image/")
          ? "image"
          : mimeType.startsWith("audio/")
          ? "audio"
          : mimeType.startsWith("video/")
          ? "video"
          : "document",
      };
    } catch (error) {
      throw new CustomError("Error uploading file to Contabo", 500, error);
    }
  }

  /**
   * Delete a file using its URL
   * @param {string} fileUrl - The full URL of the file to delete
   */
  async deleteFile(fileUrl) {
    try {
      // Extract the key from the URL
      const urlParts = new URL(fileUrl);
      const bucketAndKey = urlParts.pathname.split(":")[1]; // Extract "calliverse/..."
      const fileKey = bucketAndKey.substring(bucketAndKey.indexOf("/") + 1); // Extract "user-Profile-Images/..."

      console.log("file key", fileKey);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3.send(deleteCommand);

      console.log(`File deleted: ${fileKey}`);
    } catch (error) {
      throw new CustomError("Error deleting file from Contabo", 500, error);
    }
  }

  /**
   * List all files in a specific folder
   */
  async listFiles(folder) {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: folder.endsWith("/") ? folder : `${folder}/`,
      });

      const response = await this.s3.send(listCommand);

      return (
        response.Contents?.map((file) => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          url: `https://${this.bucketName}.contabostorage.com/${file.Key}`,
        })) || []
      );
    } catch (error) {
      throw new CustomError("Error listing files from Contabo", 500, error);
    }
  }
}

module.exports = new ContaboService();

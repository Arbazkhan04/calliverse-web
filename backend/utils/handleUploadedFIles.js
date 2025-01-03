// Utility function to handle file upload metadata
const handleUploadedFiles = (files) => {
  return files.map((file) => {
    let fileType;

    // Determine the file type based on mime type
    if (file.mimetype.startsWith("image/")) fileType = "image";
    else if (file.mimetype.startsWith("audio/")) fileType = "audio";
    else if (file.mimetype.startsWith("video/")) fileType = "video";
    else fileType = "document";

    // Return file metadata including URL, file type, size, etc.
    return {
      fileType: fileType,
      fileName: file.filename,
      fileUrl: `http://localhost:3003/uploads/${
        file.destination.split("uploads/")[1]
      }/${file.filename}`,
      fileSize: file.size,
      duration: file.mimetype.startsWith("audio/") ? file.duration : undefined,
    };
  });
};

// get file type of uploaded media(docuemnet,audio,video etc)
const getFileType = (file) => {
  console.log("get file type",file)
  let fileType;

  // Determine the file type based on mime type
  if (file.mimetype.startsWith("image/")) fileType = "image";
  else if (file.mimetype.startsWith("audio/")) fileType = "audio";
  else if (file.mimetype.startsWith("video/")) fileType = "video";
  else fileType = "document";

  return fileType;
};

module.exports = {
  handleUploadedFiles,
  getFileType 
};

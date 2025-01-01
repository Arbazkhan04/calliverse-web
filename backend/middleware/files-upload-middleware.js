const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getNamespace } = require('../utils/getContaboNameSpace');

// Configure S3 client (contabo)
const s3 = new S3Client({
  region: 'eu', // Default region
  endpoint: 'https://eu2.contabostorage.com', 
  credentials: {
    accessKeyId: process.env.CONTABO_ACCESS_KEY, 
    secretAccessKey: process.env.CONTABO_SECRET_KEY, 
  },
  forcePathStyle: true, // Ensure compatibility
});


// Multer memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'audio/mpeg', 'audio/wav',
    'video/mp4', 'video/webm', 'video/avi',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/zip',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.'));
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max file size 50MB
});

// const uploadToContabo = async (file, folder) => {
//   console.log(`Processing file: ${file.originalname}`); // Log file details

//   const fileKey = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
//   const command = new PutObjectCommand({
//     Bucket: 'calliverse',
//     Key: fileKey,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//   });

//   try {
//     const response = await s3.send(command);
//     console.log(`Uploaded ${file.originalname} successfully:`, response);
//     return {
//       fileUrl: `https://eu2.contabostorage.com/calliverse/${fileKey}`,
//       fileName: file.originalname,
//       fileSize: file.size,
//       fileType: file.mimetype.startsWith('image/') ? 'image' :
//                 file.mimetype.startsWith('audio/') ? 'audio' :
//                 file.mimetype.startsWith('video/') ? 'video' : 'document',
//     };
//   } catch (error) {
//     console.error(`Error uploading ${file.originalname}:`, error);
//     throw error;
//   }
// };


// Unified middleware to handle multiple fields



const uploadToContabo = async (file, folder) => {

  const nameSpace= await getNamespace()
  console.log(`Processing file: ${file.originalname}`); // Log file details

  const fileKey = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
  const command = new PutObjectCommand({
    Bucket: 'calliverse',
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    const response = await s3.send(command);
    console.log(`Uploaded ${file.originalname} successfully:`, response);

    return {
      fileUrl: `https://eu2.contabostorage.com/${nameSpace}:calliverse/${fileKey}`,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype.startsWith('image/') ? 'image' :
                file.mimetype.startsWith('audio/') ? 'audio' :
                file.mimetype.startsWith('video/') ? 'video' : 'document',
    };
  } catch (error) {
    console.error(`Error uploading ${file.originalname}:`, error);
    throw error;
  }
};





// const handleFileUpload = (fields, folder) => {
//     return async (req, res, next) => {
//       const uploadHandler = upload.fields(fields);
  
//       uploadHandler(req, res, async (err) => {
//         if (err) {
//           return res.status(400).json({ success: false, message: err.message });
//         }
  
//         try {
//           req.uploadedFiles = {};
  
//           // Process each field and upload to R2
//           for (const fieldName of Object.keys(req.files)) {
//             req.uploadedFiles[fieldName] = await Promise.all(
//               req.files[fieldName].map((file) => uploadToContabo(file, folder))
//             );
//           }
  
//           next();
//         } catch (error) {
//           next(error);
//         }
//       });
//     };
//   };
  


const handleFileUpload = (fields, folder) => {
  return async (req, res, next) => {
    const uploadHandler = upload.fields(fields);

    uploadHandler(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        req.uploadedFiles = {};

        for (const fieldName of Object.keys(req.files)) {
          req.uploadedFiles[fieldName] = await Promise.all(
            req.files[fieldName].map(async (file) => {
              try {
                const uploadedFile = await uploadToContabo(file, folder);

                console.log(uploadedFile.fileUrl)
                // Match the previous format
                return {
                  fieldname: file.fieldname,
                  originalname: file.originalname,
                  encoding: file.encoding,
                  mimetype: file.mimetype,
                  destination: path.join(folder, file.mimetype.startsWith('image/') ? 'images' : 'others'),
                  filename: path.basename(uploadedFile.fileUrl),
                  path: uploadedFile.fileUrl,
                  size: file.size,
                };
              } catch (err) {
                console.error(`Failed to upload file: ${file.originalname}`, err);
                throw err;
              }
            })
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

  

module.exports = {
  uploadToContabo,
  handleFileUpload
};

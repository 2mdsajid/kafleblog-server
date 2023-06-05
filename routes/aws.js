// const express = require('express')
// const router = express.Router()

// /* MULTER  */
// // Importing necessary libraries
// const multer = require('multer')
// const fse = require('fs-extra')
// const path = require('path');

// const AWS = require('aws-sdk');
// // const multer = require('multer');
// const multerS3 = require('multer-s3');

// /* AWS CONFIG */
// // AWS.config.update({
// //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
// //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// // });

// const s3 = new AWS.S3({
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });


// // Setting the directory where the files will be stored
// const DIR = './public/';


// // Function to configure the storage settings for Multer
// const setDirectory = () => {

//     console.log('multer begins')

//     const uploadDir = `${DIR}uploads/`
//     fse.ensureDir(uploadDir);

//     // Setting the destination and filename for the uploaded files
//     const storage = multer.diskStorage({
//         destination: (req, file, cb) => {
//             // Setting the directory to store the uploaded files
//             cb(null, DIR + 'uploads/');
//         },
//         filename: (req, file, cb) => {
//             // Setting the filename to the original filename of the uploaded file
//             cb(null, file.originalname)
//         }
//     });

//     // Configuring Multer with the storage settings and file filter
//     return multer({
//         storage: storage,
//         fileFilter: (req, file, cb) => {
//             // Checking if the uploaded file is a valid image, audio, or video file
//             if (
//                 ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.mimetype) ||
//                 ['audio/mpeg', 'audio/wav', 'audio/mp3'].includes(file.mimetype) ||
//                 ['video/mp4', 'video/mpeg', 'video/quicktime'].includes(file.mimetype)
//             ) {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Only .png, .jpg, .jpeg, .webp, .mp3, .wav, .mp4, and .mov formats allowed!'));
//             }
//         }
//     });
// }
// const upload = setDirectory()

// const fs = require('fs');



// router.post('/addfiles', upload.array('files', 15), async (req, res) => {
//   let fileUrls = [];
//   console.log("🚀 ~ file: aws.js:38 ~ router.post ~ fileUrls:", req.files);

//   try {
//     // Iterate over each uploaded file
//     for (const file of req.files) {
//       const uploadParams = {
//         Bucket: 'sajidtestbucket',
//         Key: file.originalname, // Use the original file name as the S3 object key
//         Body: fs.readFileSync(file.path), // Read file content synchronously and use it as the object data
//         ContentType: file.mimetype // Set the MIME type of the file
//       };

//       const uploadResult = await s3.upload(uploadParams).promise(); // Use async/await to upload each file

//       fileUrls.push(uploadResult.Location); // Store the S3 object URL in the fileUrls array
//     }
//     console.log("🚀 ~ file: aws.js:93 ~ router.post ~ fileUrls:", fileUrls)

//     // Return the uploaded file URLs
//     return res.status(201).json({
//       message: 'Files uploaded successfully',
//       status: 201,
//       fileUrls,
//       meaning: 'created'
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: 'Internal server error',
//       status: 500,
//       meaning: 'internalerror'
//     });
//   }
// });




// module.exports = router
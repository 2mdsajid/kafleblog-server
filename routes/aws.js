const express = require("express");
const router = express.Router();

/* MULTER  */
// Importing necessary libraries
const multer = require("multer");
const fse = require("fs-extra");
const path = require("path");

// const AWS = require("aws-sdk");
// const multer = require("multer");
// const multerS3 = require('multer-s3');

/* AWS CONFIG */
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });

// const s3 = new AWS.S3({
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });

// Setting the directory where the files will be stored
const DIR = "./public/";

// Function to configure the storage settings for Multer
const setDirectory = () => {
  console.log("multer begins");

  const uploadDir = `${DIR}uploads/`;
  fse.ensureDir(uploadDir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Setting the directory to store the uploaded files
      cb(null, DIR + "uploads/");
    },
    filename: (req, file, cb) => {
      // Setting the filename to the original filename of the uploaded file
      cb(null, file.originalname);
    },
  });

  // Configuring Multer with the storage settings and file filter
  return multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      // Checking if the uploaded file is a valid JSON file
      if (file.mimetype === "application/json" || file.originalname.endsWith(".json")) {
        cb(null, true);
      } else {
        cb(
          new Error("Only .json files are allowed!")
        );
      }
    },
  });
};

const upload = setDirectory();

const fs = require("fs");

router.get("/get", async (req, res) => {
  // Return the uploaded file URLs
  return res.status(201).json({
    message: "Files uploaded successfully",
    status: 201,
    meaning: "created",
  });
});



// const fs = require("fs"); // Import the fs module

router.post("/addfiles", upload.array("files", 15), async (req, res) => {
  let fileUrls = [];

  try {
    // Iterate over each uploaded file
    for (const file of req.files) {
      if (file.mimetype === "application/json" || file.originalname.endsWith(".json")) {
        // Read the content of the JSON file
        const jsonData = fs.readFileSync(file.path, "utf8");

        // Parse the JSON data
        const parsedData = JSON.parse(jsonData);
        console.log("🚀 ~ file: aws.js:93 ~ router.post ~ parsedData:", parsedData)

        // You can now work with the parsed JSON data (parsedData)

        fileUrls.push({
          filename: file.originalname,
          content: parsedData,
        });
      }
    }

    return res.status(201).json({
      message: "Files uploaded successfully",
      status: 201,
      fileUrls,
      meaning: "created",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
      status: 500,
      meaning: "internalerror",
    });
  }
});


module.exports = router;

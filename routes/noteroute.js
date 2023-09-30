const express = require("express");
const router = express.Router();
let app = express();
const mongoose = require("mongoose");

const dbConnection = require("../db/mongo");

const cloudinary = require("cloudinary").v2;
const Pusher = require("pusher");
var uaparser = require("ua-parser-js");
const jwt = require("jsonwebtoken");

const { data } = require("../public/uploads/data");
const { VerifyAdmin } = require("../middlewares/middlewares");

// const User = require('../schemas/UserSchems')
const Note = require("../schema/noteSchems");
const Subscribers = require("../schema/subscriberSchema");
const Feedback = require("../schema/feedbackSchema");
const newVisitor = require("../schema/newVisitorSchema");
const DailyVisit = require("../schema/dailyUsersSchema");
const Quote = require("../schema/quoteSchema");
const Admin = require("../schema/adminSchema");
const UnsubNotific = require("../schema/unsubscribeNotification");

// nodemailer cofnigurration
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

/* PUSHER--------- */
const pusher = new Pusher({
  appId: "1573280",
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "ap2",
  useTLS: true,
});

// CLOUDINARY Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* MULTER  */
// Importing necessary libraries
const multer = require("multer");
const fse = require("fs-extra");
const path = require("path");
const Subscriber = require("../schema/subscriberSchema");

// Define a route for saving the images, which accepts a file upload of up to 15 files using multer.
// router.post("/saveimages", upload.array("images", 15), async (req, res) => {
//   let imageurls = []; //to store the URLs
//   // const { captions, sources } = req.body

//   try {
//     // Move each uploaded file to the new directory and generate URLs for each file
//     const images = await Promise.all(
//       req.files.map(async (file, index) => {
//         // CLOUDINARY IMAGES UPLOAD-----------------------------
//         const result = await cloudinary.uploader.upload(file.path, {
//           folder: "notes",
//           transformation: [
//             { width: 800, height: 600, crop: "fill", aspect_ratio: "4:3" },
//           ],
//         });

//         const imgurl = result.secure_url;

//         // const imgurl = 'anurl';

//         // creating a name to put in the blog during entry -  to be parsed with image urls later on render
//         const img = `_root_i_${index + 1}`;

//         const image = {
//           image: imgurl || "",
//           caption: "",
//           source: "",
//         };

//         imageurls.push(image);
//         await fse.unlink(file.path);
//       })
//     );
//     if (imageurls.length === req.files.length) {
//       return res.status(201).json({
//         message: "Note addded successfully",
//         status: 201,
//         imageurls,
//         meaning: "created",
//       });
//     } else {
//       return res.status(501).json({
//         message: "images were not uploaded properly",
//         status: 501,
//         meaning: "internalerror",
//       });
//     }
//   } catch (error) {
//     res.status(501).json({
//       message: error.message,
//       status: 501,
//       meaning: "internalerror",
//     });
//   }
// });

/*  ADDING NOTES TO DATABASE */
router.post("/savenote",VerifyAdmin, async (req, res, next) => {
  try {
    // Get the request body parameters
    const {
      id,
      title,
      noteid,
      category,
      subcategory,
      intro,
      content,
      keywords,
      readtime,
      introimage,
    } = req.body;

    let newnote;

    if (id) {
      newnote = await Note.findById(id);
    }

    if (newnote) {
      // Update existing note
      console.log("old");
      newnote.title = title;
      newnote.noteid = noteid;
      newnote.category = category;
      newnote.subcategory = subcategory || "";
      newnote.intro = intro;
      newnote.review = false;
      newnote.published = true;
      newnote.content = content;
      newnote.keywords = keywords || "";
      newnote.readtime = readtime;
      newnote.introimage = introimage;
      newnote.isupdated.state = true;

      const saved = await newnote.save();
    } else {
      // Create new note
      console.log("new");
      newnote = new Note({
        title,
        noteid,
        category,
        subcategory: subcategory || "",
        intro,
        content,
        review: false,
        published: true,
        keywords: keywords || "",
        readtime,
        introimage,
      });
      await newnote.save();
    }

    // Handle success response

    console.log("newnote");
    return res.status(200).json({
      message: "Note saved successfully",
      status: 200,
      meaning: "ok",
      note: newnote,
    });
  } catch (error) {
    // Handle error response
    return res.status(500).json({
      message: "Error saving note",
      status: 500,
      meaning: "internalerror",
      error: error.message,
    });
  }
});

/*  ADDING NOTES TO DRAFT */
router.post("/savedraft",VerifyAdmin, async (req, res, next) => {
  // Get the request body parameters
  const {
    id,
    title,
    noteid,
    category,
    subcategory,
    intro,
    content,
    keywords,
    readtime,
    introimage,
  } = req.body;

  let newnote;

  try {
    if (id) {
      newnote = await Note.findById(id);
    }

    if (newnote) {
      // Update existing note
      console.log("old");
      newnote.title = title;
      newnote.noteid = noteid;
      newnote.category = category;
      newnote.subcategory = subcategory || "";
      newnote.intro = intro;
      newnote.review = true;
      newnote.published = false;
      newnote.content = content;
      newnote.keywords = keywords || "";
      newnote.readtime = readtime;
      newnote.introimage = introimage;
      newnote.isupdated.state = true;

      const saved = await newnote.save();
    } else {
      // Create new note
      console.log("new");
      newnote = new Note({
        title,
        noteid,
        category,
        subcategory: subcategory || "",
        intro,
        content,
        review: true,
        published: false,
        keywords: keywords || "",
        readtime,
        introimage,
      });

      await newnote.save();
    }

    return res.status(200).json({
      message: "Note drafted successfully",
      status: 200,
      meaning: "ok",
      note: newnote,
    });
  } catch (error) {
    console.log(error);
    res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internal server error",
    });
  }
});

// add replies
const { ObjectId } = require("mongodb");
router.post("/addreply",VerifyAdmin, async (req, res) => {
  try {
    let { noteid, commentid, name, email, reply } = req.body;

    // Checking for reply, it is compulsory
    if (!reply) {
      return res.status(400).json({
        message: "Reply is a required field",
        status: 400,
        meaning: "badrequest",
      });
    }

    const note = await Note.findOne({ _id: noteid });

    // Find the comment with the given commentId
    const commentId = new ObjectId(commentid);
    const comment = await note.comments.find(
      (comment) => comment._id.toString() === commentId.toString()
    );

    // If the comment is not found, return an error response
    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
        status: 404,
        meaning: "notfound",
      });
    }

    // Push the new reply into the replies array of the comment
    comment.replies.push({
      name: name || "reader",
      email: email || "",
      reply,
    });

    const savedNote = await note.save();

    const newUnsubNotific = await UnsubNotific.findOne({
      _id: "64a517b3eb022d8fb7dc65d7",
    });
    if (!newUnsubNotific.email.includes(email)) {
      // mail notification
      const mailOptions = {
        from: "livingasrb007@gmail.com",
        to: comment.email,
        subject: "Reply On Your Comment",
        html: `<div style="background-color:#F8FAFC;padding:20px">
            <div style="background-color:#FFFFFF;border-radius:16px;padding:20px;text-align:center">
              <img src="https://example.com/logo.png" alt="Friday Soup Logo" style="width: 128px">
              <h2 style="font-size:28px;font-weight:bold;margin:24px 0 16px">Website Comment Reply Notification</h2>
              <p style="font-size:16px;margin-bottom:32px">
                Hi ${comment.name},<br>
                You have received a reply on your comment on our website. Click the link below to view the comment and continue the conversation:
                <br><br>
                <a href="https://aayushmakafle.com.np/${note.noteid}" style="color:#0066CC;text-decoration:underline">View Comment Reply</a>
              </p>
              <p style="font-size:12px;color:#999999">
                To unsubscribe from this notification, click <a href="https://aayushmakafle.com.np/unsubscribe/mailnotification/${comment.email}" style="color:#999999;text-decoration:underline">here</a>.
              </p>
            </div>
          </div>
          `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
      } catch (error) {
        if (error.message.includes("Invalid recipient")) {
          console.log(`Wrong email address: ${email}`);
        } else {
          console.log(error);
        }
      }
    }

    if (savedNote) {
      res.status(201).json({
        message: "Reply added successfully",
        savedNote,
        status: 201,
        meaning: "created",
      });
    } else {
      res.status(400).json({
        message: "Unable to add the reply",
        status: 400,
        meaning: "badrequest",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// ADDING COMMENTS TO THE NOTE
router.post("/addcomment", async (req, res) => {
  try {
    let { id, name, email, comment } = req.body;

    // checking for comment , it is compulsory
    if (!comment) {
      return res.status(400).json({
        message: "Comment is a required field",
        status: 400,
        meaning: "badrequest",
      });
    }

    const note = await Note.findOne({ _id: id });
    note.comments.push({
      name: name || "reader",
      email: email || "",
      comment,
    });

    const savednote = await note.save();

    if (savednote) {
      res.status(201).json({
        message: "Comment addded successfully",
        savednote,
        status: 201,
        meaning: "created",
      });
    } else {
      res.status(400).json({
        message: "Unable to add the comment",
        status: 400,
        meaning: "badrequest",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// delete comment
// Server-side route for deleting a comment from a note
router.post("/deletecomment",VerifyAdmin, async (req, res) => {
  const { id, commentid } = req.body;
  try {
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
        status: 404,
        meaning: "notfound",
      });
    }

    // Find the index of the comment with matching _id in the note's comments array
    const commentIndex = note.comments.findIndex(
      (comment) => comment._id.toString() === commentid
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        message: "Comment not found",
        status: 404,
        meaning: "notfound",
      });
    }

    // Remove the comment from the note's comments array
    note.comments.splice(commentIndex, 1);

    // Save the updated note to the database
    await note.save();

    return res.status(200).json({
      message: "Vayo dilit. Refresh gara aba!",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// get a single note, useful for url based routes with noteid in url
router.post("/getanote", async (req, res) => {
  try {
    const { noteid } = req.body;
    const note = await Note.findOne({ noteid: noteid, review: false })
    .select('_id noteid title category author content introimage intro keywords readtime upvote comments date')
    if (!note) {
      return res.status(400).json({
        message: "Unable to fetch the note! check your credentials",
        status: 400,
        meaning: "badrequest",
      });
    }

    res.status(200).json({
      note,
      message: "note fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

router.get("/getnotebyid/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findOne({ _id: id });

    // if note is not there, return the whole process without any data
    if (!note) {
      return res.status(400).json({
        message: "Unable to fetch the note! Check your credentials",
        status: 400,
        meaning: "badrequest",
      });
    }

    res.status(200).json({
      note,
      message: "Note fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// get all note of the category
router.post("/getnotesbycategory", async (req, res) => {
  try {
    const { category } = req.body;
    const notes = await Note.find({ category: category, review: false }).select(
      "_id title noteid intro date readtime introimage"
    );

    if (!notes || notes.length === 0) {
      return res.status(400).json({
        message: "Unable to fetch the notes of this category",
        status: 400,
        meaning: "badrequest",
      });
    }

    res.status(200).json({
      notes,
      message: "Category notes fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// const User = mongoose.model('User', User);
router.get("/getrecentnotes", async (req, res) => {
  console.log('vbnm,')
  try {
    const allnotes = await Note.find({ review: false, published: true })
      .sort({ date: -1 }) // Sort by createdAt field in descending order
      .limit(6) // Return only the latest 6 notes
      .exec(); // Execute the query to get the notes

    const reversedNotes = allnotes.reverse();
    if (!allnotes) {
      return res.status(400).json({
        message: "Unable to fetch the notes",
        status: 400,
        meaning: "badrequest",
      });
    }

    return res.status(200).json({
      allnotes: reversedNotes,
      message: "note fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// const User = mongoose.model('User', User);
router.get("/getpublishednotes", async (req, res) => {
  console.log("back get all notes");
  try {
    const allnotes = await Note.find({ review: false });
    if (!allnotes) {
      return res.status(400).json({
        message: "Unable to fetch the notes",
        status: 400,
        meaning: "badrequest",
      });
    }

    return res.status(200).json({
      allnotes,
      message: "note fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// get all notes --- published, not published, drafted
router.get("/getallnotes", async (req, res) => {
  try {
    const allnotes = await Note.find({ review: false, published: true });
    if (!allnotes) {
      return res.status(400).json({
        message: "Unable to fetch the notes",
        status: 400,
        meaning: "badrequest",
      });
    }

    return res.status(200).json({
      allnotes,
      message: "note fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// to get all the notes in the draft
router.get("/findallnotes",VerifyAdmin, async (req, res) => {
  try {
    const allnotes = await Note.find();

    if (!allnotes) {
      return res.status(400).json({
        message: "Unable to fetch the draft notes",
        status: 400,
        meaning: "badrequest",
      });
    }

    const transformedNotes = allnotes.map((note) => ({
      _id: note._id,
      title: note.title,
      commentslength: note.comments.length,
      views: note.views,
      upvotes: note.upvote.length,
      isupdated: note.isupdated,
      intro: note.intro,
      noteid: note.noteid,
      date: note.date,
      review: note.review,
      published: note.published,
    }));

    return res.status(200).json({
      allnotes: transformedNotes,
      message: "Draft notes fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// to get all the notes in the draft
router.get("/getreviewnotes",VerifyAdmin, async (req, res) => {
  try {
    const reviewnotes = await Note.find({ review: true });
    if (!reviewnotes) {
      return res.status(400).json({
        message: "Unable to fetch the review notes",
        status: 400,
        meaning: "badrequest",
      });
    }

    return res.status(200).json({
      reviewnotes,
      message: "review note fetched successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// delete a  note
router.post("/deletenote",VerifyAdmin, async (req, res) => {
  const { id } = req.body;
  try {
    const noteToDelete = await Note.findById(id);
    // return res.status(200).json({
    //     message: 'Note deleted successfully',
    //     note: noteToDelete,
    //     status: 200,
    //     meaning: 'ok'
    // });

    if (!noteToDelete) {
      return res.status(404).json({
        message: "Note not found",
        status: 404,
        meaning: "notfound",
      });
    }

    await Note.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Note deleted successfully",
      status: 200,
      meaning: "ok",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// publishing the note from the draft
router.post("/changereview",VerifyAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const note = await Note.findOne({ _id: id });

    if (!note) {
      return res.status(400).json({
        message: "Can't find a note",
        status: 400,
        meaning: "badrequest",
      });
    }

    note.review = true; //dont use AWAIT while updating any state in database
    const savednote = await note.save();

    res.status(201).json({
      message: "Note Approved successfully",
      savednote,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// ADD subscribers
router.post("/addsubscribe", async (req, res) => {
  try {
    const { name, email } = req.body;
    const subscriber = await Subscribers.findOne({ email });

    if (subscriber) {
      return res.status(401).json({
        message: "Already subscribed",
        status: 401,
        meaning: "badrequest",
      });
    }

    const newsubscriber = new Subscriber({
      email,
      name: name || "",
    });
    await newsubscriber.save();

    const mailOptions = {
      from: "livingasrb007@gmail.com",
      to: email,
      subject: "Friday Soup Subscriber",
      html: `<div style="background-color:#F8FAFC;padding:32px">
            <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;text-align:center">
              <img src="https://example.com/logo.png" alt="Friday Soup Logo" style="width: 128px">
              <h2 style="font-size:28px;font-weight:bold;margin:24px 0 16px">Welcome to Friday Soup!</h2>
              <p style="font-size:16px;margin-bottom:32px">
                Hi ${name},<br>
                Thank you for subscribing to our weekly newsletter, Friday Soup. Our newsletter provides updates on AI advancements in medicine, industry trends, and other relevant topics. Stay informed and up-to-date on the latest developments in this exciting field by reading Friday Soup every week.
              </p>
           
            </div>
          </div>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}`);
    } catch (error) {
      if (error.message.includes("Invalid recipient")) {
        console.log(`Wrong email address: ${email}`);
      } else {
        console.log(error);
      }
    }

    res.status(201).json({
      message: "subscribed successfully",
      newsubscriber,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

/* DISCARDED FOR NOW */
router.post("/addvote", async (req, res) => {
  // console.log(req.body.id)

  try {
    const { id, uniqueid } = req.body;

    // console.log(vote)

    const note = await Note.findOne({ _id: id });

    if (note) {
      if (note.upvote.includes(uniqueid)) {
        note.upvote.pull(uniqueid);
      } else {
        note.upvote.push(uniqueid);
      }
    }

    await note.save();

    return res.status(201).json({
      message: "voted successfully",
      note,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// add comments liks
router.post("/addcommentvote", async (req, res) => {
  try {
    const { commentid, noteid, uniqueid } = req.body;

    const note = await Note.findOne({ _id: noteid });

    if (note) {
      const commentId = new ObjectId(commentid);
      const comment = await note.comments.find(
        (comment) => comment._id.toString() === commentId.toString()
      );

      if (comment) {
        const { likes } = comment;
        if (likes.includes(uniqueid)) {
          comment.likes = likes.filter((id) => id !== uniqueid);
        } else {
          comment.likes.push(uniqueid);
        }
      }
    }

    await note.save();

    return res.status(201).json({
      message: "Vote added successfully",
      comments: note.comments,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// add feedback and mail it to the owner
router.post("/addfeedback", async (req, res) => {
  try {
    const { name, email, feedback } = req.body;

    const newfeedback = new Feedback({
      email,
      name: name || "",
      feedback,
    });

    await newfeedback.save();

    const mailOptions = {
      from: "livingasrb007@gmail.com",
      to: "aayushmakafle019@gmail.com",
      subject: "Website Feedback From a Visitor",
      html: `<div style="background-color:#F8FAFC;padding:32px">
            <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;text-align:center">
              <h2 style="font-size:28px;font-weight:bold;margin:0 0 16px">Feedback</h2>
              <p style="font-size:16px;margin-bottom:16px">Name: ${name}</p>
              <p style="font-size:16px;margin-bottom:16px">Email: ${email}</p>
              <p style="font-size:16px;margin-bottom:32px">Feedback: ${feedback}</p>
            </div>
          </div>
          `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}`);
    } catch (error) {
      if (error.message.includes("Invalid recipient")) {
        console.log(`Wrong email address: ${email}`);
      } else {
        console.log(error);
      }
    }

    res.status(201).json({
      message: "feedback received ",
      newfeedback,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// add visitors
router.post("/addvisitor", async (req, res) => {
  try {
    const { uniqueid, ip, useragent } = req.body;

    const currentDate = new Date(); // Reset time to midnight
    const isoDate = new Date(currentDate).toISOString();
    const yearMonthDay = isoDate.slice(0, 10); // Extract the first 10 characters (YYYY-MM-DD)
    let newvisit = await DailyVisit.findOne({ date: yearMonthDay });
    if (newvisit) {
      newvisit.count++;
    } else {
      newvisit = new DailyVisit({ date: yearMonthDay, count: 1 });
    }
    await newvisit.save();

    let newvisitor;
    newvisitor = await newVisitor.findOne({ uniqueid: uniqueid });
    if (newvisitor) {
      if (!newvisitor.ip || !newvisitor.useragent) {
        newvisitor.ip = ip;
        newvisitor.useragent = useragent;
        await newvisitor.save();
      }
      return res.status(400).json({
        message: "Already visited byt his user",
      });
    }
    newvisitor = new newVisitor({
      uniqueid,
      useragent,
      ip,
    });

    await newvisitor.save();
    res.status(201).json({
      message: "visitor added ",
      newvisitor,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// async function fetchLocationInfo(ip) {
//   const response = await fetch(
//     `https://ipinfo.io/${ip}/json?token=80ea4f6c43a232`
//   );
//   if (response.ok) {
//     return await response.json();
//   }
//   const dat = await response.json();
//   return null; // Return null in case of an error
// }

// get chunk data for users
router.get("/gettablevisitors",VerifyAdmin, async (req, res) => {
  try {
    let limit = req.query.limit || 0;
    const defaultLimit = 50;

    // let visitors;
    let chunkSize;
    const visitors = await newVisitor
      .find()
      .sort({ timestamp: "desc" })
      .select("-_id useragent ip timestamp")
      .limit(defaultLimit + limit * defaultLimit);

    const transformedArray = await Promise.all(
      visitors.map(async (item) => {
        const timestamp = new Date(item.timestamp);
        const month = new Intl.DateTimeFormat("en-US", {
          month: "long",
        }).format(timestamp);
        const day = timestamp.getDate().toString();

        const parsed_agent = uaparser(item.useragent);
        const agent = {
          referrel: parsed_agent.browser.name,
          os: parsed_agent.os.name,
          device: parsed_agent.device.model,
        };

        return {
          useragent: agent,
          ip: item.ip,
          timestamp: item.timestamp,
          month,
          day,
        };
      })
    );

    return res.status(201).json({
      message: "visitor added ",
      visitors: transformedArray,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// get chunk data for users
router.get("/getchunkvisitors", async (req, res) => {
  try {
    const currentDate = new Date().setHours(0, 0, 0, 0); // Reset time to midnight

    const visitors = await newVisitor.find().sort({ timestamp: 1 });

    // Map and count users by date
    const newusercountbydate = visitors.reduce((countByDate, visitor) => {
      const date = visitor.timestamp.toISOString().split("T")[0]; // Convert to ISO 8601 format and extract the date part
      countByDate[date] = (countByDate[date] || 0) + 1; // Increment count for the date
      return countByDate;
    }, {});

    // Calculate cumulative counts
    const cumulativecounts = Object.entries(newusercountbydate).reduce(
      (cumulative, [date, count]) => {
        const previousCount =
          cumulative.length > 0 ? cumulative[cumulative.length - 1] : 0;
        const cumulativeCount = previousCount + count;
        cumulative.push(cumulativeCount);
        return cumulative;
      },
      []
    );

    // Calculate cumulative counts with index as key
    const cumulativeCounts = cumulativecounts.reduce((result, count, index) => {
      result[index] = count;
      return result;
    }, {});

    const dailyvisitor = await DailyVisit.find({}).sort({ date: 1 });
    const dailyvisitordata = dailyvisitor.reduce((data, { date, count }) => {
      data[date] = count;
      return data;
    }, {});

    return res.status(201).json({
      message: "visitor added ",
      newusercountbydate,
      cumulativeCounts,
      dailyvisitordata,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// get visitors
router.get("/getvisitors",VerifyAdmin, async (req, res) => {
  try {
    const currentDate = new Date().toISOString(); // Extract the first 10 characters (YYYY-MM-DD)
    const slicedDate = currentDate.slice(0, 10);

    const visitors = await newVisitor.find().select("-_id timestamp ip");

    const groupedData = {};
    visitors.forEach((item) => {
      const date = item.timestamp.toISOString().split("T")[0];
      if (!groupedData[date]) {
        groupedData[date] = 1;
      } else {
        groupedData[date]++;
      }
    });

    // Convert the grouped data into an array of objects
    const dailynewvisitorscount = Object.entries(groupedData).map(
      ([date, count]) => ({
        date,
        count,
      })
    );
    // Calculate cumulative counts
    let count = 0;
    const cumulativenewvisitors = dailynewvisitorscount.map((dailyItem) => {
      count += dailyItem.count;
      return {
        date: dailyItem.date,
        count,
      };
    });
    // today new visits
    const dailynewisitors = visitors.filter((visitor) => {
      const visitorDate = new Date(visitor.timestamp).toISOString();
      return visitorDate.slice(0, 10) === slicedDate;
    });
    const totalvisitors = visitors.length;

    // today all visits
    const yearMonthDay = slicedDate; // Extract the first 10 characters (YYYY-MM-DD)
    let dailyvisitor = await DailyVisit.findOne({ date: yearMonthDay });
    const alldailyvisitors = await DailyVisit.find().select("-_id date count");
    alldailyvisitors.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate cumulative count for each date
    let cumulativeCount = 0;
    const cumulativedailyvisitors = alldailyvisitors.map((item) => {
      cumulativeCount += item.count;
      return {
        date: item.date,
        count: cumulativeCount,
      };
    });

    //notes
    const notes = await Note.find();
    const viewssum = notes
      .map((note) => note.views)
      .reduce((acc, curr) => acc + curr, 0);
    const highestViewNote = notes.reduce((prevNote, currNote) => {
      if (currNote.views > prevNote.views) {
        return currNote;
      }
      return prevNote;
    });
    const { title, noteid, views } = highestViewNote;
    const highestviewnote = { title, noteid, views };

    return res.status(201).json({
      message: "visitor added ",
      viewssum,
      totalvisitors,
      dailyvisitor,
      highestviewnote,
      cumulativedailyvisitors,
      cumulativenewvisitors,
      dailynewvisitorscount,
      alldailyvisitors,
      dailynewisitors: dailynewisitors.length, //remove the length to get the array
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});


// adminlogin
router.post("/adminlogin", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find admin with matching username and password
    const admin = await Admin.findOne({ username, password });
    if (!admin) {
      res.status(401).json({
        message: "Admin login unsuccessful",
      });
    }
    const user = {
      username: username,
      password: password,
    };

    const secretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(user, secretKey);
    res.status(200).json({
      token: token,
      message: "Admin login successful",
    })

  } catch (error) {
    res.status(500).json({ message: "Error occurred while finding admin" });
  }
});

// add views
/* DISCARDED FOR NOW */
router.post("/addviews", async (req, res) => {
  console.log(req.body.id);

  try {
    const { id } = req.body;

    // console.log(vote)

    const note = await Note.findOne({ _id: id });
    if (!note) {
      return null;
    }

    note.views = note.views + 1;

    await note.save();

    return res.status(201).json({
      message: "voted successfully",
      note,
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

// add daily user visits

// unsubs mails
router.post("/addunsubnotificemail", async (req, res) => {
  try {
    const { email } = req.body;

    const newUnsubNotific = await UnsubNotific.findOne({
      _id: "64a517b3eb022d8fb7dc65d7",
    });

    if (!newUnsubNotific.email.includes(email)) {
      newUnsubNotific.email.push(email);
      await newUnsubNotific.save();

      return res.status(201).json({
        message: "Email added successfully",
        unsubs: newUnsubNotific.email,
      });
    }

    return res.status(201).json({ message: "Email already unsubscribed" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add email",
      error: error.message,
    });
  }
});

module.exports = router;

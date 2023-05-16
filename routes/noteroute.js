const express = require('express')
let app = express()
const router = express.Router()
const mongoose = require('mongoose');


const dbConnection = require('../db/mongo');

const cloudinary = require('cloudinary').v2;
const Pusher = require("pusher");

// const User = require('../schemas/UserSchems')
const Note = require('../schema/noteSchems')
const Subscribers = require('../schema/subscriberSchema')
const Feedback = require('../schema/feedbackSchema')
const Visitor = require('../schema/visitorSchema')

// nodemailer cofnigurration
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'livingasrb007@gmail.com',
        pass: 'iddtzfwzeecehxrl'
    }
});



/* PUSHER--------- */
const pusher = new Pusher({
    appId: "1573280",
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: "ap2",
    useTLS: true
});

// CLOUDINARY Configuration 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


/* MULTER  */
// Importing necessary libraries
const multer = require('multer')
const fse = require('fs-extra')
const path = require('path');
const Subscriber = require('../schema/subscriberSchema');

// Setting the directory where the files will be stored
const DIR = './public/';


// Function to configure the storage settings for Multer
const setDirectory = () => {

    console.log('multer begins')

    const uploadDir = `${DIR}uploads/`
    fse.ensureDir(uploadDir);

    // Setting the destination and filename for the uploaded files
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // Setting the directory to store the uploaded files
            cb(null, DIR + 'uploads/');
        },
        filename: (req, file, cb) => {
            // Setting the filename to the original filename of the uploaded file
            cb(null, file.originalname)
        }
    });

    // Configuring Multer with the storage settings and file filter
    return multer({
        storage: storage,
        fileFilter: (req, file, cb) => {
            // Checking if the uploaded file is a valid image file
            // console.log('dest begins')
            if (['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
            }
        }
    });
}
const upload = setDirectory()


// Define a route for saving the images, which accepts a file upload of up to 15 files using multer.
router.post('/saveimages', upload.array('images', 15), async (req, res) => {

    let imageurls = [] //to store the URLs
    // const { captions, sources } = req.body

    try {

        // Move each uploaded file to the new directory and generate URLs for each file
        const images = await Promise.all(req.files.map(async (file, index) => {

            // CLOUDINARY IMAGES UPLOAD-----------------------------
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'notes',
                transformation: [
                    { width: 800, height: 600, crop: 'fill', aspect_ratio: '4:3' }
                ]
            });

            const imgurl = result.secure_url;

            // const imgurl = 'anurl';

            // creating a name to put in the blog during entry -  to be parsed with image urls later on render
            const img = `_root_i_${index + 1}`



            const image = {
                url: imgurl || '',
                // caption: captions[index] || '',
                // source: sources[index] || '',
                img
            }

            imageurls.push(image)
            await fse.unlink(file.path);
        }
        ));
        if (imageurls.length === req.files.length) {
            return res.status(201).json({
                message: 'Note addded successfully',
                status: 201,
                imageurls,
                meaning: 'created'
            });
        } else {
            return res.status(501).json({
                message: 'images were not uploaded properly',
                status: 501,
                meaning: 'internalerror'
            })
        }


    } catch (error) {
        res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

/*  ADDING NOTES TO DATABASE */
router.post('/savenote', async (req, res, next) => {

    // Get the request body parameters
    const {
        title,
        noteid,
        category,
        subcategory,
        intro,
        content,
        keywords,
        readtime,
        images,
    } = req.body


    try {
        // saving the data into mongo database
        const newnote = new Note({
            title,
            noteid,
            category,
            subcategory: subcategory || '',
            intro,
            content,
            keywords: keywords.split(',') || '',
            readtime,
            images,
        })

        // return res.json({newnote})

        const savednote = await newnote.save()
        // checking for error while uploading
        if (savednote) {
            // const user = await User.findOne({ _id: userid })

            // if (user) {
            //     const savenote = await user.addNote(title, savenewnote._id, intro)
            //     const savethenote = await user.save()
            // }

            res.status(201).json({
                message: 'Note addded successfully',
                status: 201,
                savednote,
                meaning: 'created'
            })

        } else {
            res.status(400).json({
                message: 'Unable to add the note ',
                status: 400,
                meaning: 'badrequest'
            })
        }
    } catch (error) {
        console.log(error)
        res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internal server error'
        })
    }
})

// ADDING COMMENTS TO THE NOTE
router.post('/addcomment', async (req, res) => {
    try {
        let {
            id,
            name,
            email,
            comment
        } = req.body

        // checking for comment , it is compulsory
        if (!comment) {
            return res.status(400).json({
                message: 'Comment is a required field',
                status: 400,
                meaning: 'badrequest'
            })
        }

        const note = await Note.findOne({ _id: id })
        note.comments.push({
            name: name || 'reader',
            email: email || '',
            comment
        })

        const savednote = await note.save()

        if (savednote) {
            res.status(201).json({
                message: 'Comment addded successfully',
                savednote,
                status: 201,
                meaning: 'created'
            })
        } else {
            res.status(400).json({
                message: 'Unable to add the comment',
                status: 400,
                meaning: 'badrequest'
            })

        }
    } catch (error) {
        res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

// get a single note, useful for url based routes with noteid in url
router.post('/getanote', async (req, res) => {

    try {
        const { noteid } = req.body
        const note = await Note.findOne({ noteid: noteid, review: false })
        // if note is not there, return the whole process without any data
        if (!note) {
            return res.status(400).json({
                message: 'Unable to fetch the note! check your credentials',
                status: 400,
                meaning: 'badrequest'
            })
        }

        res.status(200).json({
            note,
            message: 'note fetched successfully',
            status: 200,
            meaning: 'ok'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })

    }

})

// get all note of the category
router.post('/getnotesbycategory', async (req, res) => {

    try {
        const { category } = req.body
        const notes = await Note.find({ category: category, review: false })

        if (!notes) {
            return res.status(400).json({
                message: 'Unable to fetch the notes of this category',
                status: 400,
                meaning: 'badrequest'
            })
        }

        res.status(200).json({
            notes,
            message: 'category notes fetched successfully',
            status: 200,
            meaning: 'ok'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })

    }

})

// const User = mongoose.model('User', User);
router.get('/getrecentnotes', async (req, res) => {
    try {
        const allnotes = await Note.find({ review: false })
            .sort({ date: -1 }) // Sort by createdAt field in descending order
            .limit(6) // Return only the latest 6 notes
            .exec(); // Execute the query to get the notes

        const reversedNotes = allnotes.reverse();

        if (!allnotes) {
            return res.status(400).json({
                message: 'Unable to fetch the notes',
                status: 400,
                meaning: 'badrequest'
            })
        }

        return res.status(200).json({
            allnotes: reversedNotes,
            message: 'note fetched successfully',
            status: 200,
            meaning: 'ok'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

// const User = mongoose.model('User', User);
router.get('/getpublishednotes', async (req, res) => {
    console.log('back get all notes')
    try {
        const allnotes = await Note.find({ review: false })
        if (!allnotes) {
            return res.status(400).json({
                message: 'Unable to fetch the notes',
                status: 400,
                meaning: 'badrequest'
            })
        }

        return res.status(200).json({
            allnotes,
            message: 'note fetched successfully',
            status: 200,
            meaning: 'ok'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

// get all notes --- published, not published, drafted
router.get('/getallnotes', async (req, res) => {
    console.log('back get all notes')
    try {
        const allnotes = await Note.find()
        if (!allnotes) {
            return res.status(400).json({
                message: 'Unable to fetch the notes',
                status: 400,
                meaning: 'badrequest'
            })
        }

        return res.status(200).json({
            allnotes,
            message: 'note fetched successfully',
            status: 200,
            meaning: 'ok'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

// to get all the notes in the draft
router.get('/getreviewnotes', async (req, res) => {
    try {
        const reviewnotes = await Note.find({ review: true })
        if (!reviewnotes) {
            return res.status(400).json({
                message: 'Unable to fetch the review notes',
                status: 400,
                meaning: 'badrequest'
            })
        }

        return res.status(200).json({
            reviewnotes,
            message: 'review note fetched successfully',
            status: 200,
            meaning: 'ok'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

// delete a  note
router.post('/deletenote', async (req, res) => {
    const { id } = req.body;
    console.log("🚀 ~ file: noteroute.js:438 ~ router.delete ~ noteid:", id)

    try {
        const noteToDelete = await Note.findById(id);
        console.log("🚀 ~ file: noteroute.js:471 ~ router.post ~ noteToDelete:", noteToDelete)

        return res.status(200).json({
            message: 'Note deleted successfully',
            note: noteToDelete,
            status: 200,
            meaning: 'ok'
        });

        if (!noteToDelete) {
            return res.status(404).json({
                message: 'Note not found',
                status: 404,
                meaning: 'notfound'
            });
        }
        //    noteToDelete.review = true;
        //    await noteToDelete.save()
        await Note.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Note deleted successfully',
            status: 200,
            meaning: 'ok'
        });

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        });
    }
});


// publishing the note from the draft
router.post('/changereview', async (req, res) => {
    try {
        const { id } = req.body
        const note = await Note.findOne({ _id: id })

        if (!note) {
            return res.status(400).json({
                message: 'Can\'t find a note',
                status: 400,
                meaning: 'badrequest'
            })
        }

        note.review = true //dont use AWAIT while updating any state in database
        const savednote = await note.save()

        res.status(201).json({
            message: 'Note Approved successfully',
            savednote,
            status: 201,
            meaning: 'created'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

// ADD subscribers
// publishing the note from the draft
router.post('/addsubscribe', async (req, res) => {
    try {
        const { name, email } = req.body
        const subscriber = await Subscribers.findOne({ email })

        if (subscriber) {
            return res.status(401).json({
                message: 'Already subscribed',
                status: 401,
                meaning: 'badrequest'
            })
        }

        const newsubscriber = new Subscriber({
            email,
            name: name || ''
        })
        await newsubscriber.save()

        const mailOptions = {
            from: 'livingasrb007@gmail.com',
            to: email,
            subject: 'Friday Soup Subscriber',
            html: `<div style="background-color:#F8FAFC;padding:32px">
            <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;text-align:center">
              <img src="https://example.com/logo.png" alt="Friday Soup Logo" style="width: 128px">
              <h2 style="font-size:28px;font-weight:bold;margin:24px 0 16px">Welcome to Friday Soup!</h2>
              <p style="font-size:16px;margin-bottom:32px">
                Hi ${name},<br>
                Thank you for subscribing to our weekly newsletter, Friday Soup. Our newsletter provides updates on AI advancements in medicine, industry trends, and other relevant topics. Stay informed and up-to-date on the latest developments in this exciting field by reading Friday Soup every week.
              </p>
              <a href="${process.env.BASE_URL}/unsubscribe/${email}"
                 style="display:inline-block;background-color:#6C63FF;color:#FFFFFF;font-weight:bold;font-size:16px;padding:16px 32px;border-radius:8px;text-decoration:none;cursor:pointer">
                Unsubscribe
              </a>
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
            message: 'subscribed successfully',
            newsubscriber,
            status: 201,
            meaning: 'created'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})



/* DISCARDED FOR NOW */
router.post('/addvote', async (req, res) => {
    // console.log(req.body.id)

    try {
        const { id, uniqueid } = req.body

        // console.log(vote)

        const note = await Note.findOne({ _id: id })

        if (note) {
            if (note.upvote.includes(uniqueid)) {
                note.upvote.pull(uniqueid)
            } else {
                note.upvote.push(uniqueid)
            }
        }

        await note.save()

        return res.status(201).json({
            message: 'voted successfully',
            note,
            status: 201,
            meaning: 'created'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})


// add feedback and mail it to the owner
router.post('/addfeedback', async (req, res) => {
    try {
        const { name, email, feedback } = req.body

        const newfeedback = new Feedback({
            email,
            name: name || '',
            feedback
        })

        await newfeedback.save()

        const mailOptions = {
            from: 'livingasrb007@gmail.com',
            to: 'aayushmakafle019@gmail.com',
            subject: 'Website Feedback From a Visitor',
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
            message: 'feedback received ',
            newfeedback,
            status: 201,
            meaning: 'created'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

// add visitors
router.post('/addvisitor', async (req, res) => {
    try {
        const { uniqueid } = req.body

        let newvisitor

        newvisitor = await Visitor.findOne({ uniqueid: uniqueid })
        console.log("🚀 ~ file: noteroute.js:637 ~ router.post ~ newvisitor:", newvisitor)

        if (newvisitor) {
            return res.status(400).json({
                message: 'aleady visited'
            })
        }

        newvisitor = new Visitor({
            uniqueid
        })

        await newvisitor.save()
        console.log("🚀 ~ file: noteroute.js:649 ~ router.post ~ newvisitor:", newvisitor)
        res.status(201).json({
            message: 'visitor added ',
            newvisitor,
            status: 201,
            meaning: 'created'
        })

    } catch (error) {
        return res.status(501).json({
            message: error.message,
            status: 501,
            meaning: 'internalerror'
        })
    }
})

module.exports = router

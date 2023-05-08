const mongoose = require("mongoose")

const note = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    noteid: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    subcategory: {
        type: String,
        default:'',
    },
    author: {
        type: String,
        default: 'Aayushma'
    },
    intro: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    review: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: false
    },
    keywords: {
        type: [String],
        default: []
    },
    readtime: {
        type: String,
        default: ''
    },
    upvote: {
        type: [String],
        default: []
    },
    downvote: {
        type: [String],
        default: []
    },
    images: [
        {
            image: {
                type: String,
                required:true
            },
            caption: {
                type: String,
                default: ''
            },
            source: {
                type: String,
                default: ''
            }
        }
    ],
    comments: [
        {
            name: {
                type: String,
                default: ''
            },
            email: {
                type: String,
                default: ''
            },
            comment: {
                type: String,
                default: ''
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    }
});


const Note = mongoose.model('NOTE', note)
module.exports = Note
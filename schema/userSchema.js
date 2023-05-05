const mongoose = require("mongoose")
const jwt = require('jsonwebtoken')

const user = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    profession: {
        type: String,
        required: true
    },
    institution: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilepic: {
        type: String,
        required: true
    },
    uniqueid: {
        type: String,
        default:''
    },
    authorbio: {
        type: String,
        default: ''
    },
    admin: {
        type: String,
        default:false
    },
    date: {
        type: Date,
        default: Date.now
    },
    
    notes: [
        {
            title: {
                type: String,
                required: true
            },
            noteid: {
                type: String,
                required: true
            },
            intro: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
})


const User = mongoose.model('USER', user)

module.exports = User
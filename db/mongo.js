// const { ViewModuleSharp } = require("@material-ui/icons");
const mongoose = require("mongoose")

// DeprecationWarning:
mongoose.set('strictQuery', true)

const DB = `mongodb+srv://2mdsajid:${process.env.MONGOPASS}@cluster0.c1pm0ml.mongodb.net/blog2?retryWrites=true&w=majority`

mongoose.connect(DB).then(()=>{
    console.log('connected successfully to blog2 database');
}).catch((err)=>{console.log('error while connecting to blog2 database')})

module.exports = mongoose.connection;


// mongoimport --uri mongodb+srv://2mdsajid:UDkWosAVB0rbfpzh@cluster0.qzob3kp.mongodb.net/med-loc-1 --collection chemistries --type json --file "C:\Users\sajid aalam\Downloads\chem.json" --jsonArray

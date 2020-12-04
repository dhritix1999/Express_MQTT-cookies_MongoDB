const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });


const locationSchema = new mongoose.Schema({
    email: {
    type: String
    },
    current: {
    type: {lat: Number, lng: Number}
    },
    destination: {
    type: {lat: Number, lng: Number}
    }
});



const locationModel = mongoose.model('location',locationSchema)


module.exports = locationModel
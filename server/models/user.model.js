const mongoose = require('mongoose');
//const bcrypt = require('bcrypt') //encrypts and hashes our password
//const {isEmail} = require('validator')


const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "Username is required."],
        unique: [true, "Username already exists"],
        minlength: [2, "Username must be at least 2 characters."]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already exists"],
        lowercase: true,
        trim: true
        //validate: [ isEmail, "Please enter a valid Email"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be 8 characters or longer"]
    },
}, {timestamps: true});

const User = mongoose.model('User', UserSchema);
module.exports = User;
const User = require('../models/user.model');

module.exports.findAllUsers = (req, res) => {
    User.find()
        .then((allUsers) => {
            res.json({ users: allUsers })
        })
        .catch((err) => {
            res.json({ message: 'Something went wrong', error: err })
        });
}
 
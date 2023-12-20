const Tournament = require("../models/tournament.model");

//find all tournaments
module.exports.findAllTournaments = (req, res) => {
    Tournament.find()
        .then(allTournaments => res.json({ tournaments: allTournaments}))
        .catch(err => res.json({ messsage: "Something went wrong", error: err}))
}

//find one tournament
module.exports.findOneTournament = (req,res) => {
    Tournament.findById(req.params.id)
        .then(oneTournament => res.json({ tournament: oneTournament}))
        .catch(err => res.json({ message: "Something went wrong", error:err}));
}

//create a tournament
module.exports.createTournament = (req,res) => {
    Tournament.create(req.body)
        .then(newTournament => res.json({ tournament: newTournament}))
        .catch(err => {
            console.error('Error:', err); // Add this line for logging
            res.status(500).json({ message: "Something went wrong", error: err });
        });
}

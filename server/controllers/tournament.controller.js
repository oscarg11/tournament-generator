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
module.exports.createTournament = (req, res) => {
    Tournament.create(req.body)
        .then(newTournament => {
            console.log("New tournament created successfully!");
            res.json({ tournament: newTournament });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ message: "Something went wrong", error: err });
        });
}

//update or edit tournament
module.exports.updateTournament = (req, res) => {
    Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .then(updatedTournament => {
            console.log("Tournament updated successfully!");
            res.json({ tournament: updatedTournament });
        })
        .catch(err => {
            console.error('Error:', err);
            res.json({ message: "Something went wrong", error: err });
        });
}

//delete tournament
module.exports.deleteTournament = (req, res) => {
    Tournament.findByIdAndDelete(req.params.id)
        .then(result => {
            console.log("Tournament deleted successfully!");
            res.json({ result: result });
        })
        .catch(err => {
            console.error('Error:', err);
            res.json({ message: "Something went wrong", error: err });
        });
}
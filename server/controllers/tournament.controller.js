const Tournament = require("../models/tournament.model");

//find all tournaments
module.exports.findAllTournaments = (req, res) => {
    Tournament.find()
        .then(allTournaments => res.json({ tournaments: allTournaments}))
        .catch(err => res.json({ messsage: "Something went wrong", error: err}))
}

//find one tournament
module.exports.findOneTournament = (req,res) => {
    Tournament.findById(req.params._id)
        .then(oneTournament => res.json({ oneTournament: oneTournament}))
        .catch(err => res.json({ message: "Something went wrong", error:err}));
}

//create a tournament
module.exports.createTournament = (req, res) => {
    Tournament.create(req.body)
        .then(newTournament => {
            console.log("NEW TOURNAMENT CREATED SUCCESSFULLY!");
            res.json({ tournament: newTournament });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ message: "Something went wrong IN CREATE_TOURNAMENT", error: err });
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

//update group stage match scores
module.exports.updateGroupStageMatchScores = async (req, res) => {
    try {
        // Extract parameters from request
        const { tournamentId, roundIndex, matchIndex } = req.params;
        const { participant1Score, participant2Score } = req.body;

        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }

        // Validate the provided round and match index
        if (!tournament.matches || tournament.matches.length <= roundIndex) {
            return res.status(404).json({ message: "Round not found!" });
        }

        const round = tournament.matches[roundIndex];
        if (round.length <= matchIndex) {
            return res.status(404).json({ message: "Match not found!" });
        }

        // Update scores
        const match = round[matchIndex];
        match.scores.participant1Score = participant1Score;
        match.scores.participant2Score = participant2Score;

        // Save the tournament with updated scores
        await tournament.save();

        res.json({ success: true, updatedMatch: match, message: "Scores updated successfully!" });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
};

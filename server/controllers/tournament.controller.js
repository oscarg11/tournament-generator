const { Tournament, Match, Participant }= require("../models/tournament.model");


//find all tournaments
module.exports.findAllTournaments = (req, res) => {
    Tournament.find()
        .populate('participants')
        .populate('matches')
        .then(allTournaments => res.json({ tournaments: allTournaments}))
        .catch(err => res.json({ messsage: "Something went wrong", error: err}))
}

//find one tournament
module.exports.findOneTournament = (req,res) => {
    Tournament.findById(req.params._id)
        .populate('participants')
        .populate('matches')
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
        .populate('participants')
        .populate('matches')
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

//save matches to db
module.exports.saveMatches = async (req, res) => {
    try {
        const { id} = req.params;
        const { matches } = req.body;

        const matchInstances = await Match.insertMany(matches);
        const matchIds = matchInstances.map(match => match._id);
    
    //find the tournament by ID
    const tournament = await Tournament.findByIdAndUpdate(
        id,
        { $set: { matches: {$each: matchIds} }},
        { new: true, runValidators: true }
    );

    if(!tournament){
        return res.status(404).json({ message: "Tournament not found!"});
    }
    res.json({ success: true, tournament: tournament, message: "Matches added successfully!"});
    }catch(err){
        console.error('Error:', err);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
}

// Load tournament data with populated participants and matches
module.exports.loadTournamentData = async (req, res) => {
    const { tournamentId } = req.params;
    try {
        const tournament = await Tournament.findById(tournamentId)
            .populate('participants')
            .populate('matches');

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }

        res.json({ tournament });
    } catch (err) {
        console.error("Error loading tournament data:", err);
        res.status(500).json({ message: "Something went wrong while loading tournament data.", error: err });
    }
}

//update group stage match scores
module.exports.updateGroupStageMatchScores = async (req, res) => {
    try {
        // Extract parameters from request
        const { tournamentId, roundIndex, matchIndex } = req.params;
        const { participant1Score, participant2Score } = req.body;

        console.log("Parameters received - tournamentId:", tournamentId, "roundIndex:", roundIndex, "matchIndex:", matchIndex);
        console.log("Scores received - participant1Score:", participant1Score, "participant2Score:", participant2Score);

        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId).populate('matches');
        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }
        console.log(tournament, "Tournament Found")
        console.log(tournament.matches, "Tournament matches")

        // Validate the provided round and match index
        console.log("Validating roundIndex:", roundIndex, "against matches length:", tournament.matches?.length);
        if (!Array.isArray(tournament.matches) || tournament.matches.length <= roundIndex) {
        return res.status(404).json({ message: "Round not found!" });
}

        const round = tournament.matches[roundIndex];
        console.log("Round retrieved:", round);
        if (!Array.isArray(round) || round.length <= matchIndex) {
            return res.status(404).json({ message: "Match not found!" });
        }

        // Update scores
        console.log("Match before score update:", match);
        match.score.participant1Score = participant1Score;
        match.score.participant2Score = participant2Score;

        // Save the updated match
        await match.save();

        res.json({ success: true, updatedMatch: match, message: "Scores updated successfully!" });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
};

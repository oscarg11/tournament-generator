//Backend helper functions
const { determineGroupMatchResult, recalculateAllParticipantStats } = require("../helpers/tournamentFunctions");

const Match = require("../models/match.model");
const Tournament = require("../models/tournament.model");
const Participant = require("../models/participant.model");

module.exports.getGroupStageMatches = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Get Group stage matches for tournament ID:", id);

        const tournament = await Tournament.findById(id).populate('matches');

        if (!tournament) {
            console.log("Tournament not found!");
            return res.status(404).json({ message: "Tournament not found!" });
        }

        // ✅ Group matches by rounds
        const groupedMatches = tournament.matches.reduce((acc, match) => {
            if (!acc[match.round]) acc[match.round] = [];
            acc[match.round].push(match);
            return acc;
        }, {});

        // ✅ Convert object to array sorted by round number
        const roundsArray = Object.keys(groupedMatches)
            .sort((a, b) => a - b) // Ensure rounds are in order
            .map((round) => groupedMatches[round]);

        res.json({ matches: roundsArray }); // ✅ Return matches grouped by round
    } catch (err) {
        console.error("Error fetching group stage matches:", err);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
}


module.exports.saveMatches = async (req, res) => {
    try {
        const { id } = req.params; // Tournament ID
        const { matches } = req.body; // Array of matches

        // Validate matches input
        if (!Array.isArray(matches) || matches.length === 0) {
            return res.status(400).json({ message: "Matches must be a non-empty array." });
        }

        // Insert matches into the database
        const matchInstances = await Match.insertMany(matches);
        const matchIds = matchInstances.map(match => match._id);

        // Update the tournament with the new match IDs
        const tournament = await Tournament.findByIdAndUpdate(
            id,
            { $push: { matches: { $each: matchIds } } }, // Append match IDs
            { new: true, runValidators: true }
        );

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }

        res.json({ success: true, tournament, message: "Matches added successfully!" });
    } catch (err) {
        console.error("Error saving matches:", err);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
};

//UPDATE group stage match scores and update each participants stats
module.exports.updateGroupStageMatchScores = async (req, res) => {
    //validate request so that both scores are provided
    const { participant1Score, participant2Score } = req.body;

    if(participant1Score === undefined || participant2Score === undefined){
        return res. status(400).json({ message: "Both Participant scores are required"})
    }

    try {
        // Extract parameters from request
        const { tournamentId, roundIndex, matchIndex } = req.params;
        const { participant1Score, participant2Score } = req.body;

        console.log(`Updating scores for tournament ID: ${tournamentId}, Round: ${roundIndex}, Match: ${matchIndex}`);
        console.log(`Scores recieved: P1: ${participant1Score}, P2: ${participant2Score}`);
        
        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId)
            .populate('matches')
            .populate('participants');

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }
        
        //Get all group matches in the specified round
        const roundMatches = tournament.matches.filter(match => match.round === parseInt(roundIndex));

        //validate rounds
        if(!roundMatches.length){
            return res.status(404).json({ message: "Round not found!"})
        }
        console.log("Filtered round matches", roundMatches);

        //validate match index within the round
        if(matchIndex < 0 || matchIndex >= roundMatches.length){
            return res.status(404).json({ message: "Match not found!"});
        }

        const match = roundMatches[matchIndex];

        //ensure match is valid
        if(!match || !match.participants || match.participants.length < 2){
            return res.status(400).json({ message: "Invalid match data!"});
        }
        console.log("Match found:", match)

        //assign new scores
        match.participants[0].score = participant1Score;
        match.participants[1].score = participant2Score;
        match.status = 'completed'; // Mark match as completed

        console.log("Updated Group Match Scores:", match.participants);

        //get participants using the populated participants array
        const participant1id = match.participants[0].participantId.toString();
        const participant2id = match.participants[1].participantId.toString();

        const participant1 = tournament.participants.find(p => p._id.toString() === participant1id)
        const participant2 = tournament.participants.find(p => p._id.toString() === participant2id)

        if(!participant1 || !participant2){
            return res.status(404).json({ message: "Participants not found!"});
        }
        console.log("Participants found:", participant1.participantName, participant2.participantName);

        // calculate or re-calculate stats from all completed matches
        await recalculateAllParticipantStats(tournament)

        //save updates
        await match.save();
        await tournament.save();

        //check if updatedAt changes
        console.log("( updateGroupStageMatchScores ) Tournament saved, updatedAt:", tournament.updatedAt)

        //success response
        return res.json({
            success: true,
            updatedMatch: match,
            message: "Scores updated successfully!",
            updatedParticipants: [participant1, participant2]
        })
    } catch (err) {
        console.error("❌ BACKEND ERROR in updateGroupStageMatchScores:", err);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
};

//reset group stage match
module.exports.resetGroupStageMatch = async (req, res) => {
    try {
        const { tournamentId, roundIndex, matchIndex } = req.params;

        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId).populate('matches').populate('participants');

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }

        // find the match in the specified round
        const matchesInRound = tournament.matches.filter(m => m.round === parseInt(roundIndex));
        const match = matchesInRound[matchIndex];

        if(!match){
            return res.status(404).json({ message: "Match not found!" });
        }

        //reset match values
        
        match.participants[0].score = 0;
        match.participants[1].score = 0;
        match.status = 'pending';

        // Instead of subtracting old match stats, we recalculate everything from scratch
        recalculateAllParticipantStats(tournament)

        await match.save?.(); // Save the match to db
        await tournament.save(); // Save the tournament to db
    
        res.json({ success: true, message: "Match RESET and tournament stats re-calculated successfully!" });
    }catch(err){
        console.error("❌ Error RESETTING match:",err);
        res.status(500).json({ message: "Failed to reset match", error: err });
    }
}
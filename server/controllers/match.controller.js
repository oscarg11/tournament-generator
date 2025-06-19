//Backend helper functions
const { determineGroupMatchResult, recalculateAllParticipantStats, getSortedGroupStandings } = require("../helpers/tournamentFunctions");

const Match = require("../models/match.model");
const Tournament = require("../models/tournament.model");
const Participant = require("../models/participant.model");

module.exports.getGroupStageMatches = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Get Group stage matches for tournament ID:", id);

        const tournament = await Tournament.findById(id)
            .populate({
                path: 'matches',
                match: { stage: 'group'} // ✅ Filter matches to only include group stage matches
            })

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

// Get all knockout stage matches
module.exports.getKnockoutStageMatches = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Get Knockout stage matches for tournament ID:", id);

        const tournament = await Tournament.findById(id)
            .populate({
                path: 'matches',
                match: { stage: { $ne: 'group'} } // filter in knockout matches only
            });
            console.log("tournament retrieved from GetKnockoutStageMatches:", tournament);
        
        //validate tournament
        if (!tournament) {
            console.log("Tournament not found!");
            return res.status(404).json({ message: "Tournament not found!" });
        }

        //group matches by stage
        const groupedMatchesByStage = tournament.matches.reduce((acc, match) => {
            if(!acc[match.stage]) acc[match.stage] = [];
                acc[match.stage].push(match);
            return acc;
        }, {});
        console.log("Grouped matches by stage From getKnockoutMatches:", groupedMatchesByStage);

        res.json({ matches: groupedMatchesByStage }); // Return matches grouped by stage

    } catch (err) {
        console.error("Error fetching knockout stage matches:", err);
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
    const { participant1Score, participant2Score } = req.body;
    
    //validate request so that both scores are provided
    if(participant1Score === undefined || participant2Score === undefined){
        return res. status(400).json({ message: "Both Participant scores are required"})
    }

    try {
        // Extract parameters from request
        const { tournamentId, roundIndex, matchIndex } = req.params;

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

        //Update scores 
        match.participants[0].score = participant1Score;
        match.participants[1].score = participant2Score;
        match.status = 'completed'; // Mark match as completed
        await match.save(); // Save the match to db
        console.log("✅ Match updated and saved successfully!", match);

        // calculate or re-calculate stats from all completed matches
        await recalculateAllParticipantStats(tournament)
        console.log("✅ Participant stats recalculated successfully!");
        
        // get group info
        const groupIndex = tournament.groups.findIndex(g => g.groupName === match.group);
        if (groupIndex === -1) return res.status(404).json({ message: "Group not found!" });
        // get group object
        const group = tournament.groups[groupIndex];
        //get group participants
        const groupParticipantIds = tournament.groups[groupIndex].participants;
        
        //get all matches in the group
        const matchesForGroup = tournament.matches.filter(
                    m => m.group === group.groupName
                );

        // 🔄 Flatten match participant references for sorting
        const remappedMatches = matchesForGroup.map(match => {
            const flat = match.toObject();
            flat.participants = flat.participants.map(p => p.participantId.toString());
            return flat;
        });

        //get full participant objects
        const groupParticipants = tournament.participants.filter(p =>
            groupParticipantIds.some(id => id.toString() === p._id.toString())
        );

        //sort group standings
        const sortedGroupStandings = getSortedGroupStandings(groupParticipants, remappedMatches);
        console.log("🧪 Sorted standings:", sortedGroupStandings);

        // Save only participant IDs to group
        tournament.groups[groupIndex].participants = sortedGroupStandings.map(p => p._id);
        tournament.markModified('groups');
        // ✅ Save tournament
        await tournament.save();

         // Populate group participants for frontend
        await tournament.populate({
            path: 'groups.participants',
            model: 'Participant',
            select: 'participantName teamName matchesPlayed wins draws losses points goalsScored goalsAgainst goalDifference matchHistory _id'
        });

        //Re-order populated participants to match sorted standings
        const idOrder = sortedGroupStandings.map(p => p._id.toString());
        tournament.groups[groupIndex].participants = tournament.groups[groupIndex].participants.sort(
            (a, b) => idOrder.indexOf(a._id.toString()) - idOrder.indexOf(b._id.toString())
        );
        
        //re-fetch populated group
        const updatedGroup = tournament.groups[groupIndex];
        console.log("✅ Final populated group sent to frontend:", updatedGroup.participants);

        console.log("✅ Tournament saved with updated group standings.");

        //success response
        return res.json({
            success: true,
            updatedMatch: match,
            sortedGroupStandings: updatedGroup.participants,
            message: "Scores updated successfully!"
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
        await recalculateAllParticipantStats(tournament)

        for (let group of tournament.groups) {
            const groupParticipantIds = group.participants;
            const groupParticipants = tournament.participants.filter(p =>
                groupParticipantIds.some(id => id.toString() === p._id.toString())
            );

            // get all matches in the group
            const matchesForGroup = tournament.matches.filter(m => m.group === group.groupName);

            // call the sorting functin to update
            const sorted = getSortedGroupStandings(groupParticipants, matchesForGroup);
            group.participants = sorted.map(p => p._id); // Save sorted order
            }

        tournament.markModified('groups');
        await tournament.save();
    
        res.json({ success: true, message: "Match RESET and tournament stats re-calculated successfully!" });
    }catch(err){
        console.error("❌ Error RESETTING match:",err);
        res.status(500).json({ message: "Failed to reset match", error: err });
    }
}

//Update Knockout Stage match
module.exports.updateKnockoutStageMatch = async(req, res) => {
    const { participant1Score, participant2Score } = req.body;
    
    //validate request so that both scores are provided
    if(participant1Score === undefined || participant2Score === undefined){
        return res. status(400).json({ message: "Both Participant scores are required"})
    }

    try {
        //Extract parameters from request
        const { tournamentId, stageName, matchIndex } = req.params;
        console.log(`Updating scores for tournament ID: ${tournamentId}, Stage: ${stageName}, Match: ${matchIndex}`);
        console.log(`Scores recieved: P1: ${participant1Score}, P2: ${participant2Score}`);

        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId)
            .populate('matches')
            .populate('participants');

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }

        //get matches from specific stage
        const matchesInStage = tournament.matches.filter(m => m.stage === stageName);
        //validate matches
        if(!matchesInStage.length){
            return res.status(404).json({ message: "Stage not found!"})
        }
        console.log("Filtered stage matches", matchesInStage);

        //define the match
        const match = matchesInStage[matchIndex];
         //ensure match is valid
        if(!match || !match.participants || match.participants.length < 2){
            return res.status(400).json({ message: "Invalid match data!"});
        }
        console.log("Match found:", match)

        //Update Scores
        match.participants[0].score = participant1Score;
        match.participants[1].score = participant2Score;
        match.status = 'completed'; 
        await match.save();
        console.log("✅ Knockout Match updated and saved successfully!", match);


    } catch (error) {
        console.error("❌ Error updating knockout stage match:", error);
        res.status(500).json({ message: "Failed to update match", error });
        
    }
}
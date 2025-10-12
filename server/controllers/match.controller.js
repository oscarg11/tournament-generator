//Backend helper functions
const { determineKnockoutMatchResult,
        recalculateAllParticipantStats,
        getSortedGroupStandings,
        advanceParticipantsToNextMatch
        } = require("../helpers/tournamentFunctions");

const Match = require("../models/match.model");
const Tournament = require("../models/tournament.model");
const Participant = require("../models/participant.model");

module.exports.getGroupStageMatches = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 [GetGroupStageMatches] Tournament ID: ${id}`);

        const tournament = await Tournament.findById(id)
            .populate({
                path: 'matches',
                match: { stage: 'group'} // ✅ Filter matches to only include group stage matches
            })

        if (!tournament) {
            console.log("Tournament not found!");
            return res.status(404).json({ message: "Tournament not found!" });
        }

        console.log(`✅ Tournament "${tournament.tournamentName}" found`);
        console.log(`📦 Found ${tournament.matches.length} group stage matches`);

        // ✅ Group matches by rounds
        const groupedMatches = tournament.matches.reduce((acc, match) => {
            if (!acc[match.round]) acc[match.round] = [];
            acc[match.round].push(match);
            return acc;
        }, {});

        // Log grouped matches
        Object.entries(groupedMatches).forEach(([round, matches]) => {
        console.log(`  🌀 Round ${round}: ${matches.length} matches`);
        });

        // ✅ Convert object to array sorted by round number
        const roundsArray = Object.keys(groupedMatches)
            .sort((a, b) => a - b) // Ensure rounds are in order
            .map((round) => groupedMatches[round]);

        res.json({ matches: roundsArray }); // ✅ Return matches grouped by round
    } catch (err) {
        console.error(`❌ [GetGroupStageMatches] Error:`, err.message);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
}

// Get all knockout stage matches
module.exports.getKnockoutStageMatches = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🥊 [GetKnockoutStageMatches] Tournament ID: ${id}`);

        const tournament = await Tournament.findById(id)
            .populate({
                path: 'matches',
                match: { stage: { $ne: 'group'} }, // filter in knockout matches only
                populate: {// helps diplay names in server logs
                    path: 'participants.participantId',
                    model: 'Participant',
                    select: 'participantName'
                }
            });
        
        //validate tournament
        if (!tournament) {
            console.log("Tournament not found!");
            return res.status(404).json({ message: "Tournament not found!" });
        }

        console.log(`✅ Tournament "${tournament.tournamentName}" found`);
        console.log(`📦 Found ${tournament.matches.length} knockout stage matches`);

        //group matches by stage
        const groupedMatchesByStage = tournament.matches.reduce((acc, match) => {
            if(!acc[match.stage]) acc[match.stage] = [];
                acc[match.stage].push(match);
            return acc;
        }, {});

        // Log grouped matches with participant names
        Object.entries(groupedMatchesByStage).forEach(([stage, matches]) => {
        console.log(`\n📍 Stage "${stage}": ${matches.length} matches`);
        matches.forEach(m => {
            const p1 = m.participants?.[0]?.participantId?.participantName || "TBD";
            const p2 = m.participants?.[1]?.participantId?.participantName || "TBD";
            console.log(`   Match ${m.matchNumber}: ${p1} vs ${p2}`);
        });
        });

        res.json({ matches: groupedMatchesByStage }); // Return matches grouped by stage

    } catch (err) {
        console.error(`❌ [GetKnockoutStageMatches] Error:`, err.message);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
}


module.exports.saveMatches = async (req, res) => {
    try {
        const { id } = req.params; // Tournament ID
        const { matches } = req.body; // Array of matches
        console.log(`📌 [saveMatches] called — Tournament ID: ${id}`);

        // Validate matches input
        if (!Array.isArray(matches) || matches.length === 0) {
            console.log(`❌ [saveMatches] Invalid matches array`);
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
            console.log(`❌ [saveMatches] Tournament not found: ID ${id}`);
            return res.status(404).json({ message: "Tournament not found!" });
        }

        res.json({ success: true, tournament, message: "Matches added successfully!" });
        console.log(`✅ [saveMatches] Matches saved and tournament updated`);
    } catch (err) {
        console.error(`❌ [saveMatches] Error: ${err.message}`);
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

        console.log(`✏️ [UpdateGroupStageMatchScores] Tournament ID: ${tournamentId}`);
        console.log(`   Round ${roundIndex}, Match ${matchIndex}`);
        console.log(`   New Scores: P1=${participant1Score} | P2=${participant2Score}`);

        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId)
            .populate('matches')
            .populate('participants');

        if (!tournament) {
            console.log(`❌ [UpdateGroupStageMatchScores] Tournament not found`);
            return res.status(404).json({ message: "Tournament not found!" });
        }

        //Get all group matches in the specified round
        const roundMatches = tournament.matches.filter(match => match.round === parseInt(roundIndex));
        //validate rounds
        if(!roundMatches.length){
            console.log(`❌ [UpdateGroupStageMatchScores] Match not found`);
            return res.status(404).json({ message: "Round not found!"})
        }
        console.log("Filtered round matches", roundMatches);

        //validate match index within the round
        if(matchIndex < 0 || matchIndex >= roundMatches.length){
            return res.status(404).json({ message: "Match not found!"});
        }

        //define match and validate match
        const match = roundMatches[matchIndex];
        if(!match || !match.participants || match.participants.length < 2){
            console.error("❌ Match data invalid or missing participants!");
            return res.status(400).json({ message: "Invalid match data!"});
        }
        console.log("Match found:", match)

        console.log(`⚔️ Updating Match ${match.matchNumber || "N/A"}:`);
        console.log(`   🆚 ${match.participants[0]?.participantId?.participantName || "TBD"} vs ${match.participants[1]?.participantId?.participantName || "TBD"}`);

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
        if (groupIndex === -1) {
            console.log(`❌ Group "${match.group}" not found in tournament`);
            return res.status(404).json({ message: "Group not found!" });
        }

        // Define group
        const group = tournament.groups[groupIndex];
        console.log(`🏷 Group: ${group.groupName} (Index ${groupIndex})`);

        //get group participants
        const groupParticipantIds = tournament.groups[groupIndex].participants;
        //get all matches in the group
        const matchesForGroup = tournament.matches.filter(
                    m => m.group === group.groupName
                );
        console.log(`📦 Total matches in group "${group.groupName}": ${matchesForGroup.length}`);

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
        console.log("📈 Sorted standings:", sortedGroupStandings.map(p => `${p.participantName} (${p.points} pts)`));

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
        
        //re-fetch updated populated group
        const updatedGroup = tournament.groups[groupIndex];
        console.log("✅ Final Group Standings Sent to Frontend:");
        updatedGroup.participants.forEach((p, idx) =>
            console.log(`   ${idx + 1}. ${p.participantName} (${p.points} pts)`)
        );

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

//RESET GROUP STAGE MATCH
module.exports.resetGroupStageMatch = async (req, res) => {
    try {
        const { tournamentId, roundIndex, matchIndex } = req.params;
        console.log(`📌 [resetGroupStageMatch] called — Tournament ID: ${tournamentId}, Round: ${roundIndex}, Match: ${matchIndex}`);

        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId).populate('matches').populate('participants');

        if (!tournament) {
            console.log(`❌ [resetGroupStageMatch] Tournament not found: ID ${tournamentId}`);
            return res.status(404).json({ message: "Tournament not found!" });
        }

        // find the match in the specified round
        const matchesInRound = tournament.matches.filter(m => m.round === parseInt(roundIndex));
        const match = matchesInRound[matchIndex];

        if(!match){
            console.log(`❌ [resetGroupStageMatch] Match not found at index ${matchIndex} in round ${roundIndex}`);
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

        console.log(`✅ [resetGroupStageMatch] Match reset and tournament stats recalculated`);
    
        res.json({ success: true, message: "Match RESET and tournament stats re-calculated successfully!" });
    }catch(err){
        console.error(`❌ [resetGroupStageMatch] Error: ${err.message}`);
        res.status(500).json({ message: "Failed to reset match", error: err });
    }
}

//UPDATE KNOCKOUT STAGE MATCH
module.exports.updateKnockoutStageMatch = async(req, res) => {
    const { participant1Score, participant2Score, knockoutMatchTieBreaker } = req.body;
    
    //validate request so that both scores are provided
    if(participant1Score === undefined || participant2Score === undefined){
        return res. status(400).json({ message: "Both Participant scores are required"})
    }

    try {
        //Extract parameters from request
        const { tournamentId, stageName, matchIndex } = req.params;
        console.log(`📊 [updateKnockoutStageMatch] called — Tournament ID: ${tournamentId}, Stage: ${stageName}, Match: ${matchIndex}`);
        console.log(`📊 Updating match: Tournament ${tournamentId}, Stage: ${stageName}, Match: ${matchIndex}`);
        console.log(`⚽ Scores: P1: ${participant1Score}, P2: ${participant2Score}`);

        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId)
            .populate('matches')
            .populate('participants');

        if (!tournament) {
            console.log(`❌ [updateKnockoutStageMatch] Tournament not found: ID ${tournamentId}`);
            return res.status(404).json({ message: "Tournament not found!" });
        }

        //get matches from specific stage
        const matchesInStage = tournament.matches.filter(m => m.stage === stageName);
        //validate matches
        if(!matchesInStage.length){
            console.log(`❌ [updateKnockoutStageMatch] Invalid match data or participants missing`);
            return res.status(404).json({ message: "Stage not found!"})
        }
        console.log("Filtered stage matches", matchesInStage);

        //define the match
        const match = matchesInStage[matchIndex];
        if(!match || !match.participants || match.participants.length < 2){
            return res.status(400).json({ message: "Invalid match data!"});
        }

        //Update Scores + tiebreaker if provided
        match.participants[0].score = participant1Score;
        match.participants[1].score = participant2Score;
        match.knockoutMatchTieBreaker = knockoutMatchTieBreaker;

        //define participants
        const [p1, p2] = match.participants;
        const participant1 = tournament.participants.find(p => p._id.toString() === p1.participantId.toString());
        const participant2 = tournament.participants.find(p => p._id.toString() === p2.participantId.toString());

        console.log(`⚔️ Updating Knockout Match ${match.matchNumber || "N/A"}: ${participant1?.participantName || "TBD"} vs ${participant2?.participantName || "TBD"}`);
        
        match.status = 'completed'; // Mark match as completed

        // call function to determine winner/loser and update stats
        determineKnockoutMatchResult(
            participant1,
            participant2,
            { participant1: participant1Score, participant2: participant2Score },
            match,
            knockoutMatchTieBreaker || {},
            true //shouldSetWinnerAndLoser = true because this is a new match completion
        )
        console.log("📝 Saving match with tiebreaker:", match.knockoutMatchTieBreaker);
        console.log("🏁 Final match object before save:", match);
        await match.save();
        
        // Recalculate all participants stats from scratch to ensure accuracy
        await recalculateAllParticipantStats(tournament)

        const currentMatch = await match.populate("participants.participantId");
        
        // Advance winners to next and losers to third place match if its a semifinal
        const updatedNextMatches = advanceParticipantsToNextMatch(match, tournament);
        console.log("updated next matches:", updatedNextMatches);
        await match.save();

        //populate the updated next matches with participant info for response
        let populatedUpdates = [];
        for (const m of updatedNextMatches){
            await m.save();
            const populated = await m.populate("participants.participantId");
            populatedUpdates.push(populated);
        }
        return res.status(200).json({
            message: "Match Updated Successfully",
            match: currentMatch, //the current updated match
            nextMatches: populatedUpdates //the updated next matches
        });

    } catch (error) {
        console.error(`❌ [updateKnockoutStageMatch] Error: ${error.message}`);
        res.status(500).json({ message: "Failed to update match", error });
    }
}

//RESET KNOCKOUT STAGE MATCH
module.exports.resetKnockoutStageMatch = async (req, res) => {
    try {
        const { tournamentId, stageName, matchIndex } = req.params;
        console.log(`📌 [resetKnockoutStageMatch] called — Tournament ID: ${tournamentId}, Stage: ${stageName}, Match: ${matchIndex}`);

        // Find tournament
        const tournament = await Tournament.findById(tournamentId)
            .populate('matches')
            .populate('participants');

            if(!tournament){
                return res.status(404).json({ message: "Tournament not found!" });
            }

            // Find matches in this stage
            const matchesInStage = tournament.matches.filter(m => m.stage === stageName);
            const currentMatch = matchesInStage[matchIndex];
            
            if(!currentMatch){
                return res.status(404).json({ message: "Match not found!" });
            }

            //extract current match info
            const { nextMatchId, nextSlotIndex, thirdPlaceMatchId, thirdPlaceSlotIndex } = currentMatch;

            //FIND THE NEXT MATCH
            let nextMatch = tournament.matches.find(matches =>
                matches._id.toString() === nextMatchId.toString()
            );
             //validate that next match exists
            if(!nextMatch) return false;

            //FIND THE THIRD PLACE MATCH IF APPLICABLE
            let thirdPlaceMatch = tournament.matches.find(matches =>
                matches._id.toString() === currentMatch.thirdPlaceMatchId.toString()
            );
            //validate that next match exists
            if(!thirdPlaceMatch) return false;


            // Check if match is a semi final then reset starting from its descendants
            if(thirdPlaceMatchId && currentMatch.stage === 'semiFinals'){
                //reset the current matches descendants first
                nextMatch.participants[nextSlotIndex] = { participantId: null };
                await nextMatch.save();// save reset
                console.log("Next match reset:", nextMatch);

                //reset third place match participants
                thirdPlaceMatch.participants[thirdPlaceSlotIndex] = { participantId: null };
                await thirdPlaceMatch.save();// save reset
                console.log("Third place match reset:", thirdPlaceMatch);

                //reset the parent match (current match)
                currentMatch.participants[0].score = 0;
                currentMatch.participants[1].score = 0;
                currentMatch.knockoutMatchTieBreaker = null;
                currentMatch.winner = null;
                currentMatch.loser = null;
                currentMatch.status = 'pending';

            //if match is a final or thirdplace match, just reset itself
            }else if(!currentMatch.nextMatchId && !currentMatch.thirdPlaceMatchId){
                currentMatch.participants[0].score = 0;
                currentMatch.participants[1].score = 0;
                currentMatch.knockoutMatchTieBreaker = null;
                currentMatch.winner = null;
                currentMatch.loser = null;
                currentMatch.status = 'pending';

                
            // for all other knockout stages just reset the current match and its next match
            }else{
                //reset the current matches descendants first
                const nextMatch = tournament.matches.find(matches =>
                    matches._id.toString() === nextMatchId.toString()
                );
                if(!nextMatch) return false;
                nextMatch.participants[nextSlotIndex] = { participantId: null };
                await nextMatch.save();// save reset

                currentMatch.participants[0].score = 0;
                currentMatch.participants[1].score = 0;
                currentMatch.knockoutMatchTieBreaker = null;
                currentMatch.winner = null;
                currentMatch.loser = null;
                currentMatch.status = 'pending';

            }
            //recalculate all participants stats
            await recalculateAllParticipantStats(tournament)

            const updatedMatches = [currentMatch];
            if (nextMatch) updatedMatches.push(nextMatch);
            if (thirdPlaceMatch) updatedMatches.push(thirdPlaceMatch);

            //repopulate all matches with updated info
            await Promise.all(
            updatedMatches.map(m => m.populate("participants.participantId"))
            );
            //save all
            await Promise.all(
                updatedMatches.map(m => m.save())
            );

            console.log("✅ [resetGroupStageMatch] Knockout Match Reset Successfully")

            // Return populated matches
            return res.status(200).json({
            message: "Match reset successful",
            updatedMatches
            });

    } catch (error) {
        console.error(`❌ [resetKnockoutMatch] Error: ${error.message}`);
        res.status(500).json({ message: "Failed to reset match", error });
    }
}
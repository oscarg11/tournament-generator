//Backend helper functions
const { shuffle, createGroups, createGroupStageMatches, determineGroupMatchResult } = require("../helpers/tournamentFunctions");

//import models
const Tournament = require("../models/tournament.model");
const Participant = require("../models/participant.model");
const Match = require("../models/match.model");

//create a tournament
module.exports.createTournament = async (req, res) => {
    try {
        const { tournamentName, format, numberOfGroupStageLegs, numberOfParticipants, participants } = req.body;
        console.log("createTournament controller",req.body);
        
        //save participants to the db
        const participantInstances = await Participant.insertMany(participants);
        const participantIds = participantInstances.map(p => p._id);

        console.log("Participant IDs:", participantIds);
        
        // Shuffle participants
        const shuffledParticipants = shuffle([...participantIds]);
        console.log("Participants in createTournament AFTER shuffle():", participantIds);

        let groups = [];
        let matches = [];
        
        //generate groups and matches if the format is groupAndKnockout
        if(format === "groupAndKnockout"){
            //CREATE GROUPS
            groups = createGroups(shuffledParticipants);
            console.log("✅ Groups Created:", JSON.stringify(groups, null, 2));

            //GENERATE GROUP STAGE MATCHES
            const { allRounds, allMatches } = createGroupStageMatches(groups, numberOfGroupStageLegs);
            matches = allMatches;
            console.log("✅ Matches Generated:", JSON.stringify(matches, null, 2));
        }
        
        const newTournament = await Tournament.create({
            tournamentName,
            format,
            numberOfGroupStageLegs,
            numberOfParticipants,
            participants: participantIds,
            groups: format === "groupAndKnockout" ? groups : undefined,
            matches: []
        });
        
        // Save matches to the database
        if (matches.length > 0) {
            console.log("✅ Inserting matches into DB...");
            const matchInstances = await Match.insertMany(matches);
            const matchIds = matchInstances.map((match) => match._id);
            
            console.log("✅ Inserted Match IDs:", matchIds);
            newTournament.matches = matchIds;
            await newTournament.save();
            console.log("✅ Tournament updated with matches.");
        }
        
        console.log("🎉 NEW TOURNAMENT CREATED SUCCESSFULLY!");
        res.json({ tournament: newTournament });
    } catch (err) {
        console.error('Error Creating Tournament:', err);
        res.status(500).json({ message: "Something went wrong in creating tournament", error: err });
    }
}

//find all tournaments
module.exports.findAllTournaments = async (req, res) => {
    try {
        const Alltournaments = await Tournament.find()
            .populate('participants')
            .populate('matches');
            
        //populate groups with participants
        for (let tournament of Alltournaments) {
            if (tournament.groups && tournament.groups.length > 0) {
                for (let group of tournament.groups) {
                    group.participants = await Participant.find({ _id: { $in: group.participants } });
                }
            }
        }
        res.json(Alltournaments);
    } catch (err){
        console.error('Error:', err);
        res.status(500).json({ message: "Something went wrong", error: err });
        
    }
}

//find one tournament
module.exports.findOneTournament = async (req,res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('participants')
            .populate('matches');
            
        if(!tournament){
            return res.status(404).json({ message: "Tournament not found!" });
        }
        //populate groups with participants
        if(tournament.groups && tournament.groups.length > 0){
            for(let group of tournament.groups){
                group.participants = await Participant.find({ _id: { $in: group.participants } });
            }
        }
        res.json( {oneTournament: tournament} );
    } catch (err){
        console.error('Error:', err);
        res.status(500).json({ message: "Something went wrong", error: err });
        
    }
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

//update group stage match scores and update each participants stats
module.exports.updateGroupStageMatchScores = async (req, res) => {
    try {
        // Extract parameters from request
        const { tournamentId, roundIndex, matchIndex } = req.params;
        const { participant1Score, participant2Score } = req.body;

        console.log(`Updating scores for tournament ID: ${tournamentId}, Round: ${roundIndex}, Match: ${matchIndex}`);
        console.log(`Scores recieved: P1: ${participant1Score}, P2: ${participant2Score}`);
        
        // Find the tournament by ID
        const tournament = await Tournament.findById(tournamentId).populate('matches');
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

        console.log("Updated Group Match Scores:", match.participants);

        //get participants using the participantId
        const participant1id = match.participants[0].participantId;
        const participant2id = match.participants[1].participantId;

        const participant1 = await Participant.findById(participant1id);
        const participant2 = await Participant.findById(participant2id);

        if(!participant1 || !participant2){
            return res.status(404).json({ message: "Participants not found!"});
        }
        console.log("Participants found:", participant1, participant2);

        //call helper function to determine match result
        const updatedMatchScores = determineGroupMatchResult(
            participant1,
            participant2,
            { participant1: participant1Score, participant2: participant2Score},
            match
        );

        //save updates
        await updatedMatchScores.participant1.save();
        await updatedMatchScores.participant2.save();
        match.status = 'completed'; // Mark match as completed
        
        await match.save();
        await tournament.save();

        // re-fetch updated participants from MongoDB after saving
        const updatedParticipant1 = await Participant.findById(participant1._id);
        const updatedParticipant2 = await Participant.findById(participant2._id);
        

        console.log("✅ Updated Participant 1 in MongoDB:", updatedParticipant1);
        console.log("✅ Updated Participant 2 in MongoDB:", updatedParticipant2);

        //success response
        return res.json({
            success: true,
            updatedMatch: match,
            message: "Scores updated successfully!",
            updatedMatchScores: [updatedMatchScores.participant1, updatedMatchScores.participant2]
        })
    } catch (err) {
        console.error("❌ BACKEND ERROR in updateGroupStageMatchScores:", err);
        res.status(500).json({ message: "Something went wrong", error: err });
    }
};

//Backend helper functions
const { shuffle, createGroups, createGroupStageMatches } = require("../helpers/tournamentFunctions");

//import models
const Tournament = require("../models/tournament.model");
const Participant = require("../models/participant.model");
const Match = require("../models/match.model");

//CREATE a tournament
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

//find ALL tournaments
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

//find ONE tournament
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


//UPDATE or edit tournament
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

//DELETE tournament
module.exports.deleteTournament = (req, res) => {
    Tournament.findByIdAndDelete(req.params.id)
        .then(result => {
            console.log("TOURNAMENT DELETED SUCCESSFULLY!");
            res.json({ result: result });
        })
        .catch(err => {
            console.error('Error:', err);
            res.json({ message: "Something went wrong", error: err });
        });
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



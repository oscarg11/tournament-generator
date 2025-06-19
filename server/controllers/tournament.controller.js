//Backend helper functions
const { shuffle, createGroups, createGroupStageMatches, getSortedGroupStandings, recalculateAllParticipantStats, getKnockoutStageName  } = require("../helpers/tournamentFunctions");

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
        console.log("Participants in createTournament AFTER shuffle():", shuffledParticipants);

        let groups = [];
        let matches = [];
        
        //generate groups and matches if the format is groupAndKnockout
        if(format === "groupAndKnockout"){
            //CREATE GROUPS
            groups = createGroups(shuffledParticipants);
            console.log("✅ Groups Created:", JSON.stringify(groups, null, 2));

            //assign groups to participant objects
            for (const group of groups){
                await Participant.updateMany(
                    { _id: { $in: group.participants } },
                    { $set: { groupName: group.groupName } }
                );
            }

            //GENERATE GROUP STAGE MATCHES
            const { allMatches } = createGroupStageMatches(groups, numberOfGroupStageLegs);
            matches = allMatches;
            // console.log("✅ Matches Generated:", JSON.stringify(matches, null, 2));
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
            
            // console.log("✅ Inserted Match IDs:", matchIds);
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
                const idOrder = group.participants.map(p => p.toString());

                //find all participants in the group
                const populated = await Participant.find({
                    _id: { $in: idOrder}
                })

                //reorder participants to match the original order
                group.participants = idOrder.map(id => 
                    populated.find(p => p._id.toString() === id)
                );
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
            console.log("Tournament UPDATED successfully!");
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

//Conclude Group Stage
module.exports.concludeGroupStage = async (req, res) => {
    console.log("Conclude Group Stage Triggered!");
    const tournamentId = req.params.id;

    try {
        //1. Find and populate tournament data
        const tournament = await Tournament.findById(tournamentId)
        .populate('participants')
        .populate('matches');
        //validate tournament
            if (!tournament) {
                return res.status(404).json({ message: "Tournament not found!" });
            }
            console.log("✅ Tournament found:", tournament._id);

             //Deep population of participants within groups
            await tournament.populate({
                path: 'groups.participants',
                select: 'participantName teamName points goalDifference goalsScored _id'
            });
            
            console.log("✅ Groups data:", tournament.participants.map(p => ({
                id: p._id,
                name: p.participantName,
                team: p.teamName,
                points: p.points,
                goalDifference: p.goalDifference,
                goalsScored: p.goalsScored
            })));
            
            //2. final recalculation of all participants stats
            await recalculateAllParticipantStats(tournament);
            await tournament.save();
            console.log("✅ Final Group stage Stats recalculated and saved.");

            //3. Initialize finalist array
            const finalists = [];
            const allGroups = tournament.groups;

            // 4. loop through each group to sort and select finalists
            for (const group of allGroups) {
                // 🔍 Get all matches for one group
                const matchesForGroup = tournament.matches.filter(
                    m => m.group === group.groupName
                );

                // 🔄 remap matches to plain objects and flatten participants array
                const remappedMatches = matchesForGroup.map(match => match.toObject());

            console.log("🔄 Before Sorting Logic:", group.participants.map(p => ({
                id: p._id,
                name: p.participantName,
                points: p.points,
                goalDifference: p.goalDifference,
                goalsScored: p.goalsScored
            })));
            
            // 🏆 Get the sorted standings for the group
            const standings = getSortedGroupStandings(
                group.participants,
                remappedMatches
            );

            //re-assign updated standings to group participants
            group.participants = standings.map(p => p._id);
            tournament.markModified('groups');
            // ✅ Save tournament with updated group standings
            await tournament.save();

            // 🔍 **Print with names**
            console.log("🏆 Sorted Standings for Group:", standings.map(p => {
                const participant = tournament.participants.find(
                    part => part._id.toString() === p._id.toString()
                );
                return {
                    id: p._id,
                    name: participant ? participant.participantName : "Name not found",
                    team: participant ? participant.teamName : "Team not found",
                    points: participant ? participant.points : "No Points",
                    goalDifference: participant ? participant.goalDifference : "No GD",
                    goalsScored: participant ? participant.goalsScored : "No GS"
                };
            }));

            console.log("✅ Sorted standings:", standings);

            // 🏆 Extract the top two participants from the sorted standings
            const groupWinner = tournament.participants.find(
                p => p._id.toString() === standings[0]._id.toString()
            );
            const groupRunnerUp = tournament.participants.find(
                p => p._id.toString() === standings[1]._id.toString()
            );

            console.log("🏆 FINALISTS SELECTED:", {
                winner: groupWinner ? groupWinner.participantName : "Not found",
                winnerTeam: groupWinner ? groupWinner.teamName : "Not found",
                runnerUp: groupRunnerUp ? groupRunnerUp.participantName : "Not found",
                runnerUpTeam: groupRunnerUp ? groupRunnerUp.teamName : "Not found"
            });
            
            // 🔄 Push to finalist array
            finalists.push(
                {
                    participant: groupWinner._id,
                    participantName: groupWinner.participantName,
                    teamName: groupWinner.teamName,
                    group: group.groupName,
                    rank:1,
                },
                {
                    participant: groupRunnerUp._id,
                    participantName: groupRunnerUp.participantName,
                    teamName: groupRunnerUp.teamName,
                    group: group.groupName,
                    rank:2,
                }
            );
        }

        // 5. Save finalists to tournament
        tournament.finalists = finalists;
        //what is in the finalist array?
        console.log("Finalists in conclude group stage", tournament.finalists)

        // disable group stage matches
        tournament.groupStageConcluded = true;
        console.log("✅ Group stage concluded:", tournament.groupStageConcluded);

        await tournament.save();
        return res.json({ finalists: tournament.finalists });

    } catch (error) {
        console.error("🚨 Error in concludeGroupStage:", error.message);
        console.error(error.stack);
        res.status(500).json({ 
            message: "Something went wrong", 
            error: error.message 
        });
    }
};

//Create Knockout Matches
module.exports.createKnockoutMatches = async (req, res) => {
    const tournamentId = req.params.id;
    try {
        //1. Find the tournment by id and populate finalists
        const tournament = await Tournament.findById(tournamentId)
            .populate('finalists.participant')

            //validate tournament
            if (!tournament) {
                return res.status(404).json({ message: "Tournament not found!" });
            }
            console.log("✅ Tournament found:", tournament._id);

            const finalists = tournament.finalists;
            console.log("FINALIST Array called from createKockout Controller:", finalists)
            const groups = tournament.groups;
            const allKnockoutMatches = []
            let matchNumber = tournament.matches.length + 1; // Start match numbering from the last match number

            // If there is only one Group then a single final match will be created
            if( groups.length === 1){
                const [firstPlace, secondPlace] = finalists;
                console.log("🏆 Grand Finalists:");
                console.log(`1st Place: ${firstPlace.participant.participantName} | Group: ${firstPlace.participant.groupName} | Rank: 1`);
                console.log(`2nd Place: ${secondPlace.participant.participantName} | Group: ${secondPlace.participant.groupName} | Rank: 2`);

                //create a single knockout match for the final
                const grandFinalMatch = {
                    participants: [
                        { participantId: firstPlace.participant, score: 0},
                        { participantId: secondPlace.participant, score: 0 },
                    ],
                    matchNumber: matchNumber++,
                    stage: 'final',
                    status: 'pending'
                };
                //push the match to the allKnockoutMatches array
                allKnockoutMatches.push(grandFinalMatch);
                //insert the match into the database
                await Match.insertMany(allKnockoutMatches);
                //save the match to the tournament
                await tournament.save();

                console.log("✅ Grand Final Match Created:", grandFinalMatch);
                return res.json({ message: "Grand Final Match Created", match: grandFinalMatch });

            //handle multiple groups
            }else{
                //organize all finalist by their group
                const finalistsByGroup = finalists.reduce((groupedFinalists, finalist) => {
                    const group = finalist.participant.groupName || "Unknown Group";
                    if(!groupedFinalists[group]){
                        groupedFinalists[group] = [];
                    }
                    groupedFinalists[group].push({
                        participant: finalist.participant._id,
                        participantName: finalist.participant.participantName,
                        group: group,
                        rank: finalist.rank
                    });
                    console.log(`🧩 Grouping finalist: ${finalist.participant.participantName} into ${group}`);
                    return groupedFinalists;
                },{});
                
                // Log the grouped finalists array
                console.log("📊 Finalists grouped by group name (stringified IDs):");
                console.dir(
                Object.entries(finalistsByGroup).reduce((acc, [group, finalists]) => {
                    acc[group] = finalists.map(f => ({
                    ...f,
                    participant: f.participant.toString()
                    }));
                    return acc;
                }, {}),
                { depth: null }
                );

                // create knockout matches based on the finalists
                const numOfFinalists = finalists.length;
                const totalRounds = Math.ceil(Math.log2(numOfFinalists));
                const knockOutRounds = Array.from({ length: totalRounds }, () => []);

                // access the groups array from the finalistsByGroup object
                const groupKeys = Object.keys(finalistsByGroup);

                // iterate through each group
                for( let i = 0; i < groupKeys.length; i+= 2){
                    // get the current groups first index and the next groups second index 
                    const group1 = groupKeys[i]; // ex "Group A: group winner
                    const group2 = groupKeys[i + 1]; // ex "Group B: group runner up

                    const group1Finalists = finalistsByGroup[group1];
                    const group2Finalists = finalistsByGroup[group2];

                    //Create knockout matches for each group pair
                    const match1 = {
                        participants: [
                            { participantId: group1Finalists[0].participant, score: 0 },
                            { participantId: group2Finalists[1].participant, score: 0 }
                        ],
                        matchNumber: matchNumber ++,
                        stage: getKnockoutStageName(0, totalRounds),
                        status: 'pending'
                    };

                    const match2 = {
                        participants: [
                            { participantId: group2Finalists[0].participant, score: 0 },
                            { participantId: group1Finalists[1].participant, score: 0 }
                        ],
                        matchNumber: matchNumber++,
                        stage: getKnockoutStageName(0, totalRounds),
                        status: 'pending'
                    };

                    //push the matches to the KnockOutRounds array
                    knockOutRounds[0].push(match1);
                    knockOutRounds[0].push(match2);
                }
                const insertedMatches = await Match.insertMany(knockOutRounds[0]);

                // Populate participantId with participantName and teamName
                await Match.populate(insertedMatches, {
                path: 'participants.participantId',
                select: 'participantName teamName'
                });

                const matchIds = insertedMatches.map(match => match._id);

                console.log("✅ Knockout Matches Created:");
                insertedMatches.forEach(match => {
                const [p1, p2] = match.participants;
                console.log(`- Match ${match.matchNumber}: ${p1.participantId.participantName} vs ${p2.participantId.participantName} | Stage: ${match.stage}`);
                });

                //save the matches to the tournament
                tournament.matches.push(...matchIds);
                await tournament.save();
                console.log("✅ Tournament updated with knockout matches.");
                res.json({ message: "Knockout Matches Created", matches: insertedMatches });
            }


    } catch (error) {
        console.error("🚨 Error in createKnockoutMatches:", error.message);
        console.error(error.stack);
        res.status(500).json({ 
            message: "Something went wrong", 
            error: error.message 
        });
        
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



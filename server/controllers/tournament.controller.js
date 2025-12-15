const mongoose = require('mongoose');

//Backend helper functions
const { shuffle,
        createGroups,
        createGroupStageMatches, 
        getSortedGroupStandings,
        recalculateAllParticipantStats,
        getKnockoutStageName
        } = require("../helpers/tournamentFunctions");

//import models
const Tournament = require("../models/tournament.model");
const Participant = require("../models/participant.model");
const Match = require("../models/match.model");

//CREATE a tournament
module.exports.createTournament = async (req, res) => {
    try {
        const { tournamentName, format, numberOfParticipants, numberOfGroupStageLegs } = req.body;
        console.log(`🏆 [CreateTournament] Creating "${tournamentName}" - ${format} format with ${numberOfParticipants} participants`);
        
        const newTournament = await Tournament.create({
            tournamentName,
            format,
            numberOfParticipants,
            numberOfGroupStageLegs
        });
        
        console.log(`🎉 Tournament "${tournamentName}" created successfully!`);
        res.json({ tournament: newTournament });
    } catch (err) {
        console.error('❌ [CreateTournament] Error:', err.message);
        res.status(500).json({ message: "Something went wrong in creating tournament", error: err });
    }
}

//Add Participant to tournament
module.exports.addParticipantToTournament = async (req, res) => {
    
    try {
        //find tournament
        const tournament = await Tournament.findById(req.params.id)
        //validate tournament
        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }

        //Guard to prevent adding participants if tournament has started
        if(tournament.status !== 'pending'){
            return res.status(400).json({
                message: "Cannot add participants. Tournament has already started!"
            });
        }
        //check if tournament has reached participant limit
        if(tournament.participants.length >= tournament.numberOfParticipants){
            return res.status(400).json({ message: "Tournament participant limit reached!" });
        }
        
        //create a new participant instance
        const newParticipant = await Participant.create(req.body);

        //add participant to tournament
        tournament.participants.push(newParticipant._id);
        await tournament.save();

        console.log(`✅ Tournament "${tournament.tournamentName}" updated with participant "${newParticipant.participantName}"`);
        res.json({ participant: newParticipant });
    } catch (error) {
        console.error('❌ [AddParticipantToTournament] Error:', error.message);
        res.status(500).json({ message: "Something went wrong in adding participant to tournament", error: error });
    }
}

//Start Tournament
module.exports.startTournament = async (req, res) => {
    try {
        //find tournament
        const tournament = await Tournament.findById(req.params.id)
            .populate('participants');

        //validate tournament
        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found!" });
        }
        //check if tournament has already started
        if(tournament.status !== 'pending'){
            return res.status(400).json({ message: "Tournament has already started!" });
        }
        //check if enough participants have been added
        const currentCount = tournament.participants.length;
        const maxCount = tournament.numberOfParticipants;

        if(currentCount < maxCount){
            return res.status(400).json({
                message: `Not enough participants to start tournament! ${maxCount - currentCount} more needed to start.`
            })
        }

        if(currentCount > maxCount){
            return res.status(400).json({
                message: `Too many participants to start tournament! Remove ${currentCount - maxCount} before starting.`
            })
        }

        //check if tournament format is groupAndKnockout and numberOfGroupStageLegs is set
        if(tournament.format === 'groupAndKnockout' && !tournament.numberOfGroupStageLegs) {
            return res.status(400).json({ message: "Number of group stage legs must be set for groupAndKnockout format!" });
        }

        //extract participant IDs
        const participantIds = tournament.participants.map(p => p._id);

        console.log(`Participants in Db  ${tournament.tournamentName} BEFORE shuffle():`, participantIds);
        
        //SHUFFLE participants for randomization 
        const shuffledParticipants = shuffle([...participantIds]);
        console.log(`🔀 Participants shuffled for random group assignment`);
        console.log("Participants in createTournament AFTER shuffle():", shuffledParticipants);

        //INITIALIZE groups and matches
        let groups = [];
        let matches = [];
        
        //generate groups and matches if the format is groupAndKnockout
        if(tournament.format === "groupAndKnockout"){
            //CREATE GROUPS
            groups = createGroups(shuffledParticipants);
            console.log(`✅ Created ${groups.length} groups: ${groups.map(g => g.groupName).join(', ')}`);

            //assign groups to participant objects
            for (const group of groups){
                await Participant.updateMany(
                    { _id: { $in: group.participants } },
                    { $set: { groupName: group.groupName } }
                );
            }
            console.log(`✅ Group assignments saved to participant records`);
            
            //GENERATE GROUP STAGE MATCHES
            const { allMatches } = createGroupStageMatches(groups, tournament.numberOfGroupStageLegs);
            matches = allMatches;
            console.log(`✅ Generated ${matches.length} group stage matches`);
        }

        // Save matches to the database
        if (matches.length > 0) {
            console.log(`💾 Inserting ${matches.length} matches into database...`);
            const matchInstances = await Match.insertMany(matches);
            const matchIds = matchInstances.map((match) => match._id);
            
            // console.log("✅ Inserted Match IDs:", matchIds);
            tournament.matches = matchIds;
            //update tournament status to started
            tournament.status = 'started';
            //save to db
            await tournament.save();
            console.log(`✅ Tournament "${tournament.tournamentName}" updated with matches.`);
        }
        
        console.log(`🎉 Tournament "${tournament.tournamentName}" created successfully!`);
        res.json({ tournament: tournament });

    } catch (error) {
        console.error('❌ [startTournament] Error:', error.message);
        res.status(500).json({ message: "Something went wrong in starting tournament", error: error });
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
        console.log(`📋 [FindAllTournaments] Retrieved ${Alltournaments.length} tournaments`);
        res.json(Alltournaments);
    } catch (err){
        console.error('❌ [FindAllTournaments] Error:', err.message);
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
            console.log(`❌ [FindOneTournament] Tournament not found: ${tournament}`);
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
        console.log(`📄 [FindOneTournament] Retrieved: "${tournament.tournamentName}"`);
        res.json( {oneTournament: tournament} );
    } catch (err){
        console.error('❌ [FindOneTournament] Error:', err.message);
        res.status(500).json({ message: "Something went wrong", error: err });
        
    }
}

//UPDATE or edit tournament
module.exports.updateTournament = (req, res) => {
    Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .populate('participants')
        .populate('matches')
        .then(updatedTournament => {
            console.log(`✅ [UpdateTournament] Updated: "${updatedTournament.tournamentName}"`);
            res.json({ tournament: updatedTournament });
        })
        .catch(err => {
            console.error(`❌ [UpdateTournament] Error:`, err.message);
            res.json({ message: "Something went wrong", error: err });
        });
}

//DELETE tournament
module.exports.deleteTournament = (req, res) => {
    Tournament.findByIdAndDelete(req.params.id)
        .then(result => {
            console.log(`🗑️ [DeleteTournament] Tournament deleted successfully`);
            res.json({ result: result });
        })
        .catch(err => {
            console.error(`❌ [DeleteTournament] Error:`, err.message);
            res.json({ message: "Something went wrong", error: err });
        });
}

//Conclude Group Stage
module.exports.concludeGroupStage = async (req, res) => {
    const tournamentId = req.params.id;
    console.log(`🏁 [ConcludeGroupStage] Starting for tournament: ${tournamentId}`);

    try {
        //1. Find and populate tournament data
        const tournament = await Tournament.findById(tournamentId)
        .populate('participants')
        .populate('matches');
        //validate tournament
            if (!tournament) {
                console.log(`❌ [ConcludeGroupStage] Tournament not found: ${tournamentId}`);
                return res.status(404).json({ message: "Tournament not found!" });
            }
            console.log("✅ Tournament found:", tournament._id);

            //Deep population of participants within groups
            await tournament.populate({
                path: 'groups.participants',
                select: 'participantName teamName points goalDifference goalsScored _id'
            });

            console.log(`✅ Found tournament: "${tournament.tournamentName}" with ${tournament.groups.length} groups`);
            
            //2. final recalculation of all participants stats
            await recalculateAllParticipantStats(tournament);
            await tournament.save();
            console.log(`📊 Final group stage stats recalculated`);

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

            // 🏆 Extract the top two participants from the sorted standings
            const groupWinner = tournament.participants.find(
                p => p._id.toString() === standings[0]._id.toString()
            );
            const groupRunnerUp = tournament.participants.find(
                p => p._id.toString() === standings[1]._id.toString()
            );

            console.log(`🏆 Group ${group.groupName} Results:`);
            console.log(`   Winner: ${groupWinner?.participantName} (${groupWinner?.teamName})`);
            console.log(`   Runner-up: ${groupRunnerUp?.participantName} (${groupRunnerUp?.teamName})`);
            
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
        // disable group stage matches
        tournament.groupStageConcluded = true;

        await tournament.save();
        console.log(`🎯 Group stage concluded with ${finalists.length} finalists advancing to knockout stage`);
        return res.json({ finalists: tournament.finalists });

    } catch (error) {
        console.error(`❌ [ConcludeGroupStage] Error:`, error.message);
        console.error(error.stack);
        res.status(500).json({ 
            message: "Something went wrong", 
            error: error.message 
        });
    }
};

//Create Knockout Matches
module.exports.createKnockoutMatches = async (req, res) => {
    /**
     * This function creates knockout matches based on the finalists from the concluded group stage.
     * 
     * It handles both scenarios: 
     * 1. When there is only one group, it creates a single grand final match.
     * 2. When there are multiple groups, it pairs the winners and runners-up from different groups
     * 
     * When there are multiple groups, it creates an empty match for each round 
     * that is linked to the matches from the previous round. This ensures that 
     * each winner has a designated match to flow into as the tournament progresses.
     * 
     * This is why I manually created IDs for matches so that they can be linked to future matches.
     * rounds (via `nextMatchId` and `nextSlotIndex`) can be defined before inserting them.
     * All matches are flattened and inserted into the database in one batch, and the 
     * tournament is updated with the full knockout match list.
     */
    const tournamentId = req.params.id;
    console.log(`🥊 [CreateKnockoutMatches] Starting for tournament: ${tournamentId}`);
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
            const groups = tournament.groups;
            const allKnockoutMatches = []
            let matchNumber = tournament.matches.length + 1; // Start match numbering from the last match number
            console.log("FINALIST Array called from createKnockoutMatches Controller:", finalists)

            // IF THERE IS ONLY ONE GROUP THEN A SINGLE FINAL MATCH WILL BE CREATED
            if( groups.length === 1){
                const [firstPlace, secondPlace] = finalists;
                console.log(`🏆 Creating Grand Final:`);
                console.log(`   ${firstPlace.participant.participantName} vs ${secondPlace.participant.participantName}`);

                //create a single knockout match for the final
                const grandFinalMatch = {
                    participants: [
                        { participantId: firstPlace.participant, score: 0},
                        { participantId: secondPlace.participant, score: 0 },
                    ],
                    matchNumber: matchNumber++,
                    stage: 'Final',
                    status: 'pending'
                };
                
                //insert the match into the db and save it to the tournament
                const [insertedMatch] = await Match.insertMany([grandFinalMatch]);
                tournament.matches.push(insertedMatch._id);
                await tournament.save();

                console.log("✅ Grand Final Match Created:", grandFinalMatch);
                return res.json({ message: "Grand Final Match Created", match: grandFinalMatch });

            //IF THERE ARE MULTIPLE GROUPS
            }else{
                //organize all finalist by their group and rank 1st or 2nd place
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
                    return groupedFinalists;
                }, {});

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

                // CREATE FIRST ROUND OF MATCHES 
                for( let i = 0; i < groupKeys.length; i+= 2){
                    // get the current groups first index and the next groups second index 
                    const group1 = groupKeys[i]; // ex "Group A:[x, ] group winner 
                    const group2 = groupKeys[i + 1]; // ex "Group B [ , x]: group runner up

                    const group1Finalists = finalistsByGroup[group1];
                    const group2Finalists = finalistsByGroup[group2];

                    //Manually create match IDs to link matches to matches in future rounds
                    const matchId1 = new mongoose.Types.ObjectId();
                    const matchId2 = new mongoose.Types.ObjectId();

                    // Validate that we have enough finalists from each group
                    if (!group1Finalists[0] || !group1Finalists[1] || !group2Finalists[0] || !group2Finalists[1]) {
                    console.log(`❌ Finalist data incomplete for groups ${group1} and ${group2}`);
                    return res.status(400).json({ message: "Finalist data is incomplete or unbalanced for knockout generation." });
                }

                    //CREATE KNOCKOUT MATCHES FOR EACH GROUP PAIR
                    const match1 = {
                        _id: matchId1,
                        participants: [
                            { participantId: group1Finalists[0].participant, score: 0 },
                            { participantId: group2Finalists[1].participant, score: 0 }
                        ],
                        matchNumber: matchNumber ++,
                        stage: getKnockoutStageName(0, totalRounds),
                        status: 'pending'
                    };

                    const match2 = {
                        _id: matchId2,
                        participants: [
                            { participantId: group2Finalists[0].participant, score: 0 },
                            { participantId: group1Finalists[1].participant, score: 0 }
                        ],
                        matchNumber: matchNumber++,
                        stage: getKnockoutStageName(0, totalRounds),
                        status: 'pending'
                    };

                    console.log(`⚔️ ${getKnockoutStageName(0, totalRounds)} Matches:`);
                    console.log(`   Match ${match1.matchNumber}: ${group1Finalists[0].participantName} vs ${group2Finalists[1].participantName}`);
                    console.log(`   Match ${match2.matchNumber}: ${group2Finalists[0].participantName} vs ${group1Finalists[1].participantName}`);

                    //push the matches to the KnockOutRounds array
                    knockOutRounds[0].push(match1, match2);
                }

                //GENERATE EMPTY MATCHES FOR NEXT ROUNDS BASED ON THE NUMBER OF MATCHES IN THE FIRST ROUND
                // Loop stops at length - 1 to prevent final round matches from getting nextMatchId
                for(let i = 0; i < knockOutRounds.length - 1; i++){
                    const currentRound = knockOutRounds[i];
                    const nextRound = knockOutRounds[i + 1];

                    //inner loop to create matches for next round
                    for(let j = 0; j < currentRound.length; j+=2){
                        let match1 = currentRound[j];
                        let match2 = currentRound[j + 1];
                       
                        // Id for next round match
                        const nextMatchId = new mongoose.Types.ObjectId();

                        const nextMatch = {
                            _id: nextMatchId,
                            participants: [
                                { participantId:null, score: 0 },
                                { participantId:null, score: 0 }
                            ],
                            matchNumber: matchNumber++,
                            stage: getKnockoutStageName(i + 1, totalRounds),
                            status: 'pending'
                        };
                        //push the next match to the next round of knockout matches
                        nextRound.push(nextMatch);

                        //link the current matches to the next match
                        //(Finals will not have these fields)
                        match1.nextMatchId = nextMatchId;
                        match1.nextSlotIndex = 0;

                        match2.nextMatchId = nextMatchId;
                        match2.nextSlotIndex = 1;
                        console.log(`🔗 Match ${match1.matchNumber} & ${match2.matchNumber} winners advance to ${nextMatch.stageName} (Match ${nextMatch.matchNumber})`);

                        //if the current round is the semi finals then create a 3rd place match
                        if(i === knockOutRounds.length - 2){
                            const thirdPlaceMatchId = new mongoose.Types.ObjectId();

                            const thirdPlaceMatch = {
                                _id: thirdPlaceMatchId,
                                participants: [
                                    { participantId: null, score: 0 },
                                    { participantId: null, score: 0 }
                                ],
                                matchNumber: matchNumber++,
                                stage:'thirdPlaceMatch',
                                status: 'pending',
                            };
                            nextRound.push(thirdPlaceMatch);

                            //link the current matches to the third place match
                            match1.thirdPlaceMatchId = thirdPlaceMatchId;
                            match1.thirdPlaceSlotIndex = 0;

                            match2.thirdPlaceMatchId = thirdPlaceMatchId;
                            match2.thirdPlaceSlotIndex = 1;
                            console.log(`🔗 Match ${match1.matchNumber} & ${match2.matchNumber} losers advance to third place match (Match ${thirdPlaceMatch.matchNumber})`);
                        }

                    }
                }
                //INSERT ALL KNOCKOUT MATCHES INTO THE DB
                const allMatchesToInsert = knockOutRounds.flat();
                const insertedMatches = await Match.insertMany(allMatchesToInsert);
                const matchIds = insertedMatches.map(match => match._id);
                console.log(`💾 Inserted ${insertedMatches.length} knockout matches into database`);

                // Populate participantId with participantName and teamName
                await Match.populate(insertedMatches, {
                path: 'participants.participantId',
                select: 'participantName teamName'
                });

                console.log("✅ Knockout Stage Created Successfully:");
                //get participant name or default to "TBD"
                const getName = (p) => p?.participantId?.participantName || "TBD";

                insertedMatches.forEach(match => {
                const [p1, p2] = match.participants;
                console.log(`- Match ${match.matchNumber}: ${getName(p1)} vs  ${getName(p2)}| Stage: ${match.stage}`);
                console.log(`  Next Match ID: ${match.nextMatchId || 'None'}`);
                console.log(`  Next Slot Index: ${match.nextSlotIndex ?? 'None'}`);
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
            console.log(`❌ [LoadTournamentData] Tournament not found: ${tournamentId}`);
            return res.status(404).json({ message: "Tournament not found!" });
        }

        console.log(`📊 [LoadTournamentData] Loaded: "${tournament.tournamentName}"`);
        res.json({ tournament });
    } catch (err) {
        console.error(`❌ [LoadTournamentData] Error:`, err.message);
        res.status(500).json({ message: "Something went wrong while loading tournament data.", error: err.message });
    }
}



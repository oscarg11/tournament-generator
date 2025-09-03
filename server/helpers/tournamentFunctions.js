//SHUFFLE PLAYERS FUNCTION
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--){
        //generate random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        //then swap random index (j) with current index (i)
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

//CREATE GROUPS
const createGroups = (participantIds) => {
    let groups = [];
    // if there are exatcly 4 participants, create one group
    if (participantIds.length === 4) {
        groups.push({
            groupName: "A",
            participants: participantIds
        });
    } else {
        // if there are more than 4 participants, create multiple groups of 4
        const groupCount = participantIds.length / 4;
        for (let i = 0; i < groupCount; i++) {
            // use slice to get 4 participants at a time
            groups.push({
                groupName: String.fromCharCode(65 + i),
                participants: participantIds.slice(i * 4, (i + 1) * 4)
            });
        }
    }
    return groups;
};

// GENERATE MATCHES BY PAIRING PARTICIPANTS IN EACH GROUP FOR MULTIPLE ROUNDS
const createGroupStageMatches = (groups, numberOfGroupStageLegs) => {
    console.log("Generating group stage matches...");

    if (!groups || groups.length === 0) {
        console.warn("Groups data is undefined or empty. Cannot generate matches.");
        return [];
    }

    let allRounds = []; // This will hold rounds (each round is an array of matches)
    let allMatches = []; // This will store all matches in a single list (for saving to MongoDB)
    let matchCount = 1; // Counter for match numbers

    groups.forEach((group) => {
        if (!group.participants || group.participants.length === 0) {
            console.warn(`No participants in group ${group.groupName}`);
            return;
        }

        const numOfParticipants = group.participants.length;
        const totalRounds = numberOfGroupStageLegs * (numOfParticipants - 1);
        const rounds = Array.from({ length: totalRounds }, () => []); // Initialize rounds

        let rotatedParticipants = [...group.participants];
        
        for (let leg = 1; leg <= numberOfGroupStageLegs; leg++) {
            for (let round = 0; round < numOfParticipants - 1; round++) {
                for (let i = 0; i < Math.floor(numOfParticipants / 2); i++) {
                    // rotate participants for unique matchups
                    const participant1 = rotatedParticipants[i];
                    const participant2 = rotatedParticipants[rotatedParticipants.length - 1 - i];

                    if (!participant1 || !participant2) {
                        console.error("Undefined participant detected:", { participant1, participant2 });
                        continue;
                    }
                    // create new match object
                    const match = {
                        participants: [
                            { participantId: participant1, score: 0 },
                            { participantId: participant2, score: 0 },
                        ],
                        matchNumber: matchCount++, // Unique match number
                        group: group.groupName,
                        round, // The round number
                        stage: 'group'
                    };

                    rounds[round].push(match);
                    allMatches.push(match); // Add to the global matches array
                }

                // Rotate participants for the next round
                rotatedParticipants = [
                    rotatedParticipants[0],
                    ...rotatedParticipants.slice(-1),
                    ...rotatedParticipants.slice(1, -1),
                ];
            }
        }
        allRounds.push(rounds); // Push rounds into allRounds array
    });
    return { allRounds, allMatches }; // ✅ Return both rounds and a flat list of matches
};



    //DETERMIN GROUP MATCH RESULT
const determineGroupMatchResult = (participant1, participant2, score,match) => {
        const POINTS_PER_WIN = 3;
        const POINTS_PER_DRAW = 1;
        const POINTS_PER_LOSS = 0;

            //participant 1 wins
            if(score.participant1 > score.participant2){
                participant1.matchesPlayed += 1;
                participant1.wins += 1;
                participant1.goalsScored += score.participant1;
                participant1.goalsAgainst += score.participant2;
                participant1.goalDifference = participant1.goalsScored - participant1.goalsAgainst;
                participant1.points += POINTS_PER_WIN;
                participant1.matchHistory.push("W")
    
                participant2.matchesPlayed += 1;
                participant2.losses += 1;
                participant2.goalsScored += score.participant2;
                participant2.goalsAgainst += score.participant1;
                participant2.goalDifference = participant2.goalsScored - participant2.goalsAgainst;
                participant2.points += POINTS_PER_LOSS;
                participant2.matchHistory.push("L")
            
            //participant 2 wins
            } else if(score.participant1 < score.participant2){
                participant2.matchesPlayed += 1;
                participant2.wins += 1;
                participant2.goalsScored += score.participant2;
                participant2.goalsAgainst += score.participant1;
                participant2.goalDifference = participant2.goalsScored - participant2.goalsAgainst;
                participant2.points += POINTS_PER_WIN;
                participant2.matchHistory.push("W")
    
                participant1.matchesPlayed += 1;
                participant1.losses += 1;
                participant1.goalsScored += score.participant1;
                participant1.goalsAgainst += score.participant2;
                participant1.goalDifference = participant1.goalsScored - participant1.goalsAgainst;
                participant1.points += POINTS_PER_LOSS;
                participant1.matchHistory.push("L")
    
            //draw
            }else{
                participant1.matchesPlayed += 1;
                participant1.draws += 1;
                participant1.goalsScored += score.participant1;
                participant1.goalsAgainst += score.participant2;
                participant1.goalDifference = participant1.goalsScored - participant1.goalsAgainst;
                participant1.points += POINTS_PER_DRAW;
                participant1.matchHistory.push("D")
    
                participant2.matchesPlayed += 1;
                participant2.draws += 1;
                participant2.goalsScored += score.participant2;
                participant2.goalsAgainst += score.participant1;
                participant2.goalDifference = participant2.goalsScored - participant2.goalsAgainst;
                participant2.points += POINTS_PER_DRAW;
                participant2.matchHistory.push("D")

            }
            
            return {participant1, participant2}
    
}

// SORT GROUP STANDINGS
const sortGroupStandings = (participantA,participantB, matches) => {
    // if points are not equal, sort by points
if(participantB.points !== participantA.points){
    return participantB.points - participantA.points;
} 
if(participantB.goalDifference !== participantA.goalDifference){
    return participantB.goalDifference - participantA.goalDifference;
} 

if(participantB.goalsScored !== participantA.goalsScored){
    return participantB.goalsScored - participantA.goalsScored;
} 
// If still tied, use head-to-head comparison
return headToHeadComparison(participantA, participantB, matches);
}


//HEAD TO HEAD COMPARISON - THIS FUNCTION IS CALLED BY THE SORT FUNCTION
// TO DETERMINE THE FINAL TIE BREAKER
const headToHeadComparison = (participantA, participantB, matches) => {
// Check if there are any matches to compare
if(!Array.isArray(matches) || matches.length === 0){
    console.warn("No matches have been played yet");
    return 0;
}

// Filter in matches between the two participants
const filterHeadToHeadMatches = matches.filter(match => {
    console.log("🏷️ Head-to-Head Participants:", match.participants);

    // Now, match.participants are just IDs—no need to map `.participantId`
    return match.participants.includes(participantA.toString()) 
    && match.participants.includes(participantB.toString());
});

// Initialize stats for both participants
let statsA = { points: 0, goalsScored: 0, goalDifference: 0};
let statsB = { points: 0, goalsScored: 0, goalDifference: 0};

//loop through head to head matches
for(const match of filterHeadToHeadMatches) {
    const [p1, p2] = match.participants;

    // convert participantId to string for comparison
    // This is to ensure we are comparing the correct participants
    const p1Id = p1
    const p2Id = p2
    const aId = participantA._id.toString();
    
    const bId = participantB._id.toString();

    let aScore, bScore;

    //find the scores for each participant
    const participant1 = match.participants.find(p => p._id.toString() === p1Id);
    const participant2 = match.participants.find(p => p._id.toString() === p2Id);

    if (!participant1 || !participant2) {
        console.error("❌ Participant not found for head-to-head comparison.");
        continue;
    }

    // match participants to the correct ids
    if(p1Id === aId && p2Id === bId){
    aScore = p1.score;
    bScore = p2.score;
    }else if(p1Id === bId && p2Id === aId){
    aScore = p2.score;
    bScore = p1.score;
    }else{
    continue;
    }

    console.log(`🏷️ Head-to-Head: ${participant1.participantName} vs ${participant2.participantName} - ${aScore}:${bScore}`);

    // Update stats based on match result
    if(aScore > bScore){
    statsA.points += 3;
    } else if(aScore < bScore){
    statsB.points += 3;
    } else {
    statsA.points += 1;
    statsB.points += 1;
    }

    // Update goals scored and goal difference
    statsA.goalsScored += aScore;
    statsB.goalsScored += bScore;

    statsA.goalDifference += aScore - bScore;
    statsB.goalDifference += bScore - aScore;
}

    // Update stats
    if(statsA.points !== statsB.points){
    return statsB.points - statsA.points;
    }
    if(statsA.goalDifference !== statsB.goalDifference){
    return statsB.goalDifference - statsA.goalDifference;
    }
    if(statsA.goalsScored !== statsB.goalsScored){
    return statsB.goalsScored - statsA.goalsScored;
    }

    return 0; //still tied
};

// WRAPPER FUNCTION TO GET SORTED LIST OF GROUP STANDINGS
const getSortedGroupStandings = (participants, matches) => {
    return participants.sort((a, b) => sortGroupStandings(a, b, matches));
};

/**
 * Recalculate all participant stats by clearing existing stats and 
 * and re-applyhing every completed match's results
 * 
 * This avoids the complexity and risk of manually undoing one match at a time.
 * 
 * When a match's score is reset all stats are wiped, and then re-built
 * from the completed match results to ensure total accuracy.
 * 
 * only matches with status === 'completed' are used to recalculate stats.
 * 
 */
const recalculateAllParticipantStats = async (tournament) => {
    const updatedParticipants = new Map();

    //reset all participant stats to zero
    for(const p of tournament.participants){
        p.points = 0;
        p.wins =0;
        p.losses = 0;
        p.draws = 0;
        p.goalsScored = 0;
        p.goalsAgainst = 0;
        p.goalDifference =0;
        p.matchesPlayed = 0;
        p.matchHistory = [];
    }

    //re-apply match results from completed matches
    for(const match of tournament.matches){
        //skip matches that havent been played yet
        if(match.status !== 'completed') continue;

        //get two participants from this match
        const [p1, p2] = match.participants;
        const participant1 = tournament.participants.find(
            p => p._id.toString() === p1.participantId.toString()
        );
        const participant2 = tournament.participants.find(
            p => p._id.toString() === p2.participantId.toString()
        );

        //Re-apply this match's results using the stat logic
        if(participant1 && participant2){
            determineGroupMatchResult(participant1, participant2, {
                participant1: p1.score,
                participant2: p2.score
            }, match);
        }
        //add each participant to the updatedParticipants map using their _id
        //to ensure each participant is only saved once
        updatedParticipants.set(participant1._id.toString(), participant1);
        updatedParticipants.set(participant2._id.toString(), participant2);

    }
    //save each updated participant to the db
    //using map.values() ensures each participant is only saved once in case they aopeared in multiple matches
    for(const participant of updatedParticipants.values()){
        await participant.save();
    }
    console.log("( recalculateAllParticipantStats )Match results up to date for all participants!");
}

//determine what stage of finals the tournament is in
const getKnockoutStageName = (roundIndex, totalRounds) => {
    const stageNames = [
        'group',
        'roundOfSixteen',
        'quarterFinals',
        'semiFinals',
        'Final'
    ];
    const offSet = stageNames.length - totalRounds;
    return stageNames[roundIndex + offSet]
}

//Determine Kockout stage match result
const determineKnockoutMatchResult = (participant1, participant2, score, match, knockoutMatchTieBreaker = {}
    ) => {

    console.log("🔵 ENTERING DETERMINEKNOCKOUTMATCHRESULT:");

    match.knockoutMatchTieBreaker = knockoutMatchTieBreaker;
    //if participant 1 wins
    if(score.participant1 > score.participant2){
        console.log(`🏆 ${participant1.participantName} wins ${score.participant1}-${score.participant2}`);
        participant1.matchesPlayed += 1;
        participant1.wins += 1;
        participant1.goalsScored += score.participant1;
        participant1.goalsAgainst += score.participant2;
        participant1.matchHistory.push("W");
        match.winner = participant1._id;

        participant2.matchesPlayed += 1;
        participant2.losses += 1;
        participant2.goalsScored += score.participant2;
        participant2.goalsAgainst += score.participant1;
        participant2.matchHistory.push("L")

    }
    //if participant 2 wins
    else if(score.participant2 > score.participant1){
        console.log(`🏆 ${participant2.participantName} wins ${score.participant2}-${score.participant1}`);
        participant2.matchesPlayed += 1;
        participant2.wins += 1;
        participant2.goalsScored += score.participant2;
        participant2.goalsAgainst += score.participant1;
        participant2.matchHistory.push("W");
        match.winner = participant2._id;

        participant1.matchesPlayed += 1;
        participant1.losses += 1;
        participant1.goalsScored += score.participant1;
        participant1.goalsAgainst += score.participant2;
        participant1.matchHistory.push("L")

    // if its a draw, call knockout match tie breaker
    }else{
        console.log(`⚖️  Match tied ${score.participant1}-${score.participant2}`);
        participant1.matchesPlayed += 1;
        participant1.goalsScored += score.participant1;
        participant1.goalsAgainst += score.participant2;

        participant2.matchesPlayed += 1;
        participant2.goalsScored += score.participant2;
        participant2.goalsAgainst += score.participant1;

        //If match is still a draw call knockoutMatchTieBreaker function
        console.log("🟡 IN DRAW SECTION, about to call knockoutMatchTieBreaking:");

        //call knockoutMatchTieBreaking function
        const tieBreakerWinner = knockoutMatchTieBreaking({
            participant1,
            participant2,
            score,
            match,
            knockoutMatchTieBreaker
        });

        // If no winner is declared, throw an error
        if (!tieBreakerWinner) {
        throw new Error("Match is a draw and no tiebreaker winner was declared.");
    }
        //If participant 1 wins
        if(tieBreakerWinner._id.toString() === participant1._id.toString()){
            participant1.wins += 1;
            participant1.matchHistory.push("W");

            participant2.losses += 1;
            participant2.matchHistory.push("L");
        }else{
            //If participant 2 wins
            participant2.wins += 1;
            participant2.matchHistory.push("W");

            participant1.losses += 1;
            participant1.matchHistory.push("L");
        }
        match.winner = tieBreakerWinner._id; // Set the winner of the match
    }
    return{ participant1, participant2, match}
}

// Tie-breaking logic for knockout matches
const knockoutMatchTieBreaking = ({ participant1, participant2, score, knockoutMatchTieBreaker }) => {
    console.log("🔍 knockoutMatchTieBreaking called");
    const method = knockoutMatchTieBreaker?.method;
    const winnerId = knockoutMatchTieBreaker?.winner;

    console.log(`🎯 Tiebreaker selected: ${method}`);

    //check if there is a method selected first
    if(!method) return null;

    //For extra time and golden goal, determine winner based on scores
    if(['goldenGoal', 'extraTime'].includes(method)){
        //if participant 1 wins
        if(score.participant1 > score.participant2){
            console.log(`🏆 ${participant1.participantName} wins via ${method}`);
            return participant1;
        }
        //if participant 2 wins
        if(score.participant2 > score.participant1) {
            console.log(`🏆 ${participant2.participantName} wins via ${method}`);
            return participant2;
        }
        return null; //still a draw
    }

    //For manually declared winners( penalty shootout, coin toss, rock-paper-scissors)
    if(['penaltyShootout', 'coinToss', 'rockPaperScissors'].includes(method)){
        //participant 1
        if( winnerId == participant1._id.toString()){
            console.log(`🏆 ${participant1.participantName} wins via ${method}`);
            return participant1;
        }
        //participant 2
        if( winnerId == participant2._id.toString()) {
            console.log(`🏆 ${participant2.participantName} wins via ${method}`);
            return participant2;
        }
        return null;
    }
}

//Advance Winner into the next match
const advanceWinnerIntoNextMatch = (currentMatch, tournament) => {
    //extract match data from current match
    const {winner, nextMatchId, nextSlotIndex} = currentMatch;
    
    //Check if match is a Final
    if(!currentMatch.nextMatchId) return null; //no next match, so its a final

    //check if there is a winner yet.
    if(!winner) return false;

    //find the next match in the tournament
    const nextMatch = tournament.matches.find(match => 
        match._id.toString() === nextMatchId.toString()
    );

    //validate that next match exists
    if(!nextMatch) return false;

    //update winner to the next matches available slot
    nextMatch.participants[nextSlotIndex].participantId = winner;
    return nextMatch;

}

module.exports = {
    createGroups,
    shuffle,
    createGroupStageMatches,
    determineGroupMatchResult,
    sortGroupStandings,
    headToHeadComparison,
    getSortedGroupStandings,
    recalculateAllParticipantStats,
    getKnockoutStageName,
    determineKnockoutMatchResult,
    knockoutMatchTieBreaking,
    advanceWinnerIntoNextMatch
}
//SHUFFLE PLAYERS FUNCTION
const shuffle = (array) => {
    console.log("Before Shuffling array:", array);
    for (let i = array.length - 1; i > 0; i--){
        //generate random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        //then swap random index (j) with current index (i)
        [array[i], array[j]] = [array[j], array[i]];
    }
    console.log("After Shuffling array:", array);
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
    console.log("CREATEGROUPS FUNCTION OUTPUT:", groups);
    return groups;
};

// Generate matches by pairing participants in each group for multiple rounds
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
                    const participant1 = rotatedParticipants[i];
                    const participant2 = rotatedParticipants[rotatedParticipants.length - 1 - i];

                    if (!participant1 || !participant2) {
                        console.error("Undefined participant detected:", { participant1, participant2 });
                        continue;
                    }

                    const match = {
                        participants: [
                            { participantId: participant1, score: 0 },
                            { participantId: participant2, score: 0 },
                        ],
                        matchNumber: matchCount++, // Unique match number
                        group: group.groupName,
                        round, // The round number
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

    console.log("Final Nested Rounds (Matches):", JSON.stringify(allRounds, null, 2));
    console.log("All Matches (Flat List for Saving):", JSON.stringify(allMatches, null, 2));

    return { allRounds, allMatches }; // ✅ Return both rounds and a flat list of matches
};



    //determin Group match result
const determineGroupMatchResult = (participant1, participant2, score,match) => {
        const POINTS_PER_WIN = 3;
        const POINTS_PER_DRAW = 1;
        const POINTS_PER_LOSS = 0;

        console.log("Before Match updates");
       // console.log("Participant1", participant1);
        //console.log("Participant2", participant2);
        console.log("Received Score Object:", score);
    console.log("Participant 1 Score:", score.participant1);
    console.log("Participant 2 Score:", score.participant2);
        console.log("Participant 1 - Goals Scored:", participant1.goalsScored, "Goals Against:", participant1.goalsAgainst);
            console.log("Participant 2 - Goals Scored:", participant2.goalsScored, "Goals Against:", participant2.goalsAgainst);
        
        // check if match is already completed
        console.log("Match status BEFORE check:", match.status);
        // 
        if(match.status === 'pending'){

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

                match.status = 'completed'; // Update match status to completed
            
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

                match.status = 'completed'; // Update match status to completed
    
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

                match.status = 'completed'; // Update match status to completed
            }
    
            console.log("After Update:");
            console.log("Participant 1 - Goals Scored:", participant1.goalsScored, "Goals Against:", participant1.goalsAgainst, "Goal Difference:", participant1.goalDifference);
            console.log("Participant 2 - Goals Scored:", participant2.goalsScored, "Goals Against:", participant2.goalsAgainst, "Goal Difference:", participant2.goalDifference);
            
            return {participant1, participant2}
        }
}



module.exports = {
    createGroups,
    shuffle,
    createGroupStageMatches,
    determineGroupMatchResult
}
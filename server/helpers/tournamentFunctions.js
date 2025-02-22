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
    console.log("Groups Input in createGroupStageMatches:", JSON.stringify(groups, null, 2));
    console.log("Number of Group Stage Legs:", numberOfGroupStageLegs);

    if (!groups || groups.length === 0) {
        console.warn("Groups data is undefined or empty. Cannot generate matches.");
        return [];
    }
    let allRounds = [];

    const matches = allRounds.flat(); // Ensure matches is a flat array

    let matchCount = 1;


    groups.forEach((group) => {
        console.log(`Processing Group ${group.groupName}`);
        if (!group.participants || group.participants.length === 0) {
            console.warn(`No participants in group ${group.groupName}`);
            return;
        }
        const numOfParticipants = group.participants.length;
        const totalRounds = numberOfGroupStageLegs * (numOfParticipants - 1); // Total matches = (n-1) * legs
        console.log(`Total Rounds for Group ${group.groupName}:`, totalRounds);
        const rounds = Array.from({ length: totalRounds }, () => []); // Initialize rounds for the group
        console.log(`Initialized Rounds for Group ${group.groupName}:`, JSON.stringify(rounds, null, 2));

        let rotatedParticipants = [...group.participants];
        console.log(`Initial Participants for Group ${group.groupName}:`, rotatedParticipants);

        for (let leg = 1; leg <= numberOfGroupStageLegs; leg++) {
            for (let round = 0; round < numOfParticipants - 1; round++) {
                console.log(`Creating Matches for Round ${round}, Leg ${leg}`);
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
                        matchNumber: matchCount++,
                        group: group.groupName,
                        round,
                    };

                     // Validate match
                     matches.forEach((match) => {
                        if (!match.round || !match.matchNumber) {
                            console.error("Invalid match detected before saving:", match);
                        }
                    });
                    

                    console.log("Created Match:", match);
                    rounds[round].push(match);

                }

                // Rotate participants
                console.log(`Before Rotation (Round ${round}):`, JSON.stringify(rotatedParticipants));
                rotatedParticipants = [
                    rotatedParticipants[0],
                    ...rotatedParticipants.slice(-1),
                    ...rotatedParticipants.slice(1, -1),
                ];
                console.log(`After Rotation (Round ${round}):`, JSON.stringify(rotatedParticipants));
            }
        }
        console.log(`Final Rounds for Group ${group.groupName}:`, JSON.stringify(rounds, null, 2));
        allRounds.push(...rounds); // Add group rounds to global rounds
    });


    console.log("Flattened Matches:", matches);

    matches.forEach((match, index) => {
        if (!match.round && match.round !== 0) {
            console.error(`Match at index ${index} is missing 'round':`, match);
        }
        if (!match.matchNumber) {
            console.error(`Match at index ${index} is missing 'matchNumber':`, match);
        }
    });

    console.log("Matches Ready for Saving:", JSON.stringify(matches, null, 2));
    return matches; // Or save the matches directly here
};





    //determin match result
const determineMatchResult = (participant1, participant2, score,match) => {
        const POINTS_PER_WIN = 3;
        const POINTS_PER_DRAW = 1;
        const POINTS_PER_LOSS = 0;

        console.log("Match structure:", match);


        //scores before the match
        console.log("Score before match", participant1, participant2);
        console.log("Participant1", participant1.scores);
        console.log("Participant2", score.participant2);

        if(score.partcipant1 > score.participant2){
            participant1.points += POINTS_PER_WIN;
            participant1.wins += 1;
            participant2.losses += 1;
            participant2.points += POINTS_PER_LOSS;

            participant1.matchHistory.push("W")
            participant2.matchHistory.push("L")
        } else if(score.participant1 < score.participant2){
            participant2.points += POINTS_PER_WIN;
            participant2.wins += 1;
            participant1.losses += 1;
            participant1.points += POINTS_PER_LOSS;

            participant1.matchHistory.push("L")
            participant2.matchHistory.push("W")
        }else{
            participant1.points += POINTS_PER_DRAW;
            participant2.points += POINTS_PER_DRAW;
            participant1.draws += 1;
            participant2.draws += 1;

            participant1.matchHistory.push("D")
            participant2.matchHistory.push("D")
        }
        // score after the match
        console.log("Score after match", participant1, participant2);
        console.log("Participant1", score.participant1);
        console.log("Participant2", score.participant2);
        return {participant1, participant2}
}



module.exports = {
    createGroups,
    shuffle,
    createGroupStageMatches,
    determineMatchResult
}
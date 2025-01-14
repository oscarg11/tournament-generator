import axios from "axios";


export const loadTournamentData = async (tournamentId) => {
  try {
    const response = await axios.get(`http://localhost:8000/api/dashboard/${tournamentId}`);
    return response.data.oneTournament;  // Replace `oneTournament` if your API returns something different
  } catch (err) {
    console.error("Error loading tournament data:", err);
    throw err;
  }
};

//SHUFFLE PLAYERS FUNCTION
export const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--){
        //generate random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        //then swap random index (j) with current index (i)
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//CREATE GROUPS
export const createGroups = (participants) => {
    let groups = [];

    // if there are exatcly 4 participants, create one group
    if (participants.length === 4) {
        groups.push({
            groupName: "A",
            participants: participants
        });
    } else {
        // if there are more than 4 participants, create multiple groups of 4
        const groupCount = participants.length / 4;
        for (let i = 0; i < groupCount; i++) {
            // use slice to get 4 participants at a time
            groups.push({
                groupName: String.fromCharCode(65 + i),
                participants: participants.slice(i * 4, (i + 1) * 4)
            });
        }
    }
    console.log("Groups", groups);
    return groups;
};

// Generate matches by pairing participants in each group for multiple rounds
export const createGroupStageMatches = (groups, numberOfGroupStageLegs) => {
        if (!groups || groups.length === 0) {
        console.warn("Groups data is undefined or empty. Cannot generate matches.");
        return []; // Return an empty array if groups are invalid
        }

        let rounds = [];
        //loop through each group
        groups.forEach((group, groupIndex) => {
        console.log("Current group participants:", group);
        const numOfParticipants = group.length;
        const totalRounds = numberOfGroupStageLegs === 1
        ? numOfParticipants - 1
        : 2 * (numOfParticipants - 1);  //if there are 2 legs, then the total number of rounds will be 2 * (numOfParticipants - 1)
        
        //create empty arrays for each round
        for(let i = 0; i <totalRounds; i++){
        rounds.push([])
        }
        let roundIndex = 0;
        
        //loop through each leg of the group stage
        for(let leg = 1; leg <= numberOfGroupStageLegs; leg++) {
        for( let round = 0; round < numOfParticipants -1; round++){ //loop through each participant in the group
            // pair players for the current round
            for(let i =0; i < group.length / 2; i++){
                const participant1 = group[i]._id; //get participants by id
                const participant2 = group[group.length - 1 - i]._id; 
        
            //match object
            const match = {
                participants: [
                { participantId: participant1, score: 0},
                { participantId: participant2, score: 0}
                ],
                matchNumber: `${i}-${group.length - 1}`,
                group: groups.groupName,
                round: roundIndex,
            }
            //assign the match to the correct round
            rounds[roundIndex % totalRounds].push(match);
            }
            //increment the round index to move to the next round
            roundIndex++;
        
            //rotate the participants in the group array
            group.splice(1, 0, group.pop());
        }
        }
        });
        console.log("Groups in current Tournament:", groups);
        console.log("number of rounds", rounds)
        return rounds;
        }



    //determin match result
    export const determineMatchResult = (participant1, participant2, score,match) => {
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

//save matches to the database
export const saveMatches = async (tournamentId, matches) => {
    try {
        const response = await axios.post(
            `http://localhost:8000/api/tournaments/${tournamentId}/save-matches`,
            { matches }
        );
        console.log("Matches saved successfully", response.data);
        return response.data;
    } catch (err) {
        console.error("Error saving matches:", err);
        throw err;
    }
};

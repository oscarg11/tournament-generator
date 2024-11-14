import React, {useState, useEffect} from 'react'
import axios from 'axios'

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;
const POINTS_PER_LOSS = 0;

const GroupMatches = ({tournamentData, setTournamentData}) => {
    const [matchData, setMatchData] = useState([]);

let lastGroup = ''; //keep track of the last group to compare with the current group

 //SHUFFLE PLAYERS FUNCTION
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--){
        //generate random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        //then swap random index (j) with current index (i)
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//CREATE GROUPS
const createGroups = (participants) => {
    let groups = [];
    // if there are exatcly 4 participants, create one group
    if (participants.length === 4){
      groups.push(participants);
    }else{
      // if there are more than 4 participants, create multiple groups of 4
      const groupCount = participants.length / 4;
      for (let i = 0; i < groupCount; i++){
        // use slice to get 4 participants at a timeå
        groups.push(participants.slice(i * 4, (i + 1) * 4));
      }
    }
    console.log(groups, "Groups")
    return groups;
}


// UPDATE SCORES
const handleScoreUpdate = async (tournamentId, roundIndex, matchIndex, participant1Score, participant2Score) => {
  try {
    // Update the backend with the new scores
    await axios.put(`/api/tournaments/${tournamentId}/matches/${roundIndex}/${matchIndex}`, {
      participant1Score,
      participant2Score,
    });
    console.log("Scores updated successfully!");

    //Update local state to reflect changes immediately
    const updatedMatchData = [...matchData];
    const match = updatedMatchData[roundIndex][matchIndex];
    match.scores.participant1Score = participant1Score;
    match.scores.participant2Score = participant2Score;

    // Updating participant statistics in `tournamentData.groups`
    const updatedGroups = [...tournamentData.groups];
    const participant1 = updatedGroups[match.group.charCodeAt(0) - 65].find(
      (participant) => participant.participantName === match.participant1.participantName
    );
    const participant2 = updatedGroups[match.group.charCodeAt(0) - 65].find(
      (participant) => participant.participantName === match.participant2.participantName
    );

    if (participant1 && participant2) {
      // Update participant statistics
      participant1.matchesPlayed += 1;
      participant2.matchesPlayed += 1;

      participant1.goalsScored += participant1Score;
      participant2.goalsScored += participant2Score;

      participant1.goalsAgainst += participant2Score;
      participant2.goalsAgainst += participant1Score;

      participant1.goalDifference = participant1.goalsScored - participant1.goalsAgainst;
      participant2.goalDifference = participant2.goalsScored - participant2.goalsAgainst;

      // Update points based on scores
      if (participant1Score > participant2Score) {
        participant1.points += POINTS_PER_WIN;
        participant2.points += POINTS_PER_LOSS;
      } else if (participant1Score < participant2Score) {
        participant1.points += POINTS_PER_LOSS;
        participant2.points += POINTS_PER_WIN;
      } else {
        participant1.points += POINTS_PER_DRAW;
        participant2.points += POINTS_PER_DRAW;
      }
    }

    // Step 3: Update state with new matches and participants
    setMatchData(updatedMatchData);
    setTournamentData((prevData) => ({
      ...prevData,
      groups: updatedGroups,
    }));
  } catch (error) {
    console.error("Error updating scores:", error);
  }
};


//generate matches
useEffect(() => {
  // Generate matches by pairing participants in each group for multiple rounds
  const createGroupStageMatches = (groups) => {
    if (!groups || groups.length === 0) {
      console.warn("Groups data is undefined or empty. Cannot generate matches.");
      return []; // Return an empty array if groups are invalid
    }

    let rounds = [];
    //loop through each group
    groups.forEach((group, groupIndex) => {
    console.log("Current group participants:", group);
    const numOfParticipants = group.length;
    const totalRounds = tournamentData.numberOfGroupStageLegs === 1
    ? numOfParticipants - 1
    : 2 * (numOfParticipants - 1);  //if there are 2 legs, then the total number of rounds will be 2 * (numOfParticipants - 1)
    
    //create empty arrays for each round
    for(let i = 0; i <totalRounds; i++){
      rounds.push([])
    }
    let roundIndex = 0;
    
    //loop through each leg of the group stage
    for(let leg = 1; leg <= tournamentData.numberOfGroupStageLegs; leg++) {
      for( let round = 0; round < numOfParticipants -1; round++){ //loop through each participant in the group
          // pair players for the current round
          for(let i =0; i < group.length / 2; i++){
            const participant1 = group[i];
            const participant2 = group[group.length - 1 - i]; //pair players from opposite ends of the array
    
          //match object
          const match = {
            participant1: participant1,
            participant2: participant2,
            scores: { participant1Score: 0, participant2Score: 0},
            matchNumber: `${i}-${group.length - 1}`,
            group: String.fromCharCode(65 + groupIndex)
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
    console.log("matches generated", rounds)
    return rounds;
    }

   // Shuffle participants, create groups, and generate matches
    console.log(`Creating matches for groups ${tournamentData.groups}`);
    if (tournamentData.participants && tournamentData.participants.length > 0){
      //shuffle participants in each group
      const shuffledParticipants = [...tournamentData.participants];
      shuffle(shuffledParticipants);
      //create groups
      const groups = createGroups(shuffledParticipants);
      //generate matches

      if (groups && groups.length > 0){
        const generatedMatches = createGroupStageMatches(groups);
        console.log(generatedMatches, "Generated Matches")
        setMatchData(generatedMatches);
     //set groups in tournamentData if needed for display or other components
    setTournamentData((prevData) => ({
      ...prevData, // Spread in the current state to keep existing properties
      groups: groups,  // Set `groups` to the newly created `groups`
    }));
  }
}
}, [
  tournamentData.numberOfGroupStageLegs,
  tournamentData.participants,
]);


return (
    <div>
        <form>
            <h2>Matches</h2>
            {matchData.map((round, roundIndex) => (
                <div key={roundIndex} className='mb-5'>
                    <h3>{`Round ${roundIndex + 1}`}</h3>  {/* Display round number */}
                    
                    {round.map((match, matchIndex) => {
                        const showGroupHeading = match.group !== lastGroup; // Display group heading only if it's a new group
                        lastGroup = match.group;  // Update lastGroup to the current match's group

                        return (
                            <div key={matchIndex} className='mb-3'>
                                {showGroupHeading && (
                                    <h4>{`Group ${match.group}`}</h4>  // Display group heading only once
                                )}
                                <div className='row'>
                                    <p className='col-6'>
                                        {match.participant1.participantName} vs {match.participant2.participantName}
                                    </p>
                                    <div className='col-4'>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            value={match.scores.participant1Score}
                                            onChange={(e) => handleScoreUpdate(roundIndex, matchIndex, e.target.value, match.scores.participant2Score)} 
                                        />
                                        <span> - </span>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            value={match.scores.participant2Score}
                                            onChange={(e) => handleScoreUpdate(roundIndex, matchIndex, e.target.value, match.scores.participant1Score)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </form>
    </div>
);
}


export default GroupMatches
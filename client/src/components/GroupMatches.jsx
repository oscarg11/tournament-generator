import React, {useState, useEffect} from 'react'

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


//UPDATE SCORES
const handleScoreUpdate = (groupIndex, participantIndex, score, opponentScore) => {
    const newGroups = [...tournamentData.groups];
    const participant = newGroups[groupIndex][participantIndex];
    participant.matchesPlayed += 1;
    participant.goalsScored += score;
    participant.goalsAgainst += opponentScore;
    participant.goalDifference = participant.goalsScored - participant.goalsAgainst;
  
  if (score > opponentScore){
    participant.points += POINTS_PER_WIN;
  } else if (score === opponentScore){
    participant.points += POINTS_PER_DRAW;
  } else {
    participant.points += POINTS_PER_LOSS;
  }
}

//generate matches
useEffect(() => {
  // Generate matches by pairing participants in each group for multiple rounds

  const createGroupStageMatches = (groups) => {
    let rounds = [];
    //loop through each group
    groups.forEach((group, groupIndex) => {
    console.log("Current group participants:", group);
    const numOfParticipants = group.length;
    //calculate total number of rounds based on the number of participants and legs
    const totalRounds = tournamentData.numberOfGroupStageLegs === 1
    ? numOfParticipants - 1
    : 2 * (numOfParticipants - 1);  //if there are 2 legs, then the total number of rounds will be 2 * (numOfParticipants - 1)
    
    //loop to create an empty array for each round
    for(let i = 0; i <totalRounds; i++){
      rounds.push([])
    }
    
    //round index to keep track of the current round
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

      if (groups.length > 0){
        const generatedMatches = createGroupStageMatches(tournamentData.groups);
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
  tournamentData.groups,
  tournamentData.numberOfGroupStageLegs,
  tournamentData.participants,
  matchData,
  setTournamentData,
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
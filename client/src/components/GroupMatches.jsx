import React, {useState, useEffect} from 'react'
import {shuffle,
        createGroups,
        determineMatchResult,
        saveMatches } from '../helpers/tournamentUtills';
import axios from 'axios'

const GroupMatches = ({tournamentData, setTournamentData}) => {
    const [matchData, setMatchData] = useState([]);

// onChange handler
const onChangeHandler = (e, roundIndex, matchIndex, participantIndex) => {
  const updatedMatches = [...matchData];
  updatedMatches[roundIndex][matchIndex].participants[participantIndex].score = parseInt(e.target.value) || 0;
  setMatchData(updatedMatches);
};


//handle score submit
const handleScoreSubmit = (e, tournmanentId, roundIndex, matchIndex) =>{
    e.preventDefault();

    //get the current match
    const updatedMatchData = [...matchData];
    const matchToSubmit = updatedMatchData[roundIndex][matchIndex];

    //call determineMatchResult function to determine the result of the match
    determineMatchResult(matchToSubmit)

    //update backend with the new match data
    axios.put(`http://localhost:8000/api/tournaments/${tournamentData._id}/matches/${roundIndex}/${matchIndex}`, matchToSubmit)
    .then(res => {
      console.log("Match updated successfully", res.data);
      //update the match data in the state
      updatedMatchData[roundIndex][matchIndex] = matchToSubmit;
      setMatchData(updatedMatchData);
    })
    .catch(err => console.log("Error updating match", err));
    
}


//generate matches
useEffect(() => {
  console.log("Match Data before generation:", matchData);
  console.log("Tournament Participants before generation:", tournamentData.participants);

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
            const participant1 = group[i]._id; //get participants by id
            const participant2 = group[group.length - 1 - i]._id; 
    
          //match object
          const match = {
            participants: [
              { participantId: participant1, score: 0},
              { participantId: participant2, score: 0}
            ],
            matchNumber: `${i}-${group.length - 1}`,
            group: String.fromCharCode(65 + groupIndex), //convert group index to letter
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

   // Shuffle participants, create groups, and generate matches
    console.log("TOURNAMENT DATA!!:", tournamentData);
    console.log(`Creating matches for groups ${tournamentData.group}`);
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

        //save matches to the database
        saveMatches(tournamentData._id, generatedMatches)
          .then(() => console.log("Matches saved successfully"))
          .catch(err => console.log("Error saving matches", err));
  }
}
}, [
  tournamentData._id,
  tournamentData.format,
  tournamentData.group,
  tournamentData.numberOfGroupStageLegs,
  tournamentData.participants,
]);


return (
    <div>
        <form onSubmit={ handleScoreSubmit }>
          <h2>Group Matches</h2>
          {/* Iterate over rounds of matches */}
          {matchData.map((round, roundIndex) =>{
            // Get the current group from the first match in the round
            const currentGroup = round[0]?.group || '';

            return (
              <div key={roundIndex} className='mb-5'>
                {/* display group name */}
                {roundIndex === 0 && (
                  <h3>{`Group ${currentGroup}`}</h3>
                )}
                {/* Round number */}
                <h4>{`Round ${roundIndex + 1}`}</h4>

                {/* Iterate over matches in the current round */}
                <div className='row g-3 justify-content-center'>    {/* Each round is a row */}
                  {round.map((match, matchIndex) => (
                    // match card
                    <div key={matchIndex} className='col-md-4'>     {/* Each match card is a colum*/}
                      <div className="card p-3 align-items-center">
                        <div className='card-body d-flex'>
                          {/* participant 1 */}
                          <label className='me-2'>
                            {tournamentData.participants.find(
                              (participant) => participant._id === match.participants[0]?.participantId
                            )?.participantName}
                          </label>

                          {/* score input for participant1 */}
                          <input
                              type='number'
                              className='form-control me-2'
                              style={{width: "60px"}}
                              min='0'
                              max='100'
                              value={match.participants[0]?.score || 0}
                              onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 1)}
                              >
                          </input>

                          <span className='mx-2'>-</span>

                          {/* score input for participant2 */}
                          <input
                              type='number'
                              className='form-control me-2'
                              style={{width: "60px"}}
                              min='0'
                              max='100'
                              value={match.participants[1]?.score || 0}
                              onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 2)}
                              >
                          </input>

                          {/* participant 2 */}
                          <label className='ms-2'>
                          {tournamentData.participants.find(
                              (participant) => participant._id === match.participants[1]?.participantId
                            )?.participantName}
                          </label>
                        </div>
                        {/* submit scores button */}
                      <button type='submit'
                              className='btn btn-primary mt-2'
                              onClick={(e) => handleScoreSubmit(e, tournamentData._id, roundIndex, matchIndex)}
                              >Confirm</button>
                      </div>
                    </div>
                    ))}

                  </div>
              </div>
            )
          })}
        </form>
    </div>
);
}


export default GroupMatches
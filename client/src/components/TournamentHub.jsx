import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'
import NavBar from './NavBar'
import GroupStandings from './GroupStandings'
import GroupMatches from './GroupMatches'

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;
const POINTS_PER_LOSS = 0;

const TournamentHub = () => {
  const { tournamentId } = useParams();
  console.log(tournamentId, "Tournament ID")
  const [tournamentData, setTournamentData] = useState({
    matches: [],
    participants: [],
    groups: [],
    numberOfGroupStageLegs: 0,
  });

const [matchData, setMatchData] = useState([]);

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

  // GROUP STAGE
  useEffect(() => {
    console.log(`Fetching data for tournament ID: ${tournamentId}`);
    axios.get(`http://localhost:8000/api/tournament-hub/${tournamentId}`)
    .then(res =>{ 
      const tournamentData = res.data.oneTournament;
      console.log(tournamentData, "Tournament data")

      let groups = [];
      if (tournamentData.format === 'groupAndKnockout'){
        const shuffledParticipants = [...tournamentData.participants];
        shuffle(shuffledParticipants);
        groups = createGroups(shuffledParticipants);
      }

      setTournamentData({...tournamentData, groups});
      console.log(tournamentData, "Tournament data")
    })
    .catch(err => console.log("Failed to fetch tournament data", err));
  }, [tournamentId]);

  
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

//CREATE GROUP STAGE MATCHES
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

//FETCH MATCH DATA 
  useEffect(() => {
    console.log(`Creating matches for groups ${tournamentData.groups}`);
    if (tournamentData.groups.length > 0) {
      const generatedMatches = createGroupStageMatches(tournamentData.groups);
      console.log(generatedMatches, "Generated Matches")
      setMatchData(generatedMatches);
    }
    console.log("Match Data", matchData)
  }, [tournamentData.groups, tournamentData.numberOfGroupStageLegs]);

  return (
    <div>
      <NavBar />
    
      {/* tournament details */}
      <h1>{tournamentData.tournamentName}</h1>
      <p>
        Date: {" "}
        {tournamentData.createdAt
          ? new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(tournamentData.createdAt))
          : "N/A"
          }
        </p>
      <p>Format: {tournamentData.format}</p>
      {tournamentData.format === 'groupAndKnockout' && <p>Number of group stage legs: {tournamentData.numberOfGroupStageLegs}</p>}
      
      {/* Group stadings component */}
      <GroupStandings groups={tournamentData.groups}/>

      {/* Group match fixtures component */}
      <GroupMatches matchData={matchData} handleScoreUpdate={handleScoreUpdate}/>

    </div>
  )
}


export default TournamentHub
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

  //shuffle participants
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  //create groups
  function createGroups(participants){
    let groups = [];

    if (participants.length === 4){
      groups.push(participants);
    }else{
      const groupCount = participants.length / 4;
      for (let i = 0; i < groupCount; i++){
        groups.push(participants.slice(i * 4, (i + 1) * 4));
      }
    }
    console.log(groups, "Groups")
    return groups;
  }

  //update scores
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
  // fetdgroup stage
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

   //create group stage matches
  const createGroupStageMatches = (groups) => {
    let Allmatches = [];
    groups.forEach((group, groupIndex) => {
      console.log("Current group participants:", group);
    for( let i = 0; i < group.length; i++){
      for(let j = i + 1; j < group.length; j++){
        const match = {
          participant1: group[i],
          participant2: group[j],
          scores: { participant1Score: 0, participant2Score: 0},
          matchNumber: `${i}-${j}`,
          group: String.fromCharCode(65 + i)
        }
        Allmatches.push(match);
      }
    }
  });
  console.log("matches generated", Allmatches)
  return Allmatches;
  }
  //fetch match data 
  useEffect(() => {
    console.log(`Creating matches for groups ${tournamentData.groups}`);
    if (tournamentData.groups.length > 0) {
      const generatedMatches = createGroupStageMatches(tournamentData.groups);
      console.log(generatedMatches, "Generated Matches")
      setMatchData(generatedMatches);
    }
    console.log("Match Data", matchData)
  }, [tournamentData.groups]);

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
import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'
import NavBar from './NavBar'

const TournamentHub = () => {
  const { tournamentId } = useParams();
  console.log(tournamentId, "Tournament ID")
  const [tournamentData, setTournamentData] = useState({
    participants: [],
    groups: []
  });

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
    return groups;
  }

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
    })
    .catch(err => console.log("Failed to fetch tournament data", err));
  }, [tournamentId]);

  return (
    <div>
      <NavBar />
      <h1>{tournamentData.tournamentName}</h1>
      <p>Format: {tournamentData.format}</p>
      {tournamentData.format === 'groupAndKnockout' && <p>Number of group stage legs: {tournamentData.numberOfGroupStageLegs}</p>}

      <h2>Groups</h2>
      { tournamentData.groups.map((group, groupIndex) => (
        <div key={groupIndex}>
          <h3>Group {String.fromCharCode(65 + groupIndex)}</h3>
          <ul>
            {group.map((participant, index) => (
              <li key={index}>{participant.participantName} - {participant.teamName}</li>
            ))}
          </ul>
    </div>
    ))}
      {tournamentData.format === 'knockout' && (
      <>
      <h2>Participants</h2>
      <ul>
        {tournamentData.participants.map((participant, index) => (
          <li key={index}>{participant.participantName} - {participant.teamName}</li>
        ))}
      </ul>
    </>
  )}

    {tournamentData.format === 'league' && (
      <>
        <h2>Participants (Alphabetical Order)</h2>
        <ul>
          {[...tournamentData.participants]
            .sort((a, b) => a.participantName.localeCompare(b.participantName))
            .map((participant, index) => (
              <li key={index}>{participant.participantName} - {participant.teamName}</li>
          ))}
        </ul>
      </>
  )}

    </div>
  )
}


export default TournamentHub
import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'
import NavBar from './NavBar'

const GroupStage = () => {
  const { tournamentId } = useParams();
  console.log(tournamentId, "Tournament ID")
  const [tournamentData, setTournamentData] = useState({
    participants: []
  });

  useEffect(() => {
    console.log(`Fetching data for tournament ID: ${tournamentId}`);
    axios.get(`http://localhost:8000/api/tournament/group-stage/${tournamentId}`)
    .then(res =>{ 
      console.log(res.data, "Tournament data")
      setTournamentData(res.data.oneTournament)
    })
    .catch(err => console.log("Failed to fetch tournament data", err));
  }, [tournamentId]);

  return (
    <div>
      <NavBar />
      <h1>{tournamentData.tournamentName}</h1>
      <p>Format: {tournamentData.format}</p>
      {tournamentData.format === 'groupAndKnockout' && <p>Number of group stage legs: {tournamentData.numberOfGroupStageLegs}</p>}

      <h2>Participants</h2>
      <ul>
        {tournamentData.participants && tournamentData.participants.map((participant, index) => ( 
          <li key={index}>{participant.participantName} - {participant.teamName}</li>
        ))}
      </ul>
    </div>
  )
}

export default GroupStage
import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'

const GroupStage = () => {
  const { tournamentId } = useParams();
  const [tournamentData, setTournamentData] = useState({
    participants: []
  });

  useEffect(() => {
    axios.get(`http://localhost:8000/api/tournament/group-stage/${tournamentId}`)
    .then(res =>{ 
      console.log(res.data)
      setTournamentData(res.data)
    })
    .catch(err => console.log("Failed to fetch tournament data", err));
  }, [tournamentId]);

  return (
    <div>
      <h1>{tournamentData.tournamentName}</h1>
      <p>Format: {tournamentData.format}</p>
      {tournamentData.format === 'groupAndKnockout' && <p>Number of group stage legs: {tournamentData.numberOfGroupStageLegs}</p>}

      <h2>Participants</h2>
      <ul>
        {tournamentData.participants.map((participant, index) => ( 
          <li key={index}>{participant.participantName} - {participant.teamName}</li>
        ))}
      </ul>
    </div>
  )
}

export default GroupStage
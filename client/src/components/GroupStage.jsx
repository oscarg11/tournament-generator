import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'

const GroupStage = ({tournamentName, format, numberOfGroupStageLegs, numberOfParticipants, participants}) => {

  return (
    <div>
      <h1>{tournamentName}</h1>
      <p>Format: {format}</p>
      {format === 'groupAndKnockout' && <p>Number of group stage legs: {numberOfGroupStageLegs}</p>}

      <h2>Participants</h2>
      <ul>
        {participants.map((participant, index) => ( 
          <li key={index}>{participant.participantName} - {participant.teamName}</li>
        ))}
      </ul>
    </div>
  )
}

export default GroupStage
import React from 'react'
import { useOutletContext } from 'react-router-dom'
const TeamsTab = () => {
  const { tournamentData } = useOutletContext();

  return (
    <div>
        <h1>Teams Tab!</h1>
    </div>
  )
}

export default TeamsTab
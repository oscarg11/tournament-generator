import React from 'react'
import { useOutletContext } from 'react-router-dom'

const StatsTab = () => {
  const { tournamentData, matchData } = useOutletContext();

  return (
    <div>
        <h1>Stats Tab!</h1>
    </div>
  )
}

export default StatsTab
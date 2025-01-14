import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'
import NavBar from '../components/NavBar'
import GroupStandings from '../components/GroupStandings'
import GroupMatches from '../components/GroupMatches'


const Dashboard = () => {
  const { tournamentId } = useParams();
  console.log("Tournament ID (DASHBOARD)", tournamentId);
  const [tournamentData, setTournamentData] = useState({
    matches: [],
    participants: [],
    groups: [],
    numberOfGroupStageLegs: 0,
  });

const [matchData, setMatchData] = useState([]);

  //display tournament data
  useEffect(() => {
    axios.get(`http://localhost:8000/api/dashboard/${tournamentId}`)
    .then(res =>{ 
      const tournamentData = res.data.oneTournament;

      //if group stage and knockout format
      if (tournamentData.format === 'groupAndKnockout'){
        setTournamentData(tournamentData)
      }
      console.log("Tournament Data DASHBOARD", tournamentData);
    })
    .catch(err => console.log("Failed to fetch tournament data", err));
  }, [tournamentId]);

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
      
      {tournamentData && (
        <>
        {/* Group stadings component */}
        <GroupStandings groups={tournamentData.groups}/>
  
        {/* Group match fixtures component */}
        <GroupMatches
          tournamentData={tournamentData}
          setTournamentData={setTournamentData}
          matchData={matchData}
          setMatchData={setMatchData}
        />
        </>
        
      )}

    </div>
  )
}


export default Dashboard
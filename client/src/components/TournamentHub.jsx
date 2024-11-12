import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'
import NavBar from './NavBar'
import GroupStandings from './GroupStandings'
import GroupMatches from './GroupMatches'


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

  //display tournament data
  useEffect(() => {
    console.log(`Fetching data for tournament ID: ${tournamentId}`);
    axios.get(`http://localhost:8000/api/tournament-hub/${tournamentId}`)
    .then(res =>{ 
      const tournamentData = res.data.oneTournament;
      console.log(tournamentData, "Tournament data")
      //if group stage and knockout format
      if (tournamentData.format === 'groupAndKnockout'){
        setTournamentData(tournamentData)
      }
      console.log(tournamentData, "Tournament data")
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
      
      {/* Group stadings component */}
      <GroupStandings groups={tournamentData.groups}/>

      {/* Group match fixtures component */}
      <GroupMatches
        tournamentData={tournamentData}
        setTournamentData={setTournamentData}
        mathcData={matchData}
        setMatchData={setMatchData}
      />

    </div>
  )
}


export default TournamentHub
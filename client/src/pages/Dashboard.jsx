import React, {useState, useEffect} from 'react'
import {useParams, Link, Outlet} from 'react-router-dom'
import axios from 'axios'
import NavBar from '../components/NavBar'

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
  const [loading, setLoading] = useState(true); // state to track loading status


  //display tournament data
  useEffect(() => {
    setLoading(true); // start loading
    console.log("Fetching tournament with ID:", tournamentId);
    axios.get(`http://localhost:8000/api/dashboard/${tournamentId}`)
    .then(res =>{ 
      const tournamentData = res.data.oneTournament;

      //if group stage and knockout format
      if (tournamentData.format === 'groupAndKnockout'){
        setTournamentData(tournamentData)
      }
      console.log("Tournament Data DASHBOARD", tournamentData);
      // Simulate a network delay (e.g., 2 seconds)
      setTimeout(() => {
        setLoading(false); // Now stop loading
      }, 500);
    })
    .catch(err => {
      console.log("Failed to fetch tournament data", err);
      setLoading(false); // Even if there’s an error, stop loading
    });

  }, [tournamentId]);

  if(loading){
    return <p>Loading Tournament Data...</p>
  }

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

      <div className="container">
      {/* Tournament Navigation */}
        <nav className="navbar navbar-expand navbar-dark bg-primary">
            <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
              <ul className="navbar-nav">

                <li className="nav-item">
                    <Link to={`/dashboard/${tournamentId}/overview`} className="nav-link">
                      Overview
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link to={`/dashboard/${tournamentId}/group-stage`} className="nav-link">
                      Group Stage
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link to={`/dashboard/${tournamentId}/finals-stage`} className="nav-link">
                      Finals Stage
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link to={`/dashboard/${tournamentId}/teams`} className="nav-link">
                      Teams
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link to={`/dashboard/${tournamentId}/stats`} className="nav-link">
                      Stats
                    </Link>
                  </li>
              </ul>
            </div>
        </nav>
        
        <Outlet context={{
          tournamentData,
          setTournamentData,
          matchData,
          setMatchData
        }}/>


      </div>
    
    </div>
  )
}


export default Dashboard
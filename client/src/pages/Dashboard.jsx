import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import axios from 'axios'
import NavBar from '../components/NavBar'
import GroupStage from '../components/GroupStage'
import FinalsStage from '../components/FinalsStage'
import TeamsTab from '../components/TeamsTab'
import StatsTab from '../components/StatsTab'


const Dashboard = () => {
  const { tournamentId } = useParams();
  console.log("Tournament ID (DASHBOARD)", tournamentId);
  const [tournamentData, setTournamentData] = useState({
    matches: [],
    participants: [],
    groups: [],
    numberOfGroupStageLegs: 0,
  });

const [loading, setLoading] = useState(true); // state to track loading status

const [matchData, setMatchData] = useState([]);

const [activeTab, setActiveTab] = useState('groupStage'); // state to track which tab is active

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
      }, 2000);
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

      {/* Tournament Navigation */}

      <div className="container">
        <nav className="navbar navbar-expand navbar-dark bg-primary">
            <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
              <ul className="navbar-nav">

                  <li className="nav-item">
                    <button className='nav-link btn btn-primary' onClick={() => setActiveTab("groupStage")}>Group Stage</button>
                  </li>

                  <li className="nav-item">
                    <button className='nav-link btn btn-primary' onClick={() => setActiveTab("finalsStage")}>Finals Stage</button>
                  </li>

                  <li className="nav-item">
                    <button className='nav-link btn btn-primary' onClick={() => setActiveTab("teamsTab")}>Teams</button>
                  </li>

                  <li className="nav-item">
                    <button className='nav-link btn btn-primary' onClick={() => setActiveTab("statsTab")}>Stats</button>
                  </li>
              </ul>
            </div>
        </nav>
        
        {/* Display active tab based on state */}

        {activeTab === 'groupStage' && <GroupStage 
          tournamentData={tournamentData}
          setTournamentData={setTournamentData}
          matchData={matchData}
          setMatchData={setMatchData}
        />}

        {activeTab === 'finalsStage' && <FinalsStage />}

        {activeTab === 'teamsTab' && <TeamsTab />}

        {activeTab === 'statsTab' && <StatsTab />}

      </div>
    
    </div>
  )
}


export default Dashboard
import React, { useState, useEffect} from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import NavBar from '../components/NavBar';


const Dashboard = () => {
    const [tournamentData, setTournamentData] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8000/api/tournaments/all-tournaments")
        .then(res => {
            console.log(res.data, "All Tournaments")
            setTournamentData(res.data.tournaments)
        })
        .catch(err => console.log("Failed to fetch tournaments", err))
    }, []);

  return (
    <div>
        <NavBar />
        <h1>Your Tournaments</h1>
        <ul>
            {tournamentData.map(tournament => (
                <li key={tournament._id}>
                    <Link to={`/group-stage/${tournament._id}`}>{tournament.tournamentName}</Link>
                </li>
            ))}
        </ul>

    </div>
  )
}

export default Dashboard
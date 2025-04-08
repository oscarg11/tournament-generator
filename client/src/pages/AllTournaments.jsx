import React, { useState, useEffect} from 'react'
import { Link} from 'react-router-dom'
import axios from 'axios'
import NavBar from '../components/NavBar';


const AllTournaments = () => {
    const [tournamentData, setTournamentData] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8000/api/tournaments/all-tournaments")
        .then(res => {
            
            setTournamentData(res.data|| [])
        })
        .catch(err => console.log("Failed to fetch tournaments", err))
    }, []);
    console.log("ALL TOURNAMENTS: ",tournamentData)

    // delete a tournament
    const deleteTournament = (id) => {
        console.log("DELETED Tournament");
        axios.delete(`http://localhost:8000/api/tournaments/all-tournaments/${id}`)
        //filter out tournament to be deleted by id
        .then(res => {
            const filteredTournaments = tournamentData.filter(oneTournament => oneTournament._id !== id);
            setTournamentData(filteredTournaments);
        })
        .catch(err => console.log("Failed to delete tournament", err))
    }

return (
    <div>
        <NavBar />
        <h1>Your Tournaments</h1>
        <ul>
            {tournamentData.map(tournament => (
                <li key={tournament._id}>
                    <Link to={`/dashboard/${tournament._id}`}>{tournament.tournamentName}</Link>
                    <button className='btn btn-danger m-2' onClick={ (e) => deleteTournament(tournament._id)}>Delete</button>
                </li>
            ))}
        </ul>

    </div>
    )
}

export default AllTournaments
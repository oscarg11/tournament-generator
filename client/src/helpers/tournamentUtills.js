import axios from "axios";


const loadTournamentData = async (tournamentId) => {
  try {
    const response = await axios.get(`http://localhost:8000/api/dashboard/${tournamentId}`);
    return response.data.oneTournament;  // Replace `oneTournament` if your API returns something different
  } catch (err) {
    console.error("Error loading tournament data:", err);
    throw err;
  }
};




module.exports = {
    loadTournamentData
}

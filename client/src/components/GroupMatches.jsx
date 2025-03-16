import React, {useState, useEffect} from 'react'
import axios from 'axios'

const GroupMatches = ({tournamentData, setTournamentData}) => {
    const [matchData, setMatchData] = useState([]);
    
    //participant lookup function to get Participant name and team name
    const participantLookup = tournamentData.participants.reduce((count, participant) => {
        count[participant._id] = participant;
        return count;
    }, {});

// onChange handler
const onChangeHandler = (e, roundIndex, matchIndex, participantIndex) => {
const updatedMatches = [...matchData];
updatedMatches[roundIndex][matchIndex].participants[participantIndex - 1].score = parseInt(e.target.value) || 0;
setMatchData(updatedMatches);
};


//handle score submit
const handleScoreSubmit = (e, tournmanentId, roundIndex, matchIndex) =>{
    e.preventDefault();

    //get the current match
    const updatedMatchData = [...matchData];
    const matchToSubmit = updatedMatchData[roundIndex][matchIndex];


    //update backend with the new match data
    axios.put(`http://localhost:8000/api/tournaments/${tournamentData._id}/matches/${roundIndex}/${matchIndex}`, matchToSubmit)
    .then(res => {
    console.log("Match updated successfully", res.data);
    //update the match data in the state
    updatedMatchData[roundIndex][matchIndex] = matchToSubmit;
    setMatchData(updatedMatchData);
    })
    .catch(err => console.log("Error updating match", err));
    
}

useEffect(() => {
const fetchGroupMatches = async () => {
    try {
        if (!tournamentData?._id) return;

        console.log("Fetching group matches for tournament:", tournamentData._id);

        const response = await axios.get(`http://localhost:8000/api/tournaments/${tournamentData._id}/group-stage-matches`);
        console.log("Fetched group matches:", response.data.matches);

        setMatchData(response.data.matches || []);
    } catch (err) {
        console.error("Error fetching group matches:", err);
        setMatchData([]);
    }
}
    fetchGroupMatches();
    }, [tournamentData._id]);

    console.log("Group Match Data:", matchData);

    return (
        <div>
            <form onSubmit={(e) => e.preventDefault()}>
                <h2>Group Matches</h2>

                {Array.isArray(matchData) && matchData.length > 0 ? (
                    matchData.map((round, roundIndex) => {
                        const currentGroup = round[0]?.group || '';

                        return (
                            <div key={roundIndex} className='mb-5'>
                                {roundIndex === 0 && <h3>{`Group ${currentGroup}`}</h3>}
                                <h4>{`Round ${roundIndex + 1}`}</h4>

                                <div className='row g-3 justify-content-center'>
                                    {round.map((match, matchIndex) => {
                                        //Define participant details
                                        const participant1 = participantLookup[match.participants[0]?.participantId] || {};
                                        const participant2 = participantLookup[match.participants[1]?.participantId] || {};

                                        return (
                                            <div key={matchIndex} className='col-md-4'>
                                                <div className="card p-3 align-items-center">
                                                    <div className='card-body d-flex'>

                                                        {/* Participant 1 */}
                                                        <label className='me-2'>
                                                            {participant1.participantName || "Unknown"} ({participant1.teamName || "Unknown"})
                                                        </label>

                                                        {/* Score Inputs */}
                                                        <input type='number' min='0' max='100' className='form-control me-2'
                                                            value={match.participants[0]?.score || 0}
                                                            onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 1)}
                                                        />

                                                        <span className='mx-2'>-</span>

                                                        {/* Participant 2 */}
                                                        <input type='number' min='0' max='100' className='form-control me-2'
                                                            value={match.participants[1]?.score || 0}
                                                            onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 2)}
                                                        />
                                                        <label className='ms-2'>
                                                            {participant2.participantName || "Unknown"} ({participant2.teamName || "Unknown"})
                                                        </label>
                                                    </div>

                                                    <button type='submit' className='btn btn-primary mt-2'
                                                        onClick={(e) => handleScoreSubmit(e, tournamentData._id, roundIndex, matchIndex)}>
                                                        Confirm
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                ) : <p>No matches available.</p>}
            </form>
        </div>
    );
};



export default GroupMatches
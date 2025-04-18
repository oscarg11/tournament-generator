import React, {useState, useEffect} from 'react'
import axios from 'axios'

const GroupMatches = ({tournamentData, setTournamentData}) => {
    const [matchData, setMatchData] = useState([]);
    
    //participant lookup function to get Participant name and team name
    const participantLookup = tournamentData.participants.reduce((count, participant) => {
        count[participant._id] = participant;
        return count;
    }, {});

// RESET/UPDATE single match
const resetMatch = async (roundIndex, matchIndex) => {
    try{
        await axios.put(
            `http://localhost:8000/api/tournaments/${tournamentData._id}/reset-group-match/${roundIndex}/${matchIndex}`
        );
        console.log("Match reset successfully on backend");

        //Re-fetch updated match data
        const matchResponse = await axios.get(
            `http://localhost:8000/api/tournaments/${tournamentData._id}/group-stage-matches`
        );

        //check if match data is valid
        if(matchResponse.data?.matches){ 
            setMatchData(matchResponse.data.matches);
            console.log("✅ Refetched updated match data")
        }else{
            console.warn("⚠️ No match data found in response");
        }

        //Refetch full tournament data (to get recalculated participant stats)
        const tournamentResponse = await axios.get(
            `http://localhost:8000/api/dashboard/${tournamentData._id}`
        );

        //check if tournament data is valid
        if(tournamentResponse.data?.oneTournament){
            setTournamentData(tournamentResponse.data.oneTournament);
            console.log("✅ Refetched updated tournament data");
        }else{
            console.warn("⚠️ No tournament data found in response");
        }
    }catch(err){
        console.error("❌Error resetting match:", err.response?.data || err.message || err);
    }
}

// onChange handler
const onChangeHandler = (e, roundIndex, matchIndex, participantIndex) => {
const updatedMatches = [...matchData];
updatedMatches[roundIndex][matchIndex].participants[participantIndex - 1].score = parseInt(e.target.value) || 0;
setMatchData(updatedMatches);
};


//handle score submit
const handleScoreSubmit = async (e, roundIndex, matchIndex) =>{
    e.preventDefault();
    
    try {
        console.log("🏗️ Entire matchData structure:", matchData);
        
        //make sure matchData and round are valid arrays
        if (!Array.isArray(matchData)) {
            console.error("⚠️ matchData is not an array yet:", matchData);
            return;
        }
        if (!Array.isArray(matchData[roundIndex])) {
            console.error("⚠️ matchData[roundIndex] is not an array:", matchData[roundIndex]);
            return;
        }

        // ✅ get the specific match object from the round + match indices
        const matchToSubmit = matchData[roundIndex][matchIndex];
        console.log("matchToSubmit object:", matchToSubmit);

        // make sure match and participants exist
        if (!matchToSubmit || !matchToSubmit.participants) {
            console.error("⚠️ Invalid match or participants data", matchToSubmit);
            return;
        }

        // ✅ create the score object to send to the backend
        const matchScores = {
            participant1Score: matchToSubmit.participants[0]?.score ?? 0,
            participant2Score: matchToSubmit.participants[1]?.score ?? 0
        }
        console.log("Match scores to submit", matchScores);
    
        //✅ update backend with the new match data
        await axios.put(`http://localhost:8000/api/tournaments/${tournamentData._id}/group-matches/${roundIndex}/${matchIndex}`,
            matchScores
        );
        console.log("Match Updated Successfully ✅")

        //✅ re-fetch updated match data to reflect changes on UI
        const response = await axios.get(
            `http://localhost:8000/api/tournaments/${tournamentData._id}/group-stage-matches`
        );
        console.log("Fetched refetched match data:", response.data.matches);

        // check if the backend returned valid match data
        if(response.data?.matches){
            console.log("Refetched updated match data");
            setMatchData(response.data.matches);
        }else{
            console.warn("No match data found in response");
        }
    
    } catch (err) {
        console.error("Error updating match data:", err);
    };
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


    return (
        <div>
            <form onSubmit={(e) => e.preventDefault()}>
                <h2>Group Matches</h2>
                {/* check if matchData exists and has matches */}
                {Array.isArray(matchData) && matchData.length > 0 ? (
                    // loop through each round in matchData
                    matchData.map((round, roundIndex) => {
                        const currentGroup = round[0]?.group || '';

                        return (
                            <div key={roundIndex} className='mb-5'>
                                {/* Display the group name  */}
                                {roundIndex === 0 && <h3>{`Group ${currentGroup}`}</h3>}
                                {/* Display the round number */}
                                <h4>{`Round ${roundIndex + 1}`}</h4>

                                <div className='row g-3 justify-content-center'>
                                    {/* loop through each match in the round */}
                                    {round.map((match, matchIndex) => {
                                        //Define participant details
                                        const participant1 = participantLookup[match.participants[0]?.participantId] || {};
                                        const participant2 = participantLookup[match.participants[1]?.participantId] || {};

                                        return (
                                            <div key={matchIndex} className='col-md-6'>

                                                {/* Match Card */}
                                                <div 
                                                className={`card p-3 align-items-center`}
                                                style={{ minHeight: '200px', opacity: match.status === 'complete' ? 0.5:1}}
                                                >
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

                                                    {/* Confirm button */}
                                                    <button 
                                                        type='submit'
                                                        className='btn btn-primary mt-2'
                                                        onClick={(e) => handleScoreSubmit(e, roundIndex, matchIndex)}
                                                        disabled={match.status === 'completed'} // Disable if match is completed
                                                        >
                                                        {match.status === 'completed' ? 'Submitted': 'Confirm'}
                                                    </button>

                                                    { match.status === 'completed' && (
                                                        <small className = 'text-muted mt-1'>Match already Submitted</small>
                                                    )}

                                                    {/* reset match button */}
                                                    <button 
                                                        type='button'
                                                        className='btn btn-danger mt-2 ms-2'
                                                        onClick={() => resetMatch(roundIndex, matchIndex)}>
                                                            Reset Match
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
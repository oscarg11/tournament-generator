import React, {useState, useEffect} from 'react'
import axios from 'axios'

const GroupMatches = ({tournamentData, setTournamentData}) => {
    const [matchData, setMatchData] = useState([]);
    console.log("📥 tournamentData.updatedAt in GroupMatches:", tournamentData.updatedAt);

    //participant lookup function to get Participant name and team name
    const participantLookup = tournamentData.participants.reduce((count, participant) => {
        count[participant._id] = participant;
        return count;
    }, {});

    //check if all matches are still pending
    const allMatchesPending = matchData.every(round => round.every(match => match.status !== 'pending'));

    
    // RESET single match
    const resetMatch = async (roundIndex, matchIndex) => {
        console.log("🔴 resetMatch triggered");
        try{
            await axios.put(
                `http://localhost:8000/api/tournaments/${tournamentData._id}/reset-group-match/${roundIndex}/${matchIndex}`
            );
            console.log("Match reset successfully ✅");
            
            //locally update match data state for instant UI refresh
            const updatedMatches = [...matchData];//shallow copy of matchData
            updatedMatches[roundIndex] = [...updatedMatches[roundIndex]]; //shallow copy of the round
            
            const originalMatch = updatedMatches[roundIndex][matchIndex];
            
        // deep copy + reset the specific match
        const resetMatch = {
            ...originalMatch,
            participants: [
                { ...originalMatch.participants[0], score: 0},
                { ...originalMatch.participants[1], score: 0},
            ],
            status: 'pending'
        };
        
        updatedMatches[roundIndex][matchIndex] = resetMatch;
        setMatchData(updatedMatches); // trigger UI re-render
        
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
    console.log("🟢 handleScoreSubmit triggered");
    try {
        //safety check
        if(!Array.isArray(matchData) || !Array.isArray(matchData[roundIndex])){
            console.warn("⚠️ Invalid matchData structure");
            return;
        }
        
        const matchToSubmit = matchData[roundIndex][matchIndex];
        
        const matchScores = {
            participant1Score: matchToSubmit.participants[0]?.score ?? 0,
            participant2Score: matchToSubmit.participants[1]?.score ?? 0
        };
        
        //✅ UPDATE backend with the new match data
        await axios.put(`http://localhost:8000/api/tournaments/${tournamentData._id}/group-matches/${roundIndex}/${matchIndex}`,
            matchScores
        );
        console.log("Match Updated Successfully ✅")
        
        //locally update match data state for instant UI refresh
        const updatedMatches = [...matchData];//shallow copy of matchData
        updatedMatches[roundIndex] = [...updatedMatches[roundIndex]]; //shallow copy of the round
        
        // deep copy + update the specific match
        const originalMatch = updatedMatches[roundIndex][matchIndex];
        const updatedMatch = {
            ...originalMatch,
            participants: [
                { ...originalMatch.participants[0], score: matchScores.participant1Score},
                { ...originalMatch.participants[1], score: matchScores.participant2Score},
            ],
            status: 'completed'
        };
        
        updatedMatches[roundIndex][matchIndex] = updatedMatch;
        setMatchData(updatedMatches);
        
    } catch (err) {
        console.error("Error updating match data:", err);
    };
}

//CONCLUDE GROUP STAGE
const handleConcludeGroupStage = async () => {
    console.log("🟢 handleConcludeGroupStage triggered");
    console.log("TOURNAMENT ID: ", tournamentData._id);
    try {
        console.log("starting api call to conclude group stage...");
        await axios.patch(
            `http://localhost:8000/api/tournaments/${tournamentData._id}/conclude-group-stage`
        );

        //re-fetch the full tournament, so that the updated groups and matches are reflected
        const res = await axios.get(
            `http://localhost:8000/api/dashboard/${tournamentData._id}`
        );

        setTournamentData(res.data.oneTournament);
    } catch (err) {
        console.error("Error concluding group stage:", err);
        alert("Error concluding group stage. Please try again.");
    }
}

useEffect(() => {
    const fetchGroupMatches = async () => {
        
        try {
            if (!tournamentData?._id) return;
            console.log("🎯 useEffect triggered by updatedAt in GroupMatches:", tournamentData.updatedAt);
            
            console.log("Fetching group matches for tournament:", tournamentData._id);
            
            const response = await axios.get(`http://localhost:8000/api/tournaments/${tournamentData._id}/group-stage-matches`);
            console.log("Fetched group matches:", response.data.matches);
            
            setMatchData([...response.data.matches]);
        } catch (err) {
            console.error("Error fetching group matches:", err);
            setMatchData([]);
        }
    }
    fetchGroupMatches();
}, [tournamentData._id, tournamentData.updatedAt]);

useEffect(() => {
    console.log("🎯 matchData updated:", matchData);
}, [matchData]); // ✅ this just logs it, doesn't fetch again

      console.log("🧠 GroupMatches render");
      console.log("📊 matchData:", matchData);
      console.log("📅 tournamentData.updatedAt:", tournamentData.updatedAt);

    return (
        <div>
            <div>
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
                                        console.log(`Match ${match.matchNumber} status:`, match.status);
                                        return (
                                            <div key={matchIndex} className='col-md-6'>

                                                {/* Match Card */}
                                                <div 
                                                className={`card p-3 align-items-center`}
                                                style={{ minHeight: '200px', opacity: match.status === 'completed' ? 0.5:1}}
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
                                                        type='button'
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
            </div>
            {/* conclude group stage button */}
            <div className='text-center my-4'>
                <button
                    disabled={!allMatchesPending}
                    className='btn btn-success'
                    onClick={handleConcludeGroupStage}
                    >
                    Conlude Group Stage
                </button>
            </div>
        </div>
    );
};



export default GroupMatches
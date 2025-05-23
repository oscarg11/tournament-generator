import React, {useState, useEffect} from 'react'
import axios from 'axios'

const GroupMatches = ({tournamentData, setTournamentData}) => {
    const [matchData, setMatchData] = useState([]);
    //loading indicators
    const [submittingMatch, setSubmittingMatch] = useState(null);//holds {roundIndex, matchIndex} of the match being submitted
    const [submittedMatches, setSubmittedMatches] = useState(new Set()) // track submitted matches
    const [resettingMatch, setResettingMatch] = useState(null); //holds {roundIndex, matchIndex} of the match being reset
    //conclude grop stage spinner state
    const [concludingGroupStage, setConcludingGroupStage] = useState(false);

    //conclude group stage
    const groupStageConcluded = tournamentData.groupStageConcluded;

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
        //loading indicator
        setResettingMatch({ roundIndex, matchIndex });
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

        //remove match from submittedMatches so inputs become editable again
        setSubmittedMatches(prev => {
            const newSet = new Set(prev);
            newSet.delete(`${roundIndex}-${matchIndex}`);
            return newSet;
        });
        
    }catch(err){
        console.error("❌Error resetting match:", err.response?.data || err.message || err);
    }finally{
        setResettingMatch(null);
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
        //loading indicator
        setSubmittingMatch({roundIndex, matchIndex});

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
        const response = await axios.put(
            `http://localhost:8000/api/tournaments/${tournamentData._id}/group-matches/${roundIndex}/${matchIndex}`,
            matchScores
        );
        console.log("Match Updated Successfully ✅")

        //get updated sorted standings from the response
        const { sortedGroupStandings } = response.data;

        // update the local state with the new standings
        setTournamentData((prevData) => ({
            ...prevData,
            groups: prevData.groups.map(group => 
                group.groupName === matchToSubmit.group
                ? { ...group, participants: sortedGroupStandings }
                :group
            )
        }))
        
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
    // clear loading indicator
    } finally {
        setSubmittingMatch(null);
    }
}

//CONCLUDE GROUP STAGE
const handleConcludeGroupStage = async () => {
    console.log("🟢 handleConcludeGroupStage triggered");
    console.log("TOURNAMENT ID: ", tournamentData._id);

    const confirm = window.confirm("Are you sure you want to conclude the group stage? This action cannot be undone.");
    if(!confirm) return;
    try {
        //loading indicator
        setConcludingGroupStage(true);

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
    }finally{
        setConcludingGroupStage(false);
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

                                {/* loop through each match in the round */}
                                <div className='row g-3 justify-content-center'>
                                    {round.map((match, matchIndex) => {
                                        // loading indicator for update match
                                        const isLoading = 
                                            submittingMatch?.roundIndex === roundIndex &&
                                            submittingMatch?.matchIndex === matchIndex;
                                        const isSubmitted = match.status === 'completed';

                                        // loading indicator for reset match
                                        const isResetting =
                                            resettingMatch?.roundIndex === roundIndex &&
                                            resettingMatch?.matchIndex === matchIndex;


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
                                                        <input
                                                            type='number'
                                                            min='0'
                                                            max='100'
                                                            className='form-control me-2'
                                                            value={match.participants[0]?.score || 0}
                                                            onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 1)}
                                                            disabled={isSubmitted || groupStageConcluded}
                                                            />

                                                        <span className='mx-2'>-</span>

                                                        {/* Participant 2 */}
                                                        <input
                                                            type='number'
                                                            min='0'
                                                            max='100' 
                                                            className='form-control me-2'
                                                            value={match.participants[1]?.score || 0}
                                                            onChange={(e) => onChangeHandler(e, roundIndex, matchIndex, 2)}
                                                            disabled={isSubmitted || groupStageConcluded}
                                                            />
                                                        <label className='ms-2'>
                                                            {participant2.participantName || "Unknown"} ({participant2.teamName || "Unknown"})
                                                        </label>
                                                    </div>

                                                    {/* Confirm button */}
                                                    {!groupStageConcluded && (
                                                        <button 
                                                            type='button'
                                                            className='btn btn-primary mt-2'
                                                            onClick={(e) => handleScoreSubmit(e, roundIndex, matchIndex)}
                                                            disabled={ isSubmitted || isLoading } // Disable if match is completed
                                                            >
                                                        {/* Show loading spinner if submitting */}
                                                        {isLoading ? (
                                                        <div className="spinner-border text-sucess" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                
                                                        ): isSubmitted ? 'Submitted' : 'Confirm'}
                                                        </button>
                                                    )}
                                                    
                                                {/* Show reset button only if match is completed */}
                                                </div>
                                                {/* reset match button */}
                                                {!groupStageConcluded && (
                                                    <button 
                                                        type='button'
                                                        className='btn btn-danger mt-2 ms-2'
                                                        onClick={() => resetMatch(roundIndex, matchIndex)}
                                                        >
                                                        {/* Show loading spinner if submitting */}
                                                        {isResetting ? (
                                                        <div className="spinner-border text-danger" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                
                                                        ):'Reset Match'}
                                                        </button>
                                                            
                                                )}
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
                {!tournamentData.groupStageConcluded && (
                <button
                disabled={!allMatchesPending || concludingGroupStage}
                className='btn btn-success'
                onClick={handleConcludeGroupStage}
                >
                {concludingGroupStage ? (
                    <>
                    <span
                        className="spinner-border spinner-border-sm me-2 text-light"
                        role="status"
                        aria-hidden="true"
                    />
                    Concluding...
                    </>
                ) : (
                    "Conclude Group Stage"
                )}
                </button>
            )}
            </div>
        </div>
    );
};



export default GroupMatches
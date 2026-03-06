import React, {useState, useEffect, useMemo} from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { participantLookupFunction } from '../helpers/tournamentUtills';

const GroupMatches = () => {

const { tournamentData, setTournamentData } = useOutletContext();
console.log("B: got outlet context", tournamentData);

const matches = Array.isArray(tournamentData?.matches?.[0])
    ? tournamentData.matches
    : [];


    //score buffer state 
    const [scoreInputs, setScoreInputs] = useState({});

    //loading indicators
    const [submittingMatch, setSubmittingMatch] = useState(null);//holds {roundIndex, matchIndex} of the match being submitted
    const [submittedMatches, setSubmittedMatches] = useState(new Set()) // track submitted matches
    const [resettingMatch, setResettingMatch] = useState(null); //holds {roundIndex, matchIndex} of the match being reset
    //conclude grop stage spinner state
    const [concludingGroupStage, setConcludingGroupStage] = useState(false);

    const navigate = useNavigate();

//Participant Lookup Function to get Participant name and team name
    const participantLookup = useMemo(() => {
        return participantLookupFunction(tournamentData.participants);
    }, [tournamentData.participants]);

    //conclude group stage
    const groupStageConcluded = tournamentData.groupStageConcluded;

    console.log("📥 tournamentData.updatedAt in GroupMatches:", tournamentData?.updatedAt);

    console.log("matches shape check:", {
    isArray: Array.isArray(matches),
    length: matches?.length,
    firstRoundIsArray: Array.isArray(matches?.[0]),
    firstRoundType: typeof matches?.[0],
    firstRoundValue: matches?.[0],
});

    const allMatchesPending =
    Array.isArray(matches) &&
    matches.length > 0 &&
    matches.every(round =>
        Array.isArray(round) &&
        round.every(match => match.status !== 'pending')
);

    
// RESET single match
const resetMatch = async (roundIndex, matchIndex) => {
// ✅ correct loading indicator for reset
setResettingMatch({ roundIndex, fullMatchIndex: matchIndex });
console.log("🔴 resetMatch triggered");

try {
const res = await axios.put(
    `http://localhost:8000/api/tournaments/${tournamentData._id}/reset-group-match/${roundIndex}/${matchIndex}`
);

console.log("Match reset successfully ✅", res.data);

// ✅ backend is source of truth now
setTournamentData(res.data.tournament);

// ✅ clear any buffered inputs for this match so UI doesn't show stale numbers
const key1 = `${roundIndex}-${matchIndex}-1`;
const key2 = `${roundIndex}-${matchIndex}-2`;
setScoreInputs((prev) => {
    const copy = { ...prev };
    delete copy[key1];
    delete copy[key2];
    return copy;
});

// ✅ allow editing again
setSubmittedMatches((prev) => {
    const newSet = new Set(prev);
    newSet.delete(`${roundIndex}-${matchIndex}`);
    return newSet;
});
} catch (err) {
console.error("❌Error resetting match:", err.response?.data || err.message || err);
} finally {
setResettingMatch(null);
}
};

//onChange handler
const onChangeHandler = (e, roundIndex, matchIndex, participantIndex) => {
    const key = `${roundIndex}-${matchIndex}-${participantIndex}`;
    const value = parseInt(e.target.value,10);

    setScoreInputs(prev => ({
        ...prev,
        [key]: Number.isNaN(value) ? 0 : value
    }));
};

useEffect(() => {
  console.log("scoreInputs:", scoreInputs);
}, [scoreInputs]);


//handle score submit
const handleScoreSubmit = async (e, roundIndex, matchIndex) =>{
    e.preventDefault();
    console.log("🟢 handleScoreSubmit triggered");
    try {
        //loading indicator
        setSubmittingMatch({ roundIndex, fullMatchIndex: matchIndex });

        //safety check
        if(!Array.isArray(matches) || !Array.isArray(matches[roundIndex])){
            console.warn("⚠️ Invalid matchData structure");
            return;
        }
        
        //each key is in the format of "roundIndex-matchIndex-participantIndex"
        //this helps locate the score inputs for the two participants in this match
        const key1 = `${roundIndex}-${matchIndex}-1`;
        const key2 = `${roundIndex}-${matchIndex}-2`;

        //get scores from input buffer, default to 0 if not found
        const participant1Score = scoreInputs[key1] ?? 0;
        const participant2Score = scoreInputs[key2] ?? 0;
        
        //payload to send to backend
        const matchScores = {
            participant1Score,
            participant2Score
        };
        
        //✅ UPDATE backend with the new match data
        const res = await axios.put(
            `http://localhost:8000/api/tournaments/${tournamentData._id}/group-matches/${roundIndex}/${matchIndex}`,
            matchScores
        );

        console.log("PUT matches is 2D?", Array.isArray(res.data?.tournament?.matches?.[0]));
        console.log("PUT matches type:", typeof res.data?.tournament?.matches);
        console.log("PUT matches sample:", res.data?.tournament?.matches?.[0]);


        setTournamentData(res.data.tournament);
        console.log("Updated Tournament Data After Match Update:", res.data.tournament);

        //clear input buffer for this match
        setScoreInputs(prev => {
            const copy = { ...prev };
            delete copy[key1];
            delete copy[key2];
            return copy;
        });
        
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

//Go to Knockout Stage
const handleKnockoutStageCreation = async () => {
    console.log("🟢 handleKnockoutStageCreation triggered");
    try {
        await axios.post(
            `http://localhost:8000/api/tournaments/${tournamentData._id}/create-knockout-stage`
        )
        console.log("Knockout stage created successfully ✅");
        navigate(`/dashboard/${tournamentData._id}/finals-stage`);
    } catch (error) {
        console.error("Error creating knockout stage:", error);
        alert("Error creating knockout stage. Please try again.");
    };
}

useEffect(() => {
    const fetchGroupMatches = async () => {
        try {
            if (!tournamentData?._id) return;
            console.log("🎯 useEffect triggered by updatedAt in GroupMatches:", tournamentData.updatedAt);
            
            console.log("Fetching group matches for tournament:", tournamentData._id);
            
            const res = await axios.get(`http://localhost:8000/api/tournaments/${tournamentData._id}/group-stage-matches`);
            console.log("Fetched group matches:", res.data.matches);
            console.log("✅ group-stage-matches raw response:", res.data);
            console.log("✅ is res.data.matches[0] an array?", Array.isArray(res.data.matches?.[0]));
            
            setTournamentData(prev => ({
            ...prev,
            matches: res.data.matches
            }));


        } catch (err) {
            console.error("Error fetching group matches:", err);
            setTournamentData(prev => ({ ...prev, matches: [] }));
        }
    }
    fetchGroupMatches();
}, [tournamentData?._id, tournamentData?.updatedAt]);

useEffect(() => {
    console.log("🎯 matchData updated:", matches);
}, [matches]); // ✅ this just logs it, doesn't fetch again

    console.log("🧠 GroupMatches render");
    console.log("📊 matchData:", matches);
    console.log("tournamentData shape upon loading", tournamentData);

    return (
        <div>
            <div>
                <h2>Group Matches</h2>
                {/* check if matchData exists and has matches */}
                {Array.isArray(matches) && matches.length > 0 ? (
                    // loop through each round of matches
                    matches.map((round, roundIndex) => {
                        // 1. organize matches by group name
                        const groupedMatches = round.reduce((matchesByGroup, match) => {
                            const participantId = match.participants?.[0]?.participantId;
                            const group = participantLookup?.[participantId]?.groupName || 'Unknown';

                            console.log("🔍 Derived group:", group);

                            if (!matchesByGroup[group]) {
                                matchesByGroup[group] = [];
                            }

                            matchesByGroup[group].push(match);
                            return matchesByGroup;
                        }, {});
                        console.log(groupedMatches, "Matches by group");

                            return (
                                <div key={roundIndex} className='mb-5'>
                                {/* Display the round number */}
                                <h4>{`Round ${roundIndex + 1}`}</h4>

                                 {/* 👇 Loop through each group in this round (Group A, Group B, etc.) */}
                                {Object.entries(groupedMatches).map(([groupName, groupMatches]) => (
                                    <div key={groupName} className='mb-3'>
                                        {/* group heading */}
                                        <h5 className='text-primary'>{`Group: ${groupName}`}</h5>
                                
                                {/* 👇 Render all matches for this group in the current round */}
                                <div className='row g-3 justify-content-center'>
                                    {groupMatches.map((match) => {
                                        const fullMatchIndex = round.findIndex(m => m._id === match._id);
                                        // loading indicator for update match
                                        const isLoading = 
                                            submittingMatch?.roundIndex === roundIndex &&
                                            submittingMatch?.fullMatchIndex === fullMatchIndex;
                                        const isSubmitted = match.status === 'completed';

                                        // loading indicator for reset match
                                        const isResetting =
                                            resettingMatch?.roundIndex === roundIndex &&
                                            resettingMatch?.fullMatchIndex === fullMatchIndex;;

                                        //Define participant details
                                        const participant1 = participantLookup[match.participants[0]?.participantId] || {};
                                        const participant2 = participantLookup[match.participants[1]?.participantId] || {};

                                        //score input keys
                                        const key1 = `${roundIndex}-${fullMatchIndex}-1`;
                                        const key2 = `${roundIndex}-${fullMatchIndex}-2`;

                                        const score1 = scoreInputs[key1] ?? (match.participants[0]?.score ?? 0);
                                        const score2 = scoreInputs[key2] ?? (match.participants[1]?.score ?? 0);
                                        console.log(`Match ${match.matchNumber} status:`, match.status);

                                        return (
                                            <div key={match._id || match.matchNumber || `${roundIndex}-${fullMatchIndex}`} className='col-md-6'>
                                                {/* Match Card */}
                                                <div 
                                                className={`card p-3 align-items-center`}
                                                style={{ minHeight: '200px', opacity: match.status === 'completed' ? 0.5:1}}
                                                >   
                                                    {/* Score Inputs */}
                                                    <div className='card-body d-flex'>
                                                        {/* Participant 1 */}
                                                        <label className='me-2'>
                                                            {participant1.participantName || "Unknown"} ({participant1.teamName || "Unknown"})
                                                        </label>
                                                        <input
                                                            type='number'
                                                            min='0'
                                                            max='100'
                                                            className='form-control me-2'
                                                            value={score1}
                                                            onChange={(e) => onChangeHandler(e, roundIndex, fullMatchIndex, 1)}
                                                            disabled={isSubmitted || groupStageConcluded}
                                                            />

                                                        <span className='mx-2'>-</span>

                                                        {/* Participant 2 */}
                                                        <input
                                                            type='number'
                                                            min='0'
                                                            max='100' 
                                                            className='form-control me-2'
                                                            value={score2}
                                                            onChange={(e) => onChangeHandler(e, roundIndex, fullMatchIndex, 2)}
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
                                                            onClick={(e) => handleScoreSubmit(e, roundIndex, fullMatchIndex)}
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
                                                {!groupStageConcluded && (
                                                // {/* reset match button */}
                                                    <button 
                                                        type='button'
                                                        className='btn btn-danger mt-2 ms-2'
                                                        onClick={() => resetMatch(roundIndex, fullMatchIndex)}
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
                        ))}
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
            {/* Go to Knockout stage! */}
            <div className="text-center my-4">
                <button
                    className="btn btn-danger"
                    onClick={ handleKnockoutStageCreation }
                >
                    Ready for Knockout Stage!
                </button>
            </div>
        </div>
    );
};



export default GroupMatches
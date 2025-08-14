import React, { useState,useEffect, useMemo } from 'react'
import axios from 'axios'
import { participantLookupFunction } from '../helpers/tournamentUtills'

const FinalsStage = ({tournamentData, setTournamentData}) => {
  const [matchData, setMatchData] = useState([])
  //tie breaker data
  const [tieBreakerState, setTieBreakerState] = useState({});
  // state to display prompt for tie breaker method selection
  const [promptTieBreakerMethod, setPromptTieBreakerMethod] = useState({});

  //tie breaker warning message
  const [tieBreakerWarning, setTieBreakerWarning] = useState("");

  //completed matches via tie breakers
  const [completedTieBreakerMatch, setCompletedTieBreakerMatch] = useState({});

  //Format Display of Selected Tie Breaker
  const formatSelectedTieBreakerName = (method) => {
    const methodNames = {
      'penaltyShootout': 'Penalty Shootout',
      'coinToss': 'Coin Toss',
      'rockPaperScissors': 'Rock Paper Scissors',
      'extraTime': 'Extra Time',
      'goldenGoal': 'Golden Goal'
    };
    return methodNames[method] || method;
  }

  useEffect(() => {
  console.log("👀 tieBreakerState updated:", tieBreakerState);
}, [tieBreakerState]);


  useEffect(() => {
  const handleClick = () => {
    console.log("📦 Document was clicked");
  };
  document.addEventListener("click", handleClick);
  // Clean up to avoid memory leaks
  return () => {
    document.removeEventListener("click", handleClick);
  };
}, []);

// Add this useEffect near your other useEffect declarations at the top
useEffect(() => {
  console.log("👀 completedTieBreakerMatch updated:", completedTieBreakerMatch);
}, [completedTieBreakerMatch]);


  //PARTICIPANT LOOKUP FUNCTION TO GET PARTICIPANT NAME AND TEAM NAME
    const participantLookup = useMemo(() => {
      return participantLookupFunction(tournamentData.participants);
    }, [tournamentData.participants]);

//ONCHANGE HANDLER FOR TIE BREAKER METHOD SELECTION
  const handleTieBreakerMethodChange = (e, stageName, matchIndex) => {
    const key = `${stageName}-${matchIndex}`; // unique key for each match
    const method = e.target.value; // get the selected method

    // log to display selected method
    if (method) {
      console.log(`⚖️ [TieBreaking] User selected method: ${method} for ${stageName} match ${matchIndex + 1}`);
    }
    
    setTieBreakerState(prev => ({
      ...prev, //copy previous state
      [key]: {  // for this specific match
        ...prev[key], // copy the existing data
        method: method //update just the method
      }
    }));

    // clear messsage warning when a tie breaker method is selected
    if(method) {
      setTieBreakerWarning("");
    }
  }
  
  //This function checks if the selected tie breaker is valid for manually declaring a winner
  const winnerDeclarationCheck = (method) => {
    return ['penaltyShootout', 'coinToss', 'rockPaperScissors'].includes(method);
  }

  //HANDLE DECLARING WINNER: This function handles submitting the winner of a match after a tie breaker
  const handleDeclaringWinner = (e, stageName, matchIndex) => {
    const key = `${stageName}-${matchIndex}`; // unique key for each match
    const winnerId = e.target.value; // get the selected method

    console.log(`🏆 [Winner] Selected winner for ${stageName} match ${matchIndex + 1}`);
    
    setTieBreakerState(prev => {
    const newState = {
      ...prev,
      [key]: {
        ...prev[key] || {},
        winner: winnerId
      }
    };
    console.log("🔄 Updated tieBreakerState:", newState);
    return newState;
  });
}

  //onChange handler for match score input
  const handleScoreChange = (e, stageName, matchIndex, participantIndex) => {
    const updatedMatch = {...matchData};
    updatedMatch[stageName][matchIndex].participants[participantIndex].score = e.target.value;
    setMatchData(updatedMatch);
  }

  //HANDLE SCORE SUBMIT
  const handleScoreSubmit = async(e, stageName, matchIndex) => {
    e.preventDefault();
    console.log(`📊 [ScoreSubmit] Submitting ${stageName} match ${matchIndex + 1}`);

    try {
       //safety check
        if (
          !Array.isArray(matchData[stageName]) || 
          !matchData[stageName][matchIndex]
        ) {
          console.warn("⚠️ Invalid matchData structure");
          return;
        }

        //current match
        const matchToSubmit = matchData[stageName][matchIndex];
        // current participants
        const p1Score = Number(matchToSubmit.participants[0]?.score ?? 0);
        const p2Score = Number(matchToSubmit.participants[1]?.score ?? 0);

        console.log("Participant 1 Score:", p1Score);
        console.log("Participant 2 Score:", p2Score);

        console.log("🔍 Are scores tied?", p1Score === p2Score);
        
        // check if scores are tied
        if( p1Score === p2Score){
          const tieBreakerKey = `${stageName}-${matchIndex}`;
          const method = tieBreakerState[tieBreakerKey]?.method;
          const winnerId = tieBreakerState[tieBreakerKey]?.winner;

          console.log(`🤝 [Draw] Scores tied ${p1Score}-${p2Score}, applying tie breaker: ${method || 'none'}`);

          console.log("🔍 Tie-breaker info:", { method, winnerId, tieBreakerKey });
          console.log("🔍 winnerDeclarationCheck result:", winnerDeclarationCheck(method));

          // if scores require manual winner declaration, submit winner of the match(Penalty Shoot out, coin toss, rock paper scissors)
          if(winnerDeclarationCheck(method)&& winnerId){
            console.log("🔍 Entering tie-breaker submission block");
            //data to be sent to the backend
            const payload = {
              participant1Score: p1Score,
              participant2Score: p2Score,
              knockoutMatchTieBreaker: {
                method: method || null,
                winner: winnerId || null // will be updated if a winner is declared
              }
            };
            console.log("🔍 Payload created:", payload);

            if (!winnerId || winnerId === "") {
              console.warn("⛔ [Winner] No winner declared for tie breaker");
              setTieBreakerWarning("Please select the winner of the tie breaker.");
              return;
            }
                        console.log("🔍 About to make axios call...");
            console.log("🔍 Tournament ID:", tournamentData._id);
            console.log("🔍 URL will be:", `http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-matches/${stageName}/${matchIndex}`);

            //✅ UPDATE backend with the new match data
            const response = await axios.put(
              `http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-matches/${stageName}/${matchIndex}`,
              payload,
              {timeout: 10000}
            );
            console.log("✅ [ScoreSubmit] Match updated with tie breaker winner");
            console.log("✅ Backend response received:", response.status);
            console.log("🔍 About to set winner display...");

            const winnerName = participantLookup[winnerId]?.participantName;
            console.log("🔍 Debug info:");
            console.log("winnerId:", winnerId);
            console.log("winnerName:", winnerName);
            console.log("method:", method);


            setCompletedTieBreakerMatch(prev => {
              const newState = {
                ...prev,
                [`${stageName}-${matchIndex}`]: {
                  winner: winnerName,
                  method: formatSelectedTieBreakerName(method)
                }
              };
              console.log("🎯 Setting completedTieBreakerMatch:", newState);
              return newState;
            });
            console.log("🔍 State should be updated now...");
            // Clear the tie-breaker selection UI
              setTieBreakerState(prev => ({
              ...prev,
              [`${stageName}-${matchIndex}`]: { method: '', winner: '' }
            }));

            setPromptTieBreakerMethod(prev => ({
              ...prev,
              [`${stageName}-${matchIndex}`]: false
            }));

            setTieBreakerWarning(""); // Clear any warnings

            
          // if user selects extra time or golden goal
          }else if(['extraTime', 'goldenGoal'].includes(method)){
            if(p1Score !== p2Score){
              const payload = {
                participant1Score: p1Score,
                participant2Score: p2Score,
                knockoutMatchTieBreaker: {method}
              }
              await axios.put(
                `http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-matches/${stageName}/${matchIndex}`,
                payload
              );
            }
            console.log("✅ [ScoreSubmit] Match updated with extra time result");

          }else{
            console.warn("⚠️ [TieBreaker] No tie breaking method selected for draw");
            setPromptTieBreakerMethod(prev => ({
              ...prev,
              [`${stageName}-${matchIndex}`]: true
            }));
            // no method selected
          setPromptTieBreakerMethod(prev => ({
            ...prev,
            [`${stageName}-${matchIndex}`]: true
          }));

            setTieBreakerWarning("Please select a tie breaker method to proceed.");
            return;
          }
          }else{
            // No draw, submit match scores directly
            console.log(`⚽ [Score] Final score: ${p1Score}-${p2Score}`);
            const payload = {
              participant1Score: p1Score,
              participant2Score: p2Score,
              knockoutMatchTieBreaker: null
            }
            await axios.put(
              `http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-matches/${stageName}/${matchIndex}`,
              payload
            );
            console.log("✅ [ScoreSubmit] Match updated successfully");
        }
        
        // UPDATE UI WITH NEW SCORES - 
        // display changes immediately without waiting for server to refresh
        const updatedMatchData = {...matchData};// Create shallow copy of entire match data object
        updatedMatchData[stageName] = [...matchData[stageName]];// Create shallow copy of the specific stage array (prevents mutation)

        // Get reference to the match we just updated
        const originalMatch = updatedMatchData[stageName][matchIndex];
        const updatedMatch = {
          ...originalMatch, // Keep all existing match properties (id, date, etc.)
          participants: [
            { ...originalMatch.participants[0], score: p1Score}, //update with new scores
            { ...originalMatch.participants[1], score: p2Score }
          ],
          status: 'completed'
        }
        // Replace old match with updated match data
        updatedMatchData[stageName][matchIndex] = updatedMatch;

        //Clear the warning message if scores are not a draw
        if(p1Score !== p2Score) {
          setTieBreakerWarning(""); 
        }
        // update react state (UI will immediately show new scores and "completed" status)
        setMatchData(updatedMatchData);

    } catch (error) {
  console.error("🚨 Full error object:", error);
  console.error("🚨 Error message:", error.message);
  if (error.response) {
    console.error("🚨 Backend responded with error:", error.response.status);
    console.error("🚨 Backend error data:", error.response.data);
  } else if (error.request) {
    console.error("🚨 No response received:", error.request);
  } else {
    console.error("🚨 Error setting up request:", error.message);
  }
}
}

  //get all knockout matches
  useEffect(() => {
    const fetchKnockoutMatches = async () => {
      try {
        if(!tournamentData?._id) return;
        console.log("Fetching knockout matches for tournament:", tournamentData._id);
        
        const response = await axios.get(`http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-stage-matches`);
        console.log(`📋 [KnockoutMatches] Loaded ${Object.keys(response.data.matches).length} stages`);
      //store the full object
        setMatchData(response.data.matches);
      } catch (err) {
        console.error("❌ [KnockoutMatches] Error:", err.message);
        setMatchData([]);
      }
    }
    fetchKnockoutMatches();
  }, [tournamentData]);
  

  return (
    <div>
        <h1>Finals Stage!</h1>
        {/* Render list of Finalists */}
        <h2>Finalists</h2>
          {Array.isArray(tournamentData.finalists) && tournamentData.finalists.length > 0 ? (
            <ul>
              {tournamentData.finalists.map((f, i) => {
                // use the participantLookup to get the participant name and team name
                const p = participantLookup[f.participant]

                return (
                <li key={i}>
                  {p?.participantName || "??"} ({p?.teamName || "??"}) — Group {f.group}, Rank {f.rank}
                </li>
              )
          })}
            </ul>
          ) : (
            <p>No finalists yet.</p>
              )}

            <h2>Knockout Matches</h2>

            <div className="container-fluid">
              <div className='row justify-content-center'>
              {Object.entries(matchData).map(([stageName, matches]) => (
                // render each stage
                <div key={stageName} className='col-auto text-center'>
                  <h3 className='text-capitalized'>{stageName}</h3>
                  {/* Render matches for this stage */}
                  <div className='d-flex flex-column gap-3'>
                    {matches.map((match, matchIndex) => {
                      const [p1, p2] = match.participants;
                      const participant1 = participantLookup[p1.participantId?._id] || null;
                      const participant2 = participantLookup[p2.participantId?._id] || null;

                      const tieBreakerKey = `${stageName}-${matchIndex}`;
                      const selectedMethod = tieBreakerState[tieBreakerKey]?.method;
                      const selectedWinner = tieBreakerState[tieBreakerKey]?.winner;

                      // disable submit button if scores are tied and no tie breaker method is selected
                      const p1Score = Number(p1?.score ?? 0);
                      const p2Score = Number(p2?.score ?? 0);
                      const disableSubmit = 
                        p1Score === p2Score &&
                        winnerDeclarationCheck(selectedMethod) &&
                        !selectedWinner;

                      // render all match cards
                      return (
                        <div key={match._id} className='card p-2 border rounded'>
                          <div className='card-body d-flex flex-row align-items-center'>

                          <p><strong>Match {match.matchNumber}</strong></p>
                          {/* participant1 */}
                          <label className='me-2'>{participant1?.participantName || "TBD"}</label>
                          <input 
                              type='number'
                              min='0'
                              max='100'
                              className='form-control'
                              value={p1.score ?? ""}
                              onChange={(e) => handleScoreChange(e, stageName, matchIndex, 0)}
                          />

                          <span className='mx-2'>vs</span>
                        {/* participant2 */}
                          <label className='me-2'>{participant2?.participantName || "TBD"}</label>

                          <input 
                              type='number'
                              min='0'
                              max='100'
                              className='form-control'
                              value={p2.score ?? ""}
                              onChange={(e) => handleScoreChange(e, stageName, matchIndex, 1)}
                          />
                          </div>

                          {/* Debugging */}
                          {console.log("🔍 JSX Debug:", {
                            key: `${stageName}-${matchIndex}`,
                            completedData: completedTieBreakerMatch[`${stageName}-${matchIndex}`],
                            promptTieBreaker: promptTieBreakerMethod[tieBreakerKey],
                            fullCompletedState: completedTieBreakerMatch // Add this line
                          })}
                          {/* Tie-breaker section - show either completed result or selection UI */}
                          {completedTieBreakerMatch[`${stageName}-${matchIndex}`] ? (
                            // ✅ Show completed tie-breaker result
                            <div className="mt-2 alert alert-success">
                              <strong>Winner:</strong> {completedTieBreakerMatch[`${stageName}-${matchIndex}`].winner} 
                              <span> via {completedTieBreakerMatch[`${stageName}-${matchIndex}`].method}</span>
                            </div>
                          ) : promptTieBreakerMethod[tieBreakerKey] ? (
                            // 🔄 Show your existing tie-breaker selection UI
                            <>  
                              {tieBreakerWarning && (
                                <div className="alert alert-warning mt-2">
                                  {tieBreakerWarning}
                                </div>
                              )}

                              <div className="mb-2">
                                <label className="form-label">Select Tiebreaker Method: </label>
                                <select
                                  className="form-select"
                                  onChange={(e) => handleTieBreakerMethodChange(e, stageName, matchIndex)}
                                >
                                  <option value="">-- Choose --</option>
                                  <option value="extraTime">Extra Time</option>
                                  <option value="goldenGoal">Golden Goal</option>
                                  <option value="penaltyShootout">Penalty Shootout</option>
                                  <option value="coinToss">Coin Toss</option>
                                  <option value="rockPaperScissors">Rock Paper Scissors</option>
                                </select>
                              </div>

                              {selectedMethod && (
                                <div className="mt-2 alert alert-info">
                                  <strong>Tie Breaker: </strong> {formatSelectedTieBreakerName(selectedMethod)}
                                </div>
                              )}

                              {winnerDeclarationCheck(selectedMethod) && (
                                <div className="mt-2">
                                  <label>Select Winner:</label>
                                  <div className="form-check">
                                    <input
                                      type="radio"
                                      name={`tiebreaker-winner-${tieBreakerKey}`}
                                      value={p1.participantId._id}
                                      onChange={(e) => handleDeclaringWinner(e, stageName, matchIndex)}
                                      checked={tieBreakerState[tieBreakerKey]?.winner === p1.participantId._id}
                                    />
                                    <label className='form-check-label'>{participant1.participantName}</label>
                                  </div>
                                  <div className="form-check">
                                    <input
                                      type="radio"
                                      name={`tiebreaker-winner-${tieBreakerKey}`}
                                      value={p2.participantId._id}
                                      onChange={(e) => handleDeclaringWinner(e, stageName, matchIndex)}
                                      checked={tieBreakerState[tieBreakerKey]?.winner === p2.participantId._id}
                                    />
                                    <label className='form-check-label'>{participant2.participantName}</label>
                                  </div>
                                </div>
                              )}

                              {selectedMethod && winnerDeclarationCheck(selectedMethod) && selectedWinner && (
                                <div className="mt-2 alert alert-success">
                                  <strong>Winner Selected: </strong> {participantLookup[selectedWinner]?.participantName}
                                </div>
                              )}
                            </>
                          ) : null}

                        {/* SUBMIT SCORE */}
                          <button
                            type='button'
                            className='btn btn-primary mt-4'
                            onClick= {(e) => handleScoreSubmit(e, stageName, matchIndex)}
                            disabled={disableSubmit}
                          >
                            Submit Score
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              </div>
            </div>
          </div>
        )
      }

export default FinalsStage
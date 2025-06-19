import React, { useState,useEffect, useMemo } from 'react'
import axios from 'axios'
import { participantLookupFunction } from '../helpers/tournamentUtills'



const FinalsStage = ({tournamentData, setTournamentData}) => {
  const [matchData, setMatchData] = useState([])

  //Participant Lookup Function to get Participant name and team name
    const participantLookup = useMemo(() => {
      return participantLookupFunction(tournamentData.participants);
    }, [tournamentData.participants]);

  //onChange handler for match score input
  const handleScoreChange = (e, stageName, matchIndex, participantIndex) => {
    const updatedMatch = {...matchData};
    updatedMatch[stageName][matchIndex].participants[participantIndex].score = e.target.value;
    setMatchData(updatedMatch);
  }

  //handle score submission
  const handleScoreSubmit = async(e, stageName, matchIndex) => {
    e.preventDefault();
    console.log("🟢 handleScoreSubmit triggered")

    try {
       //safety check
        if(!Array.isArray(matchData) || !Array.isArray(matchData[stageName])){
            console.warn("⚠️ Invalid matchData structure");
            return;
        }
        
        const matchToSubmit = matchData[stageName][matchIndex];

        const matchScores = {
          participant1Score: matchToSubmit.participants[0]?.score ?? 0,
          participant2Score: matchToSubmit.participants[1]?.score ?? 0
        };

        //✅ UPDATE backend with the new match data
        await axios.put(
          `http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-matches/${stageName}/${matchIndex}`,
          matchScores
        );
        console.log("Match Updated Successfully ✅")

        const updatedMatchData = {...matchData};
        updatedMatchData[stageName] = [...matchData[stageName]];
        
        const originalMatch = updatedMatchData[stageName][matchIndex];
        const updatedMatch = {
          ...originalMatch,
          participants: [
            { ...originalMatch.participants[0], score: matchScores.participant1Score},
            { ...originalMatch.participants[1], score: matchScores.participant2Score }
          ],
          status: 'completed'
        }

        updatedMatchData[stageName][matchIndex] = updatedMatch;
        setMatchData(updatedMatchData);


    } catch (error) {
      console.error("Error submitting score:", error);
      
    }
  }

  
  //get all knockout matches
  useEffect(() => {
    const fetchKnockoutMatches = async () => {
      try {
        if(!tournamentData?._id) return;
        console.log("Fetching knockout matches for tournament:", tournamentData._id);
        
        const response = await axios.get(`http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-stage-matches`);
        console.log("knockout matches:", response.data.matches);
      //store the full object
        setMatchData(response.data.matches);
      } catch (err) {
        console.error("Error fetching knockout matches:", err);
        setMatchData([]);
      }
    }
    fetchKnockoutMatches();
  }, [tournamentData]);
  
  if (!tournamentData || !tournamentData._id) {
    console.warn("🛑 FinalsStage blocked render due to missing tournamentData.");
    return null;
  }
console.log("✅ tournamentData:", tournamentData);
console.log("✅ tournamentData.finalists:", tournamentData?.finalists);
console.log("✅ matchData:", matchData);


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
                <div key={stageName} className='col-auto text-center'>
                  <h3 className='text-capitalized'>{stageName}</h3>
                  <div className='d-flex flex-column gap-3'>
                    {matches.map((match, matchIndex) => {
                      const [p1, p2] = match.participants;
                      const participant1 = participantLookup[p1.participantId];
                      const participant2 = participantLookup[p2.participantId];
                      // render match cards
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
                        {/* SUBMIT SCORE */}
                          <button
                            type='button'
                            className='btn btn-primary mt-2'
                            onClick= {(e) => handleScoreSubmit(e, stageName, matchIndex)}
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
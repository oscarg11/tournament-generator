import React, { useState,useEffect, useMemo } from 'react'
import axios from 'axios'
import { participantLookupFunction } from '../helpers/tournamentUtills'



const FinalsStage = ({tournamentData, setTournamentData}) => {
  const [matchData, setMatchData] = useState([])

  //Participant Lookup Function to get Participant name and team name
    const participantLookup = useMemo(() => {
      return participantLookupFunction(tournamentData.participants);
    }, [tournamentData.participants]);

  
  //get all knockout matches
  useEffect(() => {
    const fetchKnockoutMatches = async () => {
      try {
        if(!tournamentData?._id) return;
        console.log("Fetching knockout matches for tournament:", tournamentData._id);
        
        const response = await axios.get(`http://localhost:8000/api/tournaments/${tournamentData._id}/knockout-stage-matches`);
        console.log("knockout matches:", response.data);
        
        setMatchData([...response.data.matches]);
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
              </div> 
            )
          }

export default FinalsStage
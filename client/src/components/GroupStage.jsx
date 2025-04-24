import React, {useState} from 'react'
import GroupStandings from '../components/GroupStandings'
import GroupMatches from '../components/GroupMatches'

const GroupStage = ({tournamentData, setTournamentData, matchData, setMatchData, refreshData}) => {
  // state to track which component to display
  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem("activeTab");
    return saved === "matches" ? false : true;
  });
  console.log("📥 tournamentData.updatedAt in GroupStage:", tournamentData.updatedAt);


  return (
    // Navbar to toggle between group standings and group matches
    <div className="container">
      <nav className="navbar navbar-expand navbar-dark bg-secondary mb-3">
          <div className="collapse navbar-collapse justify-content-start" id="navbarNav">
            <ul className="navbar-nav">
                <li className="nav-item">
                    <button className="btn btn-light mx-2"
                    onClick={() => {
                      localStorage.setItem("activeTab", "standings");
                      refreshData()
                      setActive(true)
                    }}>
                      Group Standings
                    </button>
                </li>
                <li className="nav-item">
                    <button className="btn btn-light mx-2" 
                    onClick={() => {
                        localStorage.setItem("activeTab", "matches");
                        refreshData();         // ✅ fetch latest
                        setActive(false);      // show matches
                    }}>
                      Group Matches
                    </button>
                </li>
            </ul>
          </div>
        </nav>
          {/* if active state is true display group standings, else display group matches */}
            <div className="flex flex-row gap-3">
                <>
                  {active? <GroupStandings 
                            key="standings"
                            groups={tournamentData.groups}
                            matches={matchData}
                            /> 
                  : 
                  <GroupMatches
                          tournamentData={tournamentData}
                          setTournamentData={setTournamentData}
                          matchData={matchData}
                          setMatchData={setMatchData}
                          refreshData={refreshData}
                  />}
                </>
            </div>
    </div>
)
}

export default GroupStage
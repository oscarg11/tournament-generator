import { useOutletContext, Link, Outlet} from 'react-router-dom'

const GroupStage = () => {
  const {tournamentData} = useOutletContext();
  //read from Dashboars's context
  const context = useOutletContext();
  
  console.log("📥 tournamentData.updatedAt in GroupStage:", tournamentData.updatedAt);


  return (
    // Navbar to toggle between group standings and group matches
    <>
      <nav className="navbar navbar-expand navbar-dark bg-secondary mb-3">
          <div className="collapse navbar-collapse justify-content-start" id="navbarNav">
            <ul className="navbar-nav">
                <li className="nav-item">
                  <Link to={`/dashboard/${tournamentData._id}/group-stage/standings`} className="nav-link">
                    Group Standings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to={`/dashboard/${tournamentData._id}/group-stage/matches`} className="nav-link">
                    Group Matches
                  </Link>
                </li>
            </ul>
          </div>
        </nav>
          <Outlet context={context}/>
  </>
)
}

export default GroupStage
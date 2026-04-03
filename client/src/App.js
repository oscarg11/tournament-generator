import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import './App.css';

import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import AllTournaments from './pages/AllTournaments';
import CreateTournament from './components/CreateTournament';
import OverView from './components/OverView';
import GroupStage from './components/GroupStage';
import GroupMatches from './components/GroupMatches';
import GroupStandings from './components/GroupStandings';
import FinalsStage from './components/FinalsStage';
import TeamsTab from './components/TeamsTab';
import StatsTab from './components/StatsTab';

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={ <HomePage/> } />
          <Route path='/create-tournament' element={ <CreateTournament/> } />
          <Route path='/dashboard/:tournamentId' element={ <Dashboard/> }>
          {/* ✅ Redirect dashboard root to overview */}
            <Route index element={ <Navigate to="overview" replace /> } />

            <Route path='overview' element={ <OverView/> } />
            <Route path='group-stage' element={ <GroupStage/>}>
            {/* ✅ Redirect group-stage root to standings */}
              <Route index element={ <Navigate to='standings' replace />} />
              <Route path='matches' element={ <GroupMatches/>} />
              <Route path='standings' element={ <GroupStandings/>} />
            </Route>
            <Route path='finals-stage' element={ <FinalsStage/> }/>
            <Route path='teams' element={ <TeamsTab/> }/>
            <Route path='stats' element={ <StatsTab/> }/>
          </Route>
          <Route path='/all-tournaments' element= { <AllTournaments/> }/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

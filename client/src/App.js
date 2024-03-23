import { BrowserRouter, Routes, Route} from 'react-router-dom'
import axios from 'axios';
import './App.css';
import { useEffect } from 'react';
import LandingPage from './components/LandingPage';
import TournamentForm from './components/TournamentForm';
import GroupStage from './components/GroupStage';
import Dashboard from './components/Dashboard';

function App() {
  useEffect(() => {
  axios.get("http://localhost:8000/api/tournaments")
  .then(res => console.log(res))
  .catch(err => console.log(err))
}, [])

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={ <LandingPage/> } />
          <Route path='/create-tournament' element={ <TournamentForm/> } />
          <Route path='/dashboard' element= { <Dashboard/> }/>
          <Route path='/group-stage/:tournamentId' element={ <GroupStage/> }/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

import { BrowserRouter, Routes, Route} from 'react-router-dom'
import axios from 'axios';
import './App.css';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import CreateTournament from './components/CreateTournament';
import Dashboard from './pages/Dashboard';
import AllTournaments from './components/AllTournaments';

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
          <Route path='/' element={ <HomePage/> } />
          <Route path='/create-tournament' element={ <CreateTournament/> } />
          <Route path='/dashboard/:tournamentId' element={ <Dashboard/> } />
          <Route path='/all-tournaments' element= { <AllTournaments/> }/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

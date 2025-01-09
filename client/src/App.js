import { BrowserRouter, Routes, Route} from 'react-router-dom'
import './App.css';

import HomePage from './pages/HomePage';
import CreateTournament from './components/CreateTournament';
import Dashboard from './pages/Dashboard';
import AllTournaments from './pages/AllTournaments';

function App() {

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

import { BrowserRouter, Routes, Route} from 'react-router-dom'
import axios from 'axios';
import './App.css';
import { useEffect } from 'react';
import TournamentForm from './components/TournamentForm';
import GroupStage from './components/GroupStage';

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
          <Route path='/' element={<TournamentForm/>} />
          <Route path='/group-stage/:tournamentId' element={<GroupStage/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

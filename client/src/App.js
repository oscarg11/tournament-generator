import logo from './logo.svg';
import axios from 'axios';
import './App.css';
import { useEffect } from 'react';
import TournamentForm from './components/TournamentForm';

function App() {
  useEffect(() => {
  axios.get("http://localhost:8000/api/tournaments")
  .then(res => console.log(res))
  .catch(err => console.log(err))
}, [])

  return (
    <div className="App">
      <h1>In the main App</h1>
      <TournamentForm />
    </div>
  );
}

export default App;

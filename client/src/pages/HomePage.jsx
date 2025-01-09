import React from 'react'
import NavBar from '../components/NavBar'
import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div>
        <NavBar/>
        <h1>Welcome to the Tournament Manager</h1>
        <p>Click the button below to create a new tournament</p>
        <Link to="/create-tournament">
            <button className='btn btn-primary'>Create Tournament</button>
        </Link>
    </div>
  )
}

export default HomePage
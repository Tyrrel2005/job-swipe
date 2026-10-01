
import './App.css'
import './para-title.css'
import './button.css'
import './container.css'
import './input.css'
import Welcome from './components/Welcome'
import {BrowserRouter, Routes, Route } from "react-router"
import Connection from './components/Connection'
import AccountCreation from './components/AccountCreation'
import { JobPosting } from './components/JobPosting';
import { Matching } from './components/Matching'

function App() {


  return (
    <BrowserRouter>
          <h1 className="main-title">Job Swipe</h1>
      <Routes>
        <Route path="/" element={<Welcome></Welcome>} />
        <Route path="/connect" element={<Connection></Connection>}></Route>
        <Route path='/create-account' element={<AccountCreation></AccountCreation>} />
        <Route path='/create-job' element={<JobPosting></JobPosting>}></Route>
        <Route path='/matching' element={<Matching></Matching>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

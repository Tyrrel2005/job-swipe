import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import './App.css'
import AuthPage from './pages/AuthPage'
import CandidateProfilePage from './pages/CandidateProfilePage'
import CandidateEducationPage from './pages/CandidateEducationPage'
import CandidateBioPage from './pages/CandidateBioPage'
import CandidateCvPage from './pages/CandidateCvPage'
import CandidateOfferPage from './pages/CandidateOfferPage'
import CandidateMatchesPage from './pages/CandidateMatchesPage'
import CandidateMessagesPage from './pages/CandidateMessagesPage'
import NotificationsPage from './pages/NotificationsPage'
import RecruiterProfilePage from './pages/RecruiterProfilePage'
import RecruiterOfferCreatePage from './pages/RecruiterOfferCreatePage'
import RecruiterOfferDetailPage from './pages/RecruiterOfferDetailPage'
import RecruiterCandidatesPage from './pages/RecruiterCandidatesPage'
import RecruiterMatchesPage from './pages/RecruiterMatchesPage'
import RecruiterCompanyPage from './pages/RecruiterCompanyPage'
import CandidateSkillsPage from './pages/CandidateSkillsPage'
import CandidateProfileSettingsPage from './pages/CandidateProfileSettingsPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import CandidateDiscoverPage from './pages/CandidateDiscoverPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding/candidate/profile" element={<CandidateProfilePage />} />
        <Route path="/onboarding/candidate/skills" element={<CandidateSkillsPage />} />
        <Route path="/onboarding/candidate/education" element={<CandidateEducationPage />} />
        <Route path="/onboarding/candidate/bio" element={<CandidateBioPage />} />
        <Route path="/onboarding/candidate/cv" element={<CandidateCvPage />} />
        <Route path="/profile" element={<CandidateProfileSettingsPage />} />
        <Route path="/offers/:id" element={<CandidateOfferPage />} />
        <Route path="/discover" element={<CandidateDiscoverPage />} />
        <Route path="/matches" element={<Navigate replace to="/dashboard" />} />
        <Route path="/messages" element={<CandidateMessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/onboarding/recruiter/profile" element={<RecruiterProfilePage />} />
        <Route path="/recruiter/offers/new" element={<RecruiterOfferCreatePage />} />
        <Route path="/recruiter/offers/:id" element={<RecruiterOfferDetailPage />} />
        <Route path="/recruiter/candidates" element={<RecruiterCandidatesPage />} />
        <Route path="/recruiter/matches" element={<RecruiterMatchesPage />} />
        <Route path="/recruiter/profile" element={<RecruiterCompanyPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

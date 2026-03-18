import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [loginMode, setLoginMode] = useState('user')

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onStart={(mode = 'user') => {
          setLoginMode(mode);
          setCurrentPage('login');
        }} />
      case 'login':
        return (
          <LoginPage 
            mode={loginMode}
            onLogin={(role) => setCurrentPage(role === 'admin' ? 'admin' : 'analysis')} 
            onBack={() => setCurrentPage('landing')} 
          />
        )
      case 'analysis':
        return <AnalysisPage onBack={() => setCurrentPage('landing')} />
      case 'admin':
        return <AdminPage onBack={() => setCurrentPage('landing')} />
      default:
        return <LandingPage onStart={() => setCurrentPage('login')} />
    }
  }

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  )
}

export default App

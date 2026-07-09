import { useState } from 'react'
import Dashboard from './components/Dashboard'
import TransactionModal from './components/TransactionModal'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app-container">
      <Dashboard />
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}

export default App

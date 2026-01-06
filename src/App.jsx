import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Order from './pages/Order.jsx'
import Menu from './pages/Menu.jsx'
import OurStory from './pages/OurStory.jsx'
import Cart from './components/Cart.jsx'
import Navbar from './components/Navbar.jsx'

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<Order />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/our-story" element={<OurStory />} />
      </Routes>
    </div>
  )
}

export default App

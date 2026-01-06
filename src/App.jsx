import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Order from './pages/Order.jsx'
import Menu from './pages/Menu.jsx'
import OurStory from './pages/OurStory.jsx'
import Navbar from './components/Navbar.jsx'
import Wishlist from './components/Wishlist'

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<Order />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/our-story" element={<OurStory />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Routes>
    </div>
  )
}

export default App

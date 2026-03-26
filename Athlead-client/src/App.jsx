import { Route, Routes } from 'react-router-dom'
import { Dashboard, Events, Home } from './pages'
import Layout from './pages/Layout'
const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Layout/>}>
        <Route index element={<Home/>}/>
        <Route path='/events' element={<Events/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
      </Route>
    </Routes>
  )
}

export default App

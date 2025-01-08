import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import NotFound from './pages/NotFound'
import Chat from './pages/Chat'
import ChatRoomList from './pages/ChatRoomList'
import ChatRoom from './pages/ChatRoom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'  // axios import 추가

// axios 기본 설정
axios.defaults.baseURL = 'http://localhost:8070'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.post['Content-Type'] = 'application/json'

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<ChatRoomList />} />
                <Route path="/chat/ai" element={<Chat />} />  {/* 더 구체적인 경로를 먼저 */}
                <Route path="/chat/:roomId" element={<ChatRoom />} />  {/* 파라미터를 포함한 경로를 나중에 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
        </Layout>
    )
}

export default App
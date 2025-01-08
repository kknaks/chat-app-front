import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactLoading from 'react-loading'
import axios from 'axios'
import { toast } from 'react-toastify'

function ChatRoomList() {
    const [chatRooms, setChatRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [newRoomName, setNewRoomName] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchChatRooms()
    }, [])

    const fetchChatRooms = async () => {
        try {
            const response = await axios.get('http://localhost:8070/api/v1/chat/rooms')
            console.log('서버 응답:', response.data)

            if (response?.data?.success && Array.isArray(response.data.data)) {
                setChatRooms(response.data.data)
            } else {
                setChatRooms([])
                toast.error('채팅방 목록을 불러오는데 실패했습니다.')
            }
        } catch (error) {
            console.error('Error fetching chat rooms:', error)
            setChatRooms([])
            toast.error('서버 연결에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRoom = async (e) => {
        e.preventDefault()
        if (!newRoomName.trim()) return

        try {
            setCreating(true)
            const response = await axios.post('http://localhost:8070/api/v1/chat/rooms', {
                name: newRoomName,
            })
            if (response?.data?.success) {
                setNewRoomName('')
                toast.success('채팅방이 생성되었습니다.')
                await fetchChatRooms()
            } else {
                toast.error('채팅방 생성에 실패했습니다.')
            }
        } catch (error) {
            console.error('Error creating chat room:', error)
            toast.error('채팅방 생성에 실패했습니다.')
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <ReactLoading type="spin" color="#4F46E5" height={50} width={50} />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <form onSubmit={handleCreateRoom} className="mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="새 채팅방 이름을 입력하세요"
                        className="flex-1 px-4 py-2 border rounded"
                        disabled={creating}
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded"
                        disabled={creating}
                    >
                        {creating ? '생성 중...' : '채팅방 만들기'}
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {Array.isArray(chatRooms) && chatRooms.length > 0 ? (
                    chatRooms.map((room) => (
                        <Link
                            key={room.id}
                            to={`/chat/${room.id}`}
                            className="block p-4 bg-white rounded shadow"
                        >
                            <div className="flex justify-between">
                                <h2>{room.name}</h2>
                                <span className="text-sm text-gray-500">
                                    {new Date(room.createDate).toLocaleDateString()}
                                </span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p>생성된 채팅방이 없습니다.</p>
                )}
            </div>
        </div>
    )
}

export default ChatRoomList
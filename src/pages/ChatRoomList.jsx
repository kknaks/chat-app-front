import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactLoading from 'react-loading'
import axios from 'axios'
import { toast } from 'react-toastify'
import { mockChatRooms } from '../mocks/data'

function ChatRoomList() {
    const [chatRooms, setChatRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [newRoomName, setNewRoomName] = useState('')
    const [creating, setCreating] = useState(false)

    const fetchChatRooms = async () => {
        try {
            const response = await axios.get('http://localhost:8070/api/v1/chat/rooms')
            setChatRooms(response.data)
        } catch (error) {
            console.error('Error fetching chat rooms:', error)
            setChatRooms(mockChatRooms)
            toast.warning('테스트 데이터를 표시합니다.')
            // toast.error('채팅방 목록을 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchChatRooms()
    }, [])

    const handleCreateRoom = async (e) => {
        e.preventDefault()
        if (!newRoomName.trim()) return

        try {
            setCreating(true)
            await axios.post('http://localhost:8070/api/v1/chat/rooms', {
                name: newRoomName,
            })
            setNewRoomName('')
            toast.success('채팅방이 생성되었습니다.')
            fetchChatRooms() // 목록 새로고침
        } catch (error) {
            toast.error('채팅방 생성에 실패했습니다.')
            console.error('Error creating chat room:', error)
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <ReactLoading type="spin" color="#4F46E5" height={50} width={50} className="mx-auto mb-4" />
                    <p className="text-gray-600">로딩중...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 채팅방 생성 폼 */}
            <form onSubmit={handleCreateRoom} className="mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="새 채팅방 이름을 입력하세요"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={creating}
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={creating}
                    >
                        {creating ? '생성 중...' : '채팅방 만들기'}
                    </button>
                </div>
            </form>

            {/* 채팅방 목록 */}
            <div className="space-y-4">
                {chatRooms.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">생성된 채팅방이 없습니다.</p>
                ) : (
                    chatRooms.map((room) => (
                        <Link
                            key={room.id}
                            to={`/chat/${room.id}`}
                            className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="font-semibold text-lg">{room.name}</h2>
                                    {room.lastMessage && (
                                        <p className="text-gray-600 text-sm mt-1">{room.lastMessage}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-gray-500">
                                        {new Date(room.createdAt).toLocaleDateString()}
                                    </span>
                                    {room.participantCount && (
                                        <p className="text-xs text-gray-400 mt-1">참여자 {room.participantCount}명</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

export default ChatRoomList

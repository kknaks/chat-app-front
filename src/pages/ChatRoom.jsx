import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import ReactLoading from 'react-loading'
import axios from 'axios'
import { toast } from 'react-toastify'
import { mockChats } from '../mocks/data'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

function ChatRoom() {
    const { roomId } = useParams()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [authorName, setAuthorName] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef(null)
    const [stompClient, setStompClient] = useState(null)
    const [lastMessageId, setLastMessageId] = useState(-1)
    const [roomInfo, setRoomInfo] = useState(null)
    const [participantCount, setParticipantCount] = useState(0)

    // 초기 메시지 로드
    const fetchInitialMessages = async () => {
        try {
            const response = await axios.get(`http://localhost:8070/api/v1/chat/rooms/${roomId}/messages?afterChatMessageId=${lastMessageId}`)
            if (response.data && response.data.data) {
                const newMessages = response.data.data
                if (newMessages.length > 0) {
                    setLastMessageId(newMessages[newMessages.length - 1].id)
                    setMessages(newMessages)
                }
            }
        } catch (error) {
            console.error('Error fetching initial messages:', error)
            setMessages(mockChats)
            toast.warning('테스트 데이터를 표시합니다.')
        } finally {
            setLoading(false)
        }
    }

    // 채팅방 정보 로드 함수
    const fetchRoomInfo = async () => {
        try {
            const response = await axios.get(`http://localhost:8070/api/v1/chat/rooms/${roomId}`)
            if (response.data && response.data.data) {
                setRoomInfo(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching room info:', error)
            toast.error('채팅방 정보를 불러오는데 실패했습니다')
        }
    }

    // STOMP 연결 설정
    useEffect(() => {
        const socket = new SockJS('http://localhost:8070/ws/chat')
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                roomId: roomId
            },
            debug: function (str) {
                console.log(str)
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to STOMP')
                // 메시지 구독
                client.subscribe(`/topic/chat/room/${roomId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body)
                    setMessages(prev => {
                        if (prev.some(msg => msg.id === receivedMessage.id)) {
                            return prev
                        }
                        setLastMessageId(receivedMessage.id)
                        return [...prev, receivedMessage]
                    })
                })


            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame)
                toast.error('채팅 서버 연결에 실패했습니다')
            }
        })

        client.activate()
        setStompClient(client)

        return () => {
            if (client.connected) {
                client.deactivate()
            }
        }
    }, [roomId])

    // 컴포넌트 마운트 시 초팅방 정보도 함께 로드
    useEffect(() => {
        fetchRoomInfo()
        fetchInitialMessages()
    }, [roomId])

    // 새 메시지 수신 시 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !authorName.trim()) return

        try {
            const response = await axios.post(`http://localhost:8070/api/v1/chat/rooms/${roomId}/messages`, {
                content: newMessage,
                author: authorName
            })

            // RsData 응답 처리
            if (response.data.resultCode === '200') {
                setNewMessage('')
            } else {
                toast.error(response.data.msg || '메시지 전송에 실패했습니다')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('메시지 전송에 실패했습니다')
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-indigo-600 text-white p-4">
                    <h1 className="text-xl font-bold">
                        {roomInfo ? roomInfo.name : 'Loading...'}
                    </h1>
                    <p className="text-sm opacity-75">
                        참여자
                    </p>
                </div>

                <div className="h-[600px] overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                        {messages.map((message) => {
                            const isMyMessage = message.writerName === authorName;  // 작성자 이름으로 비교

                            return (
                                <div
                                    key={message.id}
                                    className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                                >
                                    <span className="text-sm font-medium text-gray-600 mb-1 px-2">
                                        {message.writerName || '익명'}
                                    </span>
                                    <div
                                        className={`max-w-[70%] ${isMyMessage
                                            ? 'bg-indigo-500 text-white rounded-l-lg rounded-tr-lg'
                                            : 'bg-white text-gray-800 rounded-r-lg rounded-tl-lg'
                                            } p-3 shadow-md`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className="text-xs text-right mt-1 opacity-75">
                                            {new Date(message.createDate).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            placeholder="작성자 이름"
                            className="w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            전송
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ChatRoom
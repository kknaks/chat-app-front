import { useState, useEffect, useRef } from 'react'
import { mockChats } from '../mocks/data'
import ReactLoading from 'react-loading'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

function Chat() {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef(null)
    const [stompClient, setStompClient] = useState(null)
    const [sessionId, setSessionId] = useState(null)

    // STOMP 연결 설정
    useEffect(() => {
        const socket = new SockJS('http://localhost:8070/ws/chat');
        const client = new Client({
            webSocketFactory: () => socket,
            debug: function (str) {
                console.log(str)
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('STOMP 연결 성공');

                const fullUrl = client.webSocket._transport.url;
                const urlParts = fullUrl.split('/');
                const sid = urlParts[urlParts.length - 2];

                setLoading(false);
                setSessionId(sid);

                const subscription = client.subscribe('/topic/ai', (message) => {
                    console.log('메시지 수신:', message.body);
                    const receivedMessage = JSON.parse(message.body);
                    setMessages(prev => {
                        // 중복 체크: 이미 같은 id의 메시지가 있으면 이전 상태 그대로 반환
                        if (prev.some(msg => msg.id === receivedMessage.id)) {
                            return prev;
                        }
                        return [...prev, {
                            id: receivedMessage.id,
                            content: receivedMessage.aiResponse,
                            createdAt: receivedMessage.createDate,
                            isMyMessage: false,
                            sender: 'AI'
                        }];
                    });
                });

                client.mySubscription = subscription;
            },
        });

        try {
            client.activate();
            setStompClient(client);
        } catch (error) {
            console.error('STOMP 활성화 에러:', error);
            setLoading(false);
        }

        return () => {
            if (client.mySubscription) {
                client.mySubscription.unsubscribe();
            }
            if (client.connected) {
                client.deactivate();
            }
        };
    }, []);
    // useEffect(() => {
    //     const socket = new SockJS('http://localhost:8070/ws/chat')
    //     const client = new Client({
    //         webSocketFactory: () => socket,
    //         debug: function (str) {
    //             console.log(str)
    //         },
    //         reconnectDelay: 5000,
    //         heartbeatIncoming: 4000,
    //         heartbeatOutgoing: 4000,
    //         onConnect: () => {
    //             console.log('Connected to STOMP')
    //             const fullUrl = client.webSocket._transport.url;
    //             console.log('Full WebSocket URL:', fullUrl);  // URL 확인용

    //             // URL에서 실제 세션ID 추출 (마지막에서 두 번째 부분)
    //             const urlParts = fullUrl.split('/');
    //             const sid = urlParts[urlParts.length - 2];
    //             console.log('Extracted Session ID:', sid);

    //             setSessionId(sid)
    //             setLoading(false)  // 여기에 추가

    //             // 구독 경로를 백엔드와 일치시킴
    //             client.subscribe('/topic/ai', (message) => {
    //                 console.log('Received message:', message);
    //                 console.log('Message body:', message.body);

    //                 const receivedMessage = JSON.parse(message.body)
    //                 console.log('Parsed message:', receivedMessage);

    //                 setMessages(prev => [...prev, {
    //                     id: receivedMessage.id,
    //                     content: receivedMessage.aiResponse,  // aiResponse 필드 사용
    //                     createdAt: receivedMessage.createDate,
    //                     isMyMessage: false,
    //                     sender: 'AI'
    //                 }])
    //             })
    //         },
    //         onStompError: (frame) => {
    //             console.error('STOMP error:', frame)
    //             toast.error('채팅 서버 연결에 실패했습니다')
    //         }
    //     })

    //     client.activate()
    //     setStompClient(client)

    //     return () => {
    //         if (client.connected) {
    //             client.deactivate()
    //         }
    //     }
    // }, [])

    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // }, [messages])

    // const handleSubmit = async (e) => {
    //     e.preventDefault()
    //     if (!newMessage.trim() || !sessionId) return

    //     try {
    //         // 내 메시지 추가
    //         const myMessage = {
    //             id: `msg${messages.length + 1}`,
    //             content: newMessage,
    //             createdAt: new Date().toISOString(),
    //             isMyMessage: true,
    //             sender: 'Me'
    //         }
    //         setMessages(prev => [...prev, myMessage])

    //         console.log('Sending message:', {
    //             message: newMessage,
    //             sessionId: sessionId
    //         });

    //         await axios.post('http://localhost:8070/api/v1/chat',
    //             {
    //                 message: newMessage,
    //                 sessionId: sessionId
    //             }
    //         );

    //         setNewMessage('')
    //     } catch (error) {
    //         console.error('Error details:', error.response || error);
    //         toast.error('메시지 전송에 실패했습니다')
    //     }
    // }
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !sessionId) return

        console.log('handleSubmit 시작'); // 추가

        try {
            // 내 메시지 추가
            const myMessage = {
                id: `msg${messages.length + 1}`,
                content: newMessage,
                createdAt: new Date().toISOString(),
                isMyMessage: true,
                sender: 'Me'
            }
            setMessages(prev => [...prev, myMessage])

            console.log('POST 요청 전:', {
                message: newMessage,
                sessionId: sessionId
            });

            const response = await axios.post('http://localhost:8070/api/v1/chat/ai',
                {
                    message: newMessage,
                    sessionId: sessionId
                }
            );

            console.log('POST 요청 응답:', response); // 추가

            setNewMessage('')
        } catch (error) {
            console.error('Error details:', error.response || error);
            toast.error('메시지 전송에 실패했습니다')
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
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* 채팅 헤더 */}
                <div className="bg-indigo-600 text-white p-4">
                    <h1 className="text-xl font-bold">DATA BLOCKS 채팅방</h1>
                    <p className="text-sm opacity-75">Backend Developer들과의 대화</p>
                </div>

                {/* 메시지 목록 */}
                <div className="h-[600px] overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isMyMessage ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                            >
                                {!message.isMyMessage && (
                                    <span className="text-sm text-gray-500">{message.sender}</span>
                                )}
                                <div
                                    className={`max-w-[70%] ${message.isMyMessage
                                        ? 'bg-indigo-500 text-white rounded-l-lg rounded-tr-lg'
                                        : 'bg-white text-gray-800 rounded-r-lg rounded-tl-lg'
                                        } p-3 shadow-md`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs text-right mt-1 opacity-75">
                                        {new Date(message.createdAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* 메시지 입력 */}
                <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            전송
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Chat

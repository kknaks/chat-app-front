import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function ChatRoomList() {
    const [rooms, setRooms] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [newRoomName, setNewRoomName] = useState('')

    const fetchRooms = async () => {
        setIsLoading(true)
        try {
            const response = await axios.get('http://localhost:8070/api/v1/chat/rooms')
            console.log('API Response:', response.data)
            if (response.data?.data) {
                setRooms(response.data.data)
            }
        } catch (err) {
            console.error('Fetching error:', err)
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await axios.post('http://localhost:8070/api/v1/chat/rooms', {
                name: newRoomName
            })
            setNewRoomName('')
            fetchRooms()
        } catch (err) {
            console.error('Creation error:', err)
        }
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="New room name"
                />
                <button type="submit">Create Room</button>
            </form>

            <div>
                {rooms && rooms.length > 0 ? (
                    rooms.map(room => (
                        <div key={room.id}>
                            <Link to={`/chat/${room.id}`}>
                                {room.name} - {new Date(room.createDate).toLocaleDateString()}
                            </Link>
                        </div>
                    ))
                ) : (
                    <div>No chat rooms available</div>
                )}
            </div>
        </div>
    )
}

export default ChatRoomList
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import React, { useRef, useEffect } from "react";

const Chat = () => {
    // 表情面板状态
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    // 输入框消息
    const [message, setMessage] = React.useState("");
    // 【数据库兼容】当前登录用户ID（后续从后端/全局状态获取）
    const currentUserId = "user_123"; // 示例：自己的唯一标识
    // 【数据库兼容】对话列表（后端返回格式示例：包含senderId、receiverId等）
    const [messages, setMessages] = React.useState([
        {
            id: 1,
            senderId: "teacher_456", // 对方ID
            receiverId: currentUserId,
            avatar: "./avatar.png",
            content: "你好！想咨询哪种课程呢？😊",
            time: "10:00",
        },
        {
            id: 2,
            senderId: currentUserId, // 自己ID
            receiverId: "teacher_456",
            avatar: "./my-avatar.png",
            content: "想给孩子调整一下编程课的上课时间,hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
            time: "10:01",
        },
        {
            id: 3,
            senderId: "teacher_456",
            receiverId: currentUserId,
            avatar: "./avatar.png",
            content: "没问题，你提交课表调整申请即可～",
            time: "10:02",
        },
    ]);

    // 用于自动滚动到最新消息的ref
    const messagesEndRef = useRef(null);

    // 选择表情插入输入框
    const handleEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    // 【数据库兼容】发送消息逻辑（后续替换为接口请求）
    const sendMessage = () => {
        if (!message.trim()) return;
        const newMessage = {
            id: Date.now(),
            senderId: currentUserId, // 固定为当前登录用户ID
            receiverId: "teacher_456", // 对方ID（后续从路由/状态获取）
            avatar: "./my-avatar.png",
            content: message,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        // 临时本地更新（后续替换为：调用后端接口，成功后更新列表）
        setMessages((prev) => [...prev, newMessage]);
        setMessage("");
    };

    // 按回车发送
    const handleKeyPress = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    // 自动滚动
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src="./avatar.png" alt="对方头像" />
                    <div className="message">
                        <span>teacher </span>
                        <p>在线</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="电话" />
                    <img src="./video.png" alt="视频" />
                    <img src="./info.png" alt="信息" />
                </div>
            </div>

            <div className="center">
                {/* 【核心】通过senderId判断是否是自己的消息，动态加.me/.other类 */}
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId; // 数据库兼容：对比用户ID
                    return (
                        <div key={msg.id} className={`message-item ${isMe ? "me" : "other"}`}>
                            {isMe ? (
                                <>
                                    <div className="message-content">
                                        <div className="message-bubble">{msg.content}</div>
                                        <span className="message-time">{msg.time}</span>
                                    </div>
                                    <img
                                        src={msg.avatar}
                                        alt={`我的头像`}
                                        className="message-avatar"
                                    />
                                </>
                            ) : (
                                <>
                                    <img
                                        src={msg.avatar}
                                        alt={`对方的头像`}
                                        className="message-avatar"
                                    />
                                    <div className="message-content">
                                        <div className="message-bubble">{msg.content}</div>
                                        <span className="message-time">{msg.time}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="bottom">
                <div className="icons">
                    <img src="./img.png" alt="图片" />
                    <img src="./camera.png" alt="相机" />
                    <img src="./mic.png" alt="麦克风" />
                </div>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <div className="emoji">
                    <img
                        src="./emoji.png"
                        alt="emoji"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                    />
                    {showEmojiPicker && (
                        <EmojiPicker
                            open={showEmojiPicker}
                            onEmojiClick={handleEmojiClick}
                            className="emojiPicker"
                        />
                    )}
                </div>
                <button className="sendChat" onClick={sendMessage}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
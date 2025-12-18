import React from 'react';
import "./chatList.css"

const ChatList = (props) => {
    const [addMore, setAddMore] = React.useState(false);
    return (
        <div className="chatList">
            <div className="search">
                <div className="search-bar">
                    <img src="./search.png" alt="search" />
                    <input type="text" placeholder="Search" />

                </div>
                <img
                    src={addMore ? "./minus.png" : "./plus.png"}
                    alt=""
                    className="add"
                    onClick={() => setAddMore((prev) => !prev)}
                />
            </div>
            <div className="item">
                <img src="./avatar.png" alt="avatar" />
                <div className="texts">
                    <span> teacher 1</span>
                    <p> helloe</p>
                </div>
            </div>
            <div className="item">
                <img src="./avatar.png" alt="avatar" />
                <div className="texts">
                    <span> teacher 1</span>
                    <p> helloe</p>
                </div>
            </div>
            <div className="item">
                <img src="./avatar.png" alt="avatar" />
                <div className="texts">
                    <span> teacher 1</span>
                    <p> helloe</p>
                </div>
            </div>
            <div className="item">
                <img src="./avatar.png" alt="avatar" />
                <div className="texts">
                    <span> teacher 1</span>
                    <p> helloe</p>
                </div>
            </div>
            <div className="item">
                <img src="./avatar.png" alt="avatar" />
                <div className="texts">
                    <span> teacher 1</span>
                    <p> helloe</p>
                </div>
            </div>
        </div>
    )
}
export default ChatList
import "./userInfo.css";

const UserInfo = () => {
    return (
        <div className="userInfo">
            <div className="user">
                <img src="./avatar.png" alt="avatar" />
                <h2>kaiii</h2>
            </div>
            <div className="icons">
                <img src="./more.png" alt="more" />
                <img src="./video.png" alt="vedio" />
                <img src="./edit.png" alt="edit" />
            </div>
        </div>
    );
};

export default UserInfo;
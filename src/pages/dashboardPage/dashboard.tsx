import { RootState } from "../../redux/store";
import { useSelector, useDispatch } from "react-redux";
import SearchIcon from "@mui/icons-material/Search";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MapsUgcIcon from "@mui/icons-material/MapsUgc";
import "./dashboard.css";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { db, auth } from "../../firebase/firebase";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { handleCurrentUser } from "../../redux/slice/authSlice";

function Dashboard() {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const dispatch = useDispatch();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [showProfileBox, setShowProfileBox] = useState(false);

  const getChatId = (id1: string, id2: string) => {
    return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
  };

  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      const Users = await getDocs(collection(db, "users"));
      const userList: any[] = [];

      Users.forEach((doc) => {
        const data = doc.data();
        userList.push({ docId: doc.id, ...data });
      });

      const filteredUsers = userList.filter((u) => u.id !== currentUser.id);
      setUsers(filteredUsers);
    };

    fetchUsers();
  }, [currentUser]);

  const loadMessages = async (receiver: any) => {
    if (!currentUser) return;

    setSelectedUser(receiver);

    const chatId = getChatId(currentUser.id, receiver.id);

    const getMsgInOrder = query(collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const messages = await getDocs(getMsgInOrder);
    const msgList: any[] = [];
    messages.forEach((doc) => msgList.push(doc.data()));

    setMessages(msgList);

    setTimeout(() => {
      const chat = document.querySelector(".chat-messages");
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 200);
  };

  const sendMessage = async () => {
    if (!inputMsg.trim() || !selectedUser || !currentUser) return;

    const chatId = getChatId(currentUser.id, selectedUser.id);

    const newMsg = {
      text: inputMsg,
      sender: currentUser.id,
      receiver: selectedUser.id,
      timestamp: new Date(),
    };

    await addDoc(collection(db, "chats", chatId, "messages"), newMsg);

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg("");

    setTimeout(() => {
      const chat = document.querySelector(".chat-messages");
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 200);
  };

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(handleCurrentUser(null));
    window.location.href = "/";
  };

  if (!currentUser) {
    return <h2 style={{ padding: 20 }}>Please login first...</h2>;
  }

  return (
    <div className="main-container">
      <header>
        <div className="logo">
          <img src="/logo.png" alt="Company Logo" width="200" height="50" />
        </div>

        <div className="icons">
          <SearchIcon />
          <MapsUgcIcon />
          <HomeIcon />
          <FavoriteBorderIcon />

          <img
            src={currentUser.photoUrl || "/defaultImg.jpg"} alt="profile" width="40"  height="40"
            className="header-profile-img"
            onClick={() => setShowProfileBox((prev) => !prev)}

          />

          {showProfileBox && (
            <div className="profile-popup">
              <p className="profile-name">
                {currentUser.userName || currentUser.email}
              </p>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="chat-section">
        <div className="users-section">
          <div className="user-search">
            <input
              type="text"
              className="userSearchInput"
              placeholder="Search user..."
            />
          </div>

          <div className="users-list">
            <TableContainer component={Paper}>
              <Table>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ height: 70, cursor: "pointer" }}
                      onClick={() => loadMessages(user)}
                    >
                      <TableCell sx={{ display: "flex", alignItems: "center" }}>
                        <img
                          src={user.photoUrl || "/defaultImg.jpg"}
                          width="40"
                          height="40"
                          style={{
                            borderRadius: "50%",
                            marginRight: "20px",
                          }}
                        />
                        {user.userName || user.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>

        <div className="chat-page">
          {selectedUser ? (
            <>
              <div className="reciverInfo">
                <img
                  src={selectedUser.photoUrl || "/defaultImg.jpg"}
                  width="45"
                  height="45"
                  style={{ borderRadius: "50%", marginRight: "15px" }}
                />
                <h3>{selectedUser.userName || selectedUser.email}</h3>
              </div>

              <div className="chat-messages">
                {messages.map((msg, index) => {
                  const isMe = msg.sender === currentUser.id;
                  return (
                    <div
                      key={index}
                      className={`message-row ${isMe ? "me" : "them"}`}
                    >
                      <div className="message-bubble">
                        <span className="message-text">{msg.text}</span>
                        <span className="message-time">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="chat-input">
                <button className="btn">
                  <img src="/add.png" width="35" />
                </button>
                <button className="btn">
                  <img src="/emoji.png" width="35" />
                </button>

                <input
                  type="text"
                  placeholder="Message..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />

                <button className="send-btn" onClick={sendMessage}>
                  <img src="/sendBtn.png" width="40" />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">Select a user to chat</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

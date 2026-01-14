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
import { collection, getDocs, addDoc, query, orderBy, onSnapshot, where, or, doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { handleCurrentUser } from "../../redux/slice/authSlice";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { array } from "zod";

function Dashboard() {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const dispatch = useDispatch();
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('')
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [showProfileBox, setShowProfileBox] = useState(false);
  const isSearching = searchInput.trim() === ""

  const getChatId = (id1: string, id2: string) => {
    return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
  };

  useEffect(() => {
    if (!currentUser) return;
    if (isSearching) return;

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

  useEffect(() => {
    if (!currentUser) return;
    const isSearching = searchInput.trim() === ""

    const fetchUsers = async () => {
      const Users = await getDocs(collection(db, "users"));
      const userList: any[] = [];

      Users.forEach((doc) => {
        const data = doc.data();
        userList.push({ docId: doc.id, ...data });
      });

      const searchUser = userList.filter((u) => (u.userName || u.email).toLowerCase().includes(searchInput.toLowerCase()));
      const filteredUsers = searchUser.filter((u) => u.id !== currentUser.id);
      setUsers(filteredUsers);
    };

    fetchUsers();
  }, [searchInput]);









  //  useEffect(() => {
  //   // Query messages for this room
  //   // const q = query(
  //   //   collection(db, 'messages'),
  //   //   orderBy('createdAt', 'asc'),
  //   //   limit(100)
  //   // );
  //   const getMsgInOrder = query(collection(db, "chats", chatId, "messages"),
  //     orderBy("timestamp", "asc")
  //   );


  //   // Subscribe to real-time updates
  //   const unsubscribe = onSnapshot(getMsgInOrder, (snapshot) => {
  //     const newMessages :any = []
  //     snapshot.forEach((doc) => {
  //       newMessages.push({ id: doc.id, ...doc.data() });
  //     });
  //     setMessages(newMessages);
  //     // scrollToBottom();
  //   });

  //   return () => unsubscribe();
  // }, [chatId]);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  const loadMessages = async (receiver: any) => {
    if (!currentUser) return;

    setSelectedUser(receiver);

    const chatId = getChatId(currentUser.id, receiver.id);
    const getMsgInOrder = query(collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(getMsgInOrder, (snapshot) => {
      const newMessages: any = [];
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(newMessages);
    });




    // const getMsgInOrder = query(collection(db, "chats", chatId, "messages"),
    //   orderBy("timestamp", "asc")
    // );
    //  const unsubscribe = onSnapshot(getMsgInOrder, (snapshot) => {
    //   const newMessages: any[] = [];
    //   snapshot.forEach((doc) => {
    //     newMessages.push({ id: doc.id, ...doc.data() });
    //   });
    //   setMessages(newMessages);
    //   scrollToBottom();
    // });


    // const messages = await getDocs(getMsgInOrder);
    // const msgList: any[] = [];
    // messages.forEach((doc) => msgList.push(doc.data()));

    // setMessages(msgList);
    return unsubscribe


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

    setInputMsg("");

    setTimeout(() => {
      const chat = document.querySelector(".chat-messages");
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 200);
  };

  const handleLogout = async () => {
    await signOut(auth);
    if (currentUser) {
      const docRef = doc(db, "users", currentUser?.id)
      console.log("docref", docRef)
      await updateDoc(docRef, {
        isOnline: false
      })
    }
    dispatch(handleCurrentUser(null));
    window.location.href = "/";
  };
  const onEmojiClick = (emojiObject: EmojiClickData) => { return setInputMsg((prev) => prev + emojiObject.emoji) }

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
            src={currentUser.photoUrl || "/defaultImg.jpg"} alt="profile" width="40" height="40"
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="users-list">
            <TableContainer component={Paper}>
              <Table>
                <TableBody>
                  {users ? (users.map((user) => (
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
                        {user.isOnline && <p>online</p>}
                      </TableCell>
                    </TableRow>
                  ))) : (
                    <div>no user found</div>
                  )}
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
                  // const options = { hour: '2-digit', minute: '2-digit' };
                  // const time = new Date(msg.timestamp.seconds).toString()
                  const dateObj = new Date(msg.timestamp.nanoseconds * 1000);
                  let utcString = dateObj.toUTCString();
                  let time = utcString.slice(-11, -4);
                  console.log(msg.timestamp)
                  return (
                    <div
                      key={index}
                      className={`message-row ${isMe ? "me" : "them"}`}
                    >
                      <div className="message-bubble">
                        <span className="message-text">{msg.text}</span>
                        <span className="message-time">
                          {time}
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
                <div className="emoji-section">
                  {showPicker && <EmojiPicker onEmojiClick={onEmojiClick} />}
                </div>
                <button className="emoji-btn" onClick={() => setShowPicker(!showPicker)}>
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

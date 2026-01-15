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
import {collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDocs, limit, startAfter} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { handleCurrentUser } from "../../redux/slice/authSlice";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useNavigate } from "react-router";

function Dashboard() {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const dispatch = useDispatch();
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [lastUserDoc, setLastUserDoc] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const USERS_LIMIT = 10;

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [showProfileBox, setShowProfileBox] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();

  const usersRefDiv = useRef<HTMLDivElement | null>(null);

  const getChatId = (id1: string, id2: string) =>
    id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

  // FIRST LOAD USERS
  const loadInitialUsers = async () => {
    if (!currentUser) return;
    setUsersLoading(true);

    const qUsers = query(
      collection(db, "users"),
      orderBy("userName"),
      limit(USERS_LIMIT)
    );

    const snapshot = await getDocs(qUsers);
    const list: any[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.id !== currentUser.id) list.push(data);
    });

    setUsers(list);
    setLastUserDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setUsersLoading(false);
  };

  // LOAD MORE USERS ON SCROLL
  const loadMoreUsers = async () => {
    if (!currentUser || !lastUserDoc || usersLoading) return;
    setUsersLoading(true);

    const qMore = query(
      collection(db, "users"),
      orderBy("userName"),
      startAfter(lastUserDoc),
      limit(USERS_LIMIT)
    );

    const snapshot = await getDocs(qMore);
    const list: any[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.id !== currentUser.id) list.push(data);
    });

    setUsers((prev) => [...prev, ...list]);
    setLastUserDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setUsersLoading(false);
  };

  useEffect(() => {
    loadInitialUsers();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const all: any[] = [];
      snapshot.forEach((doc) => all.push(doc.data()));

      const filtered = all.filter((u) => u.id !== currentUser.id);
      const search = searchInput.toLowerCase();

      setUsers(
        filtered.filter((u) =>
          (u.userName || u.email)?.toLowerCase().includes(search)
        )
      );
    });

    return () => unsub();
  }, [currentUser, searchInput]);

  const handleScrollUsers = () => {
    const div = usersRefDiv.current;
    if (!div) return;

    if (div.scrollTop + div.clientHeight >= div.scrollHeight - 5) {
      loadMoreUsers();
    }
  };

  const loadMessages = (receiver: any) => {
    if (!currentUser) return;
    setSelectedUser(receiver);

    const chatId = getChatId(currentUser.id, receiver.id);
    const qMsg = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    const unsubTyping = onSnapshot(
      doc(db, "chats", chatId, "typing", receiver.id),
      (snap) => {
        if (snap.exists()) setIsTyping(snap.data().typing === true);
        else setIsTyping(false);
      }
    );

    return () => {
      unsubMsg();
      unsubTyping();
    };
  };
  

  const handleTyping = async () => {
    if (!currentUser || !selectedUser) return;

    const chatId = getChatId(currentUser.id, selectedUser.id);

    await updateDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
      typing: true,
    }).catch(async () => {
      await setDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
        typing: true,
      });
    });

    clearTimeout((window as any).typingTimeout);
    (window as any).typingTimeout = setTimeout(async () => {
      await updateDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
        typing: false,
      }).catch(async () => {
        await setDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
          typing: false,
        });
      });
    }, 2000);
  };

  const sendMessage = async () => {
    if (!inputMsg.trim() || !selectedUser || !currentUser) return;
    const chatId = getChatId(currentUser.id, selectedUser.id);

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: inputMsg,
      sender: currentUser.id,
      receiver: selectedUser.id,
      timestamp: new Date(),
    });

    await updateDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
      typing: false,
    }).catch(() => {});

    setInputMsg("");
  };

  const handleLogout = async () => {
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.id), { isOnline: false });
    }
    await signOut(auth);
    dispatch(handleCurrentUser(null));
    window.location.href = "/";
  };

  const onEmojiClick = (emojiObject: EmojiClickData) =>
    setInputMsg((prev) => prev + emojiObject.emoji);

  if (!currentUser) return <h2>Please login first...</h2>;

  return (
    <div className="main-container">
      <header>
        <div className="logo">
          <img src="/logo.png" width="200" height="50" />
        </div>

        <div className="icons">
          <SearchIcon />
          <MapsUgcIcon />
          <HomeIcon />
          <FavoriteBorderIcon />
          <img
            src={currentUser.photoUrl || "/defaultImg.jpg"}
            width="40"
            height="40"
            className="header-profile-img"
            onClick={() => setShowProfileBox(!showProfileBox)}
          />
          {showProfileBox && (
            <div className="profile-popup">
              <button className="profile-name" onClick={() => navigate("/EditProfile")}>
                Profile
              </button>
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
          <div
            className="users"
            ref={usersRefDiv}
            onScroll={handleScrollUsers}
            style={{ overflowY: "auto", height: "calc(100vh - 140px)" }}
          >
            <TableContainer component={Paper}>
              <Table>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
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
                            style={{ borderRadius: "50%", marginRight: "20px" }}
                          />
                          {user.userName || user.email}
                          {user.isOnline && (
                            <span style={{ color: "green", marginLeft: 10 }}>• online</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell>No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {usersLoading && (
              <p style={{ textAlign: "center", padding: "10px" }}>Loading...</p>
            )}
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
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === currentUser.id;
                  let formatted = "";
                  if (msg.timestamp) {
                    const d = msg.timestamp.toDate?.() || new Date(msg.timestamp);
                    formatted = d.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }
                  return (
                    <div key={idx} className={`message-row ${isMe ? "me" : "them"}`}>
                      <div className="message-bubble">
                        <span className="message-text">{msg.text}</span>
                        <span className="message-time">{formatted}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isTyping && (
                <div
                  style={{
                    fontStyle: "italic",
                    color: "gray",
                    marginLeft: 15,
                    marginBottom: 5,
                  }}
                >
                  {selectedUser.userName || selectedUser.email} is typing...
                </div>
              )}

              <div className="chat-input">
                <button className="btn">
                  <img src="/add.png" width="35" />
                </button>

                <div className="emoji-section">
                  {showPicker && (
                    <div className="emoji-popup">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>

                <button className="emoji-btn" onClick={() => setShowPicker(!showPicker)}>
                  <img src="/emoji.png" width="35" />
                </button>

                <input
                  type="text"
                  placeholder="Message..."
                  value={inputMsg}
                  onChange={(e) => {
                    setInputMsg(e.target.value);
                    handleTyping();
                  }}
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

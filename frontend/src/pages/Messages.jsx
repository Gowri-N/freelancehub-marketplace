import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function Messages() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef(null);

  // =====================================
  // LOAD CONVERSATIONS
  // =====================================

  const fetchConversations = async (
    showLoading = false
  ) => {
    try {
      if (showLoading) {
        setLoadingConversations(true);
      }

      const response = await fetch(
        "http://localhost:5000/api/messages/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setConversations(
          Array.isArray(data) ? data : []
        );
      } else {
        setError(
          data.message ||
            "Unable to load conversations"
        );
      }
    } catch (error) {
      console.error(
        "Conversation error:",
        error
      );

      setError(
        "Unable to connect to server."
      );
    } finally {
      if (showLoading) {
        setLoadingConversations(false);
      }
    }
  };

  // =====================================
  // LOAD PROJECT MESSAGES
  // =====================================

  const fetchMessages = async (
    conversation,
    showLoading = false,
    markAsRead = true
  ) => {
    try {
      if (!conversation) {
        return;
      }

      if (showLoading) {
        setLoadingMessages(true);
      }

      const response = await fetch(
        `http://localhost:5000/api/messages/project/${conversation.projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessages(
          Array.isArray(data) ? data : []
        );

        if (markAsRead) {
          await fetch(
            `http://localhost:5000/api/messages/project/${conversation.projectId}/read`,
            {
              method: "PATCH",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

          setConversations(
            (previous) =>
              previous.map(
                (item) =>
                  item.projectId ===
                  conversation.projectId
                    ? {
                        ...item,
                        unreadCount: 0,
                      }
                    : item
              )
          );
        }
      } else {
        console.error(
          data.message ||
            "Unable to load messages"
        );
      }
    } catch (error) {
      console.error(
        "Messages error:",
        error
      );
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  };

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }

    fetchConversations(true);
  }, []);

  // =====================================
  // AUTO REFRESH CONVERSATIONS
  // =====================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const interval =
      setInterval(() => {
        fetchConversations(false);
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [token]);

  // =====================================
  // AUTO REFRESH SELECTED CHAT
  // =====================================

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    const interval =
      setInterval(() => {
        fetchMessages(
          selectedConversation,
          false,
          true
        );
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedConversation]);

  // =====================================
  // SCROLL TO LATEST MESSAGE
  // =====================================

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages]);

  // =====================================
  // SELECT CONVERSATION
  // =====================================

  const handleSelectConversation = (
    conversation
  ) => {
    setSelectedConversation(
      conversation
    );

    fetchMessages(
      conversation,
      true,
      true
    );
  };

  // =====================================
  // SEND MESSAGE
  // =====================================

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (
      !selectedConversation ||
      !newMessage.trim()
    ) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        "http://localhost:5000/api/messages",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            projectId:
              selectedConversation.projectId,

            receiverId:
              selectedConversation.otherUserId,

            message:
              newMessage.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNewMessage("");

        await fetchMessages(
          selectedConversation,
          false,
          true
        );

        await fetchConversations(false);
      } else {
        setError(
          data.message ||
            "Unable to send message"
        );
      }
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      setError(
        "Unable to connect to server."
      );
    } finally {
      setSending(false);
    }
  };

  // =====================================
  // BACK
  // =====================================

  const handleBack = () => {
    if (user?.role === "client") {
      navigate("/client-dashboard");
    } else {
      navigate(
        "/freelancer-dashboard"
      );
    }
  };

  // =====================================
  // HELPERS
  // =====================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    return String(
      name || "U"
    )
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) =>
          total +
          Number(
            conversation.unreadCount || 0
          ),
        0
      ),
    [conversations]
  );

  const filteredConversations =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return conversations;
      }

      return conversations.filter(
        (conversation) =>
          String(
            conversation.projectTitle || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            conversation.otherUserName || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            conversation.lastMessage || ""
          )
            .toLowerCase()
            .includes(search)
      );
    }, [
      conversations,
      searchTerm,
    ]);

  return (
    <div className="messagesPage">

      {/* HEADER */}

      <div className="messagesPageHeader">

        <div>
          <span className="pageEyebrow">
            Communication
          </span>

          <h1>
            Messages
          </h1>

          <p>
            Keep project conversations
            organised and communicate
            directly with your
            {
              user?.role === "client"
                ? " freelancers."
                : " clients."
            }
          </p>
        </div>

        <button
          className="pageBackButton"
          onClick={handleBack}
        >
          ← Dashboard
        </button>

      </div>

      {/* HERO */}

      <section className="messagesHero">

        <div className="messagesHeroContent">

          <span>
            💬 Project communication
          </span>

          <h2>
            Keep every conversation
            connected to the work.
          </h2>

          <p>
            Messages are organised by
            project so conversations,
            updates and decisions stay
            easy to follow.
          </p>

          <div className="messagesHeroStats">

            <div>
              <strong>
                {
                  conversations.length
                }
              </strong>

              <span>
                Conversations
              </span>
            </div>

            <div>
              <strong>
                {totalUnread}
              </strong>

              <span>
                Unread Messages
              </span>
            </div>

          </div>

        </div>

        <div className="messagesHeroImage">

          <img
            src="https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1000&q=90"
            alt="Professional communication"
          />

        </div>

      </section>

      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}

      {/* MAIN CHAT */}

      <div className="modernMessagesLayout">

        {/* CONVERSATIONS */}

        <aside className="conversationSidebar">

          <div className="conversationSidebarHeader">

            <div>
              <h2>
                Conversations
              </h2>

              <p>
                {
                  conversations.length
                }{" "}
                project chat
                {
                  conversations.length ===
                  1
                    ? ""
                    : "s"
                }
              </p>
            </div>

            {totalUnread > 0 && (
              <span className="totalUnreadBadge">
                {totalUnread}
              </span>
            )}

          </div>

          <div className="conversationSearch">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>

          <div className="conversationList">

            {loadingConversations && (
              <div className="conversationEmpty">
                <span>
                  ⏳
                </span>

                <p>
                  Loading conversations...
                </p>
              </div>
            )}

            {!loadingConversations &&
              filteredConversations.length ===
                0 && (
                <div className="conversationEmpty">

                  <span>
                    💬
                  </span>

                  <p>
                    {searchTerm
                      ? "No matching conversations."
                      : "No conversations yet."}
                  </p>

                </div>
              )}

            {!loadingConversations &&
              filteredConversations.map(
                (conversation) => {
                  const hasUnread =
                    Number(
                      conversation.unreadCount ||
                        0
                    ) > 0;

                  const isSelected =
                    selectedConversation
                      ?.projectId ===
                    conversation.projectId;

                  return (
                    <button
                      type="button"
                      className={`conversationItem ${
                        isSelected
                          ? "selected"
                          : ""
                      } ${
                        hasUnread
                          ? "unread"
                          : ""
                      }`}
                      key={
                        conversation.projectId
                      }
                      onClick={() =>
                        handleSelectConversation(
                          conversation
                        )
                      }
                    >

                      <div className="conversationAvatar">
                        {getInitials(
                          conversation.otherUserName
                        )}

                        {hasUnread && (
                          <span className="conversationOnlineDot"></span>
                        )}
                      </div>

                      <div className="conversationInfo">

                        <div className="conversationTopRow">

                          <strong>
                            {
                              conversation.otherUserName
                            }
                          </strong>

                          {conversation.lastMessageAt && (
                            <small>
                              {formatShortTime(
                                conversation.lastMessageAt
                              )}
                            </small>
                          )}

                        </div>

                        <span className="conversationProjectName">
                          {
                            conversation.projectTitle
                          }
                        </span>

                        <div className="conversationBottomRow">

                          <p>
                            {conversation.lastMessage ||
                              "Start the conversation"}
                          </p>

                          {hasUnread && (
                            <span className="conversationUnreadBadge">
                              {
                                conversation.unreadCount
                              }
                            </span>
                          )}

                        </div>

                      </div>

                    </button>
                  );
                }
              )}

          </div>

        </aside>

        {/* CHAT */}

        <section className="modernChatPanel">

          {!selectedConversation ? (
            <div className="chatWelcomeState">

              <div className="chatWelcomeIllustration">
                💬
              </div>

              <h2>
                Select a conversation
              </h2>

              <p>
                Choose a project
                conversation from the
                left to view messages
                and continue chatting.
              </p>

            </div>
          ) : (
            <>

              {/* CHAT HEADER */}

              <div className="modernChatHeader">

                <div className="chatUserIdentity">

                  <div className="chatHeaderAvatar">
                    {getInitials(
                      selectedConversation.otherUserName
                    )}
                  </div>

                  <div>

                    <span>
                      {
                        selectedConversation.role ===
                        "client"
                          ? "Client"
                          : "Freelancer"
                      }
                    </span>

                    <h2>
                      {
                        selectedConversation.otherUserName
                      }
                    </h2>

                    <p>
                      📁{" "}
                      {
                        selectedConversation.projectTitle
                      }
                    </p>

                  </div>

                </div>

                <div className="chatHeaderStatus">
                  <span></span>
                  Active conversation
                </div>

              </div>

              {/* MESSAGES */}

              <div className="modernMessageList">

                {loadingMessages && (
                  <div className="chatLoadingState">

                    <span>
                      ⏳
                    </span>

                    <p>
                      Loading messages...
                    </p>

                  </div>
                )}

                {!loadingMessages &&
                  messages.length ===
                    0 && (
                    <div className="chatStartState">

                      <div>
                        👋
                      </div>

                      <h3>
                        Start the conversation
                      </h3>

                      <p>
                        Send a message about{" "}
                        <strong>
                          {
                            selectedConversation.projectTitle
                          }
                        </strong>
                        .
                      </p>

                    </div>
                  )}

                {!loadingMessages &&
                  messages.map(
                    (message) => {
                      const senderId =
                        typeof message.senderId ===
                        "object"
                          ? message.senderId?._id
                          : message.senderId;

                      const isMine =
                        senderId ===
                          user?._id ||
                        senderId ===
                          user?.id;

                      const senderName =
                        isMine
                          ? "You"
                          : message.senderId
                              ?.name ||
                            message.senderName ||
                            selectedConversation.otherUserName ||
                            "User";

                      return (
                        <div
                          className={`messageRow ${
                            isMine
                              ? "mine"
                              : "theirs"
                          }`}
                          key={
                            message._id
                          }
                        >

                          {!isMine && (
                            <div className="messageAvatar">
                              {getInitials(
                                senderName
                              )}
                            </div>
                          )}

                          <div className="messageBubbleWrapper">

                            <div className="messageSenderRow">

                              <strong>
                                {
                                  senderName
                                }
                              </strong>

                              <small>
                                {formatDate(
                                  message.createdAt
                                )}
                              </small>

                            </div>

                            <div className="modernMessageBubble">

                              <p>
                                {
                                  message.message
                                }
                              </p>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                <div
                  ref={
                    messagesEndRef
                  }
                ></div>

              </div>

              {/* INPUT */}

              <form
                className="modernMessageComposer"
                onSubmit={
                  handleSendMessage
                }
              >

                <div className="messageInputWrapper">

                  <span>
                    💬
                  </span>

                  <textarea
                    rows="1"
                    placeholder={`Message ${selectedConversation.otherUserName} about ${selectedConversation.projectTitle}...`}
                    value={
                      newMessage
                    }
                    onChange={(event) =>
                      setNewMessage(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();

                        handleSendMessage(
                          event
                        );
                      }
                    }}
                  />

                </div>

                <button
                  className="messageSendButton"
                  type="submit"
                  disabled={
                    sending ||
                    !newMessage.trim()
                  }
                >
                  {sending
                    ? "Sending..."
                    : "Send ➤"}
                </button>

              </form>

              <div className="messageComposerHint">
                Press Enter to send •
                Shift + Enter for a
                new line
              </div>

            </>
          )}

        </section>

      </div>

    </div>
  );
}

export default Messages;
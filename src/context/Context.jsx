import { createContext, useState } from "react";
import { callOpenRouter } from "../utils/openrouter";
import { api } from "../api"; // Added API import for LLM logic

export const Context = createContext();

const ContextProvider = ({ children }) => {
  // ==========================================
  // NORMAL CHAT STATE
  // ==========================================
  const [input, setInput] = useState("");
  const [PageView, setPageView] = useState("llm-chat"); // 'llm-chat' or 'normal-chat'
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentChat, setCurrentChat] = useState({
    id: Date.now(),
    messages: [],
  });
  const [chats, setChats] = useState([]);

  // ==========================================
  // LLM CHAT STATE (Moved from LLMchat component)
  // ==========================================
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLLMLoading, setIsLLMLoading] = useState(false);

  // ==========================================
  // NORMAL CHAT FUNCTIONS
  // ==========================================
  const onSent = async (prompt, image = null) => {
    if (!prompt && !image) return;

    setShowResult(true);
    setLoading(true);

    const userMessage = { role: "user", text: prompt, image: image || null };
    const updatedMessages = [...currentChat.messages, userMessage];

    setCurrentChat({ id: currentChat.id, messages: updatedMessages });

    try {
      const reply = await callOpenRouter(updatedMessages);
      const words = reply.split(" ");
      let typedText = "";

      const maxDuration = 5000;
      const delay = Math.max(10, Math.min(40, maxDuration / words.length));

      setCurrentChat({
        id: currentChat.id,
        messages: [...updatedMessages, { role: "assistant", text: "" }],
      });

      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        typedText += words[i] + " ";
        setCurrentChat({
          id: currentChat.id,
          messages: [...updatedMessages, { role: "assistant", text: typedText }],
        });
      }

      const finalMessages = [...updatedMessages, { role: "assistant", text: reply }];
      const updatedChat = { id: currentChat.id, messages: finalMessages };

      setChats((prev) => {
        const exists = prev.find((chat) => chat.id === updatedChat.id);
        return exists
          ? prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
          : [...prev, updatedChat];
      });
    } catch (err) {
      setCurrentChat({
        id: currentChat.id,
        messages: [...updatedMessages, { role: "assistant", text: "Something went wrong." }],
      });
    }
    setLoading(false);
  };

  const newChat = () => {
    if (currentChat.messages.length > 0 && !chats.find((chat) => chat.id === currentChat.id)) {
      setChats((prev) => [...prev, currentChat]);
    }
    setCurrentChat({ id: Date.now(), messages: [] });
    setShowResult(false);
    setInput("");
  };

  const openChat = (chat) => {
    setCurrentChat(chat);
    setShowResult(true);
  };

  // ==========================================
  // LLM CHAT FUNCTIONS
  // ==========================================
  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations([
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...conversations,
      ]);
      setCurrentConversationId(newConv.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleSendLLMMessage = async (content) => {
    if (!currentConversationId) return;

    setIsLLMLoading(true);
    try {
      // Optimistically add user message to UI
      const userMessage = { role: "user", content };
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Create a partial assistant message that will be updated progressively
      const assistantMessage = {
        role: "assistant",
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: { stage1: false, stage2: false, stage3: false },
      };

      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send message with streaming
      await api.sendMessageStream(currentConversationId, content, (eventType, event) => {
        switch (eventType) {
          case "stage1_start":
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              messages[messages.length - 1].loading.stage1 = true;
              return { ...prev, messages };
            });
            break;
          case "stage1_complete":
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              messages[messages.length - 1].stage1 = event.data;
              messages[messages.length - 1].loading.stage1 = false;
              return { ...prev, messages };
            });
            break;
          case "stage2_start":
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              messages[messages.length - 1].loading.stage2 = true;
              return { ...prev, messages };
            });
            break;
          case "stage2_complete":
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              messages[messages.length - 1].stage2 = event.data;
              messages[messages.length - 1].metadata = event.metadata;
              messages[messages.length - 1].loading.stage2 = false;
              return { ...prev, messages };
            });
            break;
          case "stage3_start":
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              messages[messages.length - 1].loading.stage3 = true;
              return { ...prev, messages };
            });
            break;
          case "stage3_complete":
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              messages[messages.length - 1].stage3 = event.data;
              messages[messages.length - 1].loading.stage3 = false;
              return { ...prev, messages };
            });
            break;
          case "title_complete":
          case "complete":
            loadConversations();
            if (eventType === "complete") setIsLLMLoading(false);
            break;
          case "error":
            console.error("Stream error:", event.message);
            setIsLLMLoading(false);
            break;
          default:
            console.log("Unknown event type:", eventType);
        }
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setCurrentConversation((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -2),
      }));
      setIsLLMLoading(false);
    }
  };

  const value = {
    // Normal Chat Values
    input, setInput,
    loading, showResult, setShowResult,
    onSent, currentChat, chats,
    newChat, openChat,
    PageView, setPageView,
    
    // LLM Chat Values
    conversations, currentConversationId, currentConversation, isLLMLoading,
    loadConversations, loadConversation, handleNewConversation, handleSelectConversation, handleSendLLMMessage
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export default ContextProvider;
const API_BASE = "http://localhost:8000";

export const api = {

  async listConversations(userId) {

    const res = await fetch(
      `${API_BASE}/api/conversations?user_id=${userId}`
    );

    if (!res.ok) {
      throw new Error("Failed to list conversations");
    }

    return res.json();
  },

  async createConversation(userId) {

    const res = await fetch(
      `${API_BASE}/api/conversations?user_id=${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({})
      }
    );

    if (!res.ok) {
      throw new Error("Failed to create conversation");
    }

    return res.json();
  },

  async getConversation(conversationId) {

    const res = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`
    );

    if (!res.ok) {
      throw new Error("Failed to get conversation");
    }

    return res.json();
  },

  async sendMessageStream(conversationId, content, onEvent) {

    const res = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      }
    );

    if (!res.ok) {
      throw new Error("Failed streaming response");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {

      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");

      buffer = parts.pop();

      for (const part of parts) {

        const line = part.trim();

        if (line.startsWith("data: ")) {

          const json = line.slice(6);

          const event = JSON.parse(json);

          onEvent(event.type, event);
        }
      }
    }
  },
};
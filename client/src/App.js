import React, { useState } from "react";
import { Input, Button, List, Typography, Layout, Space } from "antd";
import axios from "axios";

const { Header, Content, Footer } = Layout;

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input) return;

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }]);

    try {
      const res = await axios.post("/api/ask", { message: input });
      const reply = res.data.reply;

      // Add AI reply
      setMessages(prev => [...prev, { role: "ai", content: reply }]);
      setInput("");
    } catch (err) {
      console.error("Axios error:", err);
      setMessages(prev => [...prev, { role: "ai", content: "❌ Error contacting server" }]);
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Header style={{ color: "white", fontSize: 20 }}>AI Chat</Header>
      <Content style={{ padding: "20px" }}>
        <List
          bordered
          dataSource={messages}
          renderItem={(item) => (
            <List.Item>
              <Typography.Text strong>
                {item.role === "user" ? "You: " : "AI: "}
              </Typography.Text>
              {item.content}
            </List.Item>
          )}
          style={{ marginBottom: "20px", height: "70vh", overflowY: "auto" }}
        />
        <Space style={{ width: "100%" }}>
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={sendMessage}
            style={{ flex: 1 }}
          />
          <Button type="primary" onClick={sendMessage}>Send</Button>
        </Space>
      </Content>
      <Footer style={{ textAlign: "center" }}>AI Agent Demo</Footer>
    </Layout>
  );
}

export default App;

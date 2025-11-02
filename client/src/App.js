import React, { useState } from "react";
import { Input, Button, List, Typography, Layout, Space, Upload, message  } from "antd";
import { UploadOutlined, SendOutlined } from "@ant-design/icons";
import axios from "axios";

const { Header, Content, Footer } = Layout;

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);


  const handleUpload = async () => {
    // check if file is received
    if (!file) {
      message.error("Please upload a file first");
      return;
    }

    // file received, start uploading
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const { message: reply, length } = res.data;

      setMessages(prev => [...prev, 
        { role : "user", content: `File uploaded successfully` },
        { role: "ai", content: `✅ ${reply} (${length} characters parsed)` }]);
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      message.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

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
      <Header style={{ color: "white", fontSize: 20 }}>Your AI Agent</Header>
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

        <Space style={{ width: "100%", marginBottom: "10px" }}>
        <Upload
          beforeUpload={(file) => {
            setFile(file);  
            return false;  
          }}
          onRemove={() => setFile(null)} 
          maxCount={1}
          showUploadList={{ showRemoveIcon: true }}
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>

          <Button
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </Space>

        <Space style={{ width: "100%" }}>
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={sendMessage}
            style={{ flex: 1 }}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={sendMessage}>
           Send
          </Button>
        </Space>
      </Content>
      <Footer style={{ textAlign: "center" }}>AI Agent Demo</Footer>
    </Layout>
  );
}

export default App;

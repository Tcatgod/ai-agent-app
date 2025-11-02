This is an AI agent app using openAI API
 
Please initialize all the packages:
```bash
cd server
npm init -y
npm install express cors openai dotenv chromadb body-parser
```

```bash
cd client
npx create-react-app .
npm install antd axios

```

Also, you need to set up the environment in the server

```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=5001
```

Then, you can run server and client

```bash
cd server
node index.js
cd ../client
npm start
```

To support file upload, download these dependencies

```bash
cd server
npm install multer pdf-parse mammoth
```

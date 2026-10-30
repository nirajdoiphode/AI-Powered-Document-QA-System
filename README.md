# RAG Chat System

A Retrieval-Augmented Generation (RAG) application built with Spring Boot, Spring AI, Google Gemini, Pinecone, Apache Tika, and a React/Vite user interface.

Users enter a required question and may optionally upload a document. The application extracts text, avoids indexing duplicate files, splits text into chunks, stores embeddings in Pinecone, retrieves relevant context, and sends that context to Gemini before returning an answer.

## Project Description

The main workflow is:

1. The user enters a required question.
2. The user optionally attaches a PDF, DOC, DOCX, or TXT file.
3. Apache Tika extracts text from the file.
4. A SHA-256 hash prevents duplicate indexing.
5. `TokenTextSplitter` splits the text into approximately 800-token chunks.
6. Spring AI generates embeddings and stores the chunks in Pinecone.
7. Pinecone searches for chunks relevant to the question.
8. `QuestionAnswerAdvisor` adds the retrieved context to the Gemini prompt.
9. Gemini generates the final answer.

## Demonstration Video

demonstration video link here:

[Watch the project demonstration](https://youtu.be/LKu5yQoGkH8?si=y5N1a15A7jonCRUQ)
<br><br>
Live Project: https://nexaigen2.vercel.app/
---

## Screenshots

Add screenshots to this section after uploading them to the repository.

### User Interface

<!-- Replace the placeholder path with the real screenshot path. -->

<img width="1310" height="638" alt="image" src="https://github.com/user-attachments/assets/2f0dc136-5236-4697-89c6-574d1f0625ae" />



### Generated Answer

<!-- Replace the placeholder path with the real screenshot path. -->

<img width="1294" height="631" alt="image" src="https://github.com/user-attachments/assets/98913a84-4b74-418d-b045-6ef8c1c722ee" />


## Architecture

```text
React/Vite UI
       |
       | multipart/form-data
       v
Spring Boot RAGController
       |
       +--> Apache Tika extracts document text
       +--> SHA-256 duplicate-file check
       +--> TokenTextSplitter creates chunks
       +--> Gemini Embedding Model
       |          |
       |          v
       |     Pinecone Vector Store
       |          |
       |          v
       +--> Similarity search for the question
                  |
                  v
             Gemini Chat Model
                  |
                  v
             Answer returned to UI
```

## Repository Structure

```text
.
├── UI/
│   ├── src/                 # React application source
│   ├── package.json         # Frontend dependencies and scripts
│   └── vite.config.js       # Vite development server configuration
└── SPRINGBOOT/
    └── SpringAiDemo/
        ├── src/main/java/   # Spring Boot controllers and services
        ├── src/main/resources/application.properties
        ├── pom.xml
        └── README.md
```
## FlowChart

<img width="3094" height="4575" alt="Rag System Flowchart" src="https://github.com/user-attachments/assets/27b006e5-e2ba-434f-84ea-8e5f1a080ba9" />


## Technology Stack

- Java 17
- Spring Boot 4.1.1
- Spring AI 2.0.1
- Google Gemini chat model
- Google Gemini embedding model: `gemini-embedding-001`
- Pinecone vector database
- Apache Tika document text extraction
- React 19
- Vite 7
- Maven

## Prerequisites

- Java Development Kit 17 or newer
- Maven, or the Maven Wrapper included in the project
- Node.js and npm
- A Google Gemini API key
- A Pinecone API key
- A Pinecone index named `rag-index`

The Pinecone index must use the same vector dimension as the configured embedding model. This project is configured for dimension `768`.

## Configuration

Do not commit API keys to GitHub. Configure the application with environment variables.

Update `src/main/resources/application.properties` so the credential properties use placeholders:

```properties
spring.ai.google.genai.api-key=${GOOGLE_API_KEY}
spring.ai.google.genai.embedding.api-key=${GOOGLE_API_KEY}
spring.ai.vectorstore.pinecone.api-key=${PINECONE_API_KEY}
```

The important application settings are:

```properties
spring.ai.google.genai.chat.model=gemini-3.1-flash-lite
spring.ai.google.genai.embedding.text.model=gemini-embedding-001
spring.ai.google.genai.embedding.text.dimensions=768
spring.ai.vectorstore.pinecone.index-name=rag-index
spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB
```

### Windows PowerShell

Set the variables in the terminal before starting Spring Boot:

```powershell
$env:GOOGLE_API_KEY="your-google-api-key"
$env:PINECONE_API_KEY="your-pinecone-api-key"
```

For persistent user-level variables, use a new terminal after running:

```powershell
[Environment]::SetEnvironmentVariable("GOOGLE_API_KEY", "your-google-api-key", "User")
[Environment]::SetEnvironmentVariable("PINECONE_API_KEY", "your-pinecone-api-key", "User")
```

## Run the Backend

Open a terminal in `SPRINGBOOT/SpringAiDemo`:

```powershell
mvn spring-boot:run
```

Alternatively, use the included wrapper:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs at `http://localhost:8080`.

## Run the Frontend

Open a second terminal in the `UI` folder:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

The UI defaults to `http://localhost:8080` for the backend. To configure another backend URL:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

## API Endpoints

### Ask a question with an optional document

```text
POST /api/documents/ask
Content-Type: multipart/form-data
```

Required form field:

```text
question=What are the main points in this document?
```

Optional form field:

```text
file=<document>
```


## Troubleshooting

### Gemini connection fails

Confirm that `GOOGLE_API_KEY` is set in the same terminal used to start Spring Boot.

### Pinecone rejects vectors

Confirm that the Pinecone index dimension is `768` and that the index name is `rag-index`.

### Upload fails

The configured maximum upload size is 20 MB. Confirm that the file is readable and that Apache Tika can extract text from it.

### Frontend cannot reach the backend

Confirm that Spring Boot is running on port `8080` and the UI is running on port `3000`.

---

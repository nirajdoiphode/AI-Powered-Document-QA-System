import { useRef, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function App() {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState([]);
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('Upload a document or image');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const showNotice = (message) => {
        setNotice(message);
        window.setTimeout(() => setNotice(''), 4200);
    };

    const handleFiles = (event) => {
        const selected = Array.from(event.target.files || []).slice(0, 1);
        if (!selected.length) return;

        setFiles(selected);
        setStatus(`Document ready: ${selected[0].name}`);
        showNotice('Document ready to send with your question');
    };

    const askModel = async (event) => {
        event?.preventDefault();
        const question = prompt.trim();
        if (!question || loading) return;

        setMessages((current) => [...current, { role: 'user', text: question }]);
        setPrompt('');
        setLoading(true);
        setStatus(files[0] ? `Sending ${files[0].name}...` : 'Sending question...');

        try {
            const formData = new FormData();
            formData.append('question', question);
            if (files[0]) formData.append('file', files[0]);

            const response = await fetch(`${API_BASE_URL}/api/documents/ask`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Request failed');
            const answer = await response.text();
            setMessages((current) => [...current, { role: 'assistant', text: answer || 'The model returned an empty response.' }]);
            setStatus(files[0] ? `${files[0].name} processed` : 'Question sent');
        } catch {
            setMessages((current) => [...current, {
                role: 'assistant',
                text: 'Request failed. Reconnecting....',
            }]);
            setStatus('Request failed');
            showNotice('Could not connect to the Model. Please try again');
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        setMessages([]);
        setPrompt('');
        setFiles([]);
        setStatus('Upload a document or image');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="page">
            <header className="nav-bar">
                <a className="logo" href="#top">RAG <span>Chat</span></a>
                <nav aria-label="Main navigation">
                    <a className="active" href="#chat">Chat</a>
                </nav>
                <div className="nav-actions">

                    <button className="new-chat" type="button" onClick={startNewChat}>New chat</button>
                </div>
            </header>

            <main className="chat-area" id="chat">
                {messages.length === 0 ? (
                    <section className="empty-state">
                        <div className="brand-icon" aria-hidden="true">✦</div>
                        <h1>Ask your documents</h1>
                        <p>Upload a document and ask a question about it.</p>
                    </section>
                ) : (
                    <section className="messages" aria-live="polite">
                        {messages.map((message, index) => (
                            <article className={`message ${message.role}-message`} key={`${message.role}-${index}`}>
                                <div className="message-label">{message.role === 'user' ? 'You' : 'AI response'}</div>
                                <div className={`message-card ${message.role === 'user' ? 'user-card' : 'assistant-card'}`}>
                                    <p>{message.text}</p>
                                    {message.role === 'assistant' && files.length > 0 && (
                                        <div className="source-line"><span>Source:</span><span className="source-name">{files[0].name}</span></div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </main>

            <footer className="composer-area">
                <div className="composer-wrap">
                    <form className="composer" onSubmit={askModel}>
                        <label className="upload-button" htmlFor="fileInput" title="Upload a document" aria-label="Upload a document">
                            ↑
                            <input ref={fileInputRef} id="fileInput" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFiles} />
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    askModel(event);
                                }
                            }}
                            rows="1"
                            placeholder="Enter prompt / text"
                            aria-label="Enter prompt or text"
                        />
                        <button className="send-button" type="submit" disabled={loading} aria-label="Send prompt">{loading ? '…' : '↗'}</button>
                    </form>
                    <div className="composer-meta"><span>{status}</span><span>Press Enter to send</span></div>
                </div>
            </footer>
            {notice && <div className="toast" role="status">{notice}</div>}
        </div>
    );
}

export default App;

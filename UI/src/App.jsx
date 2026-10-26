import { useRef, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const shortFileName = (name) => (
    name.length > 15 ? `${name.slice(0, 12)}...` : name
);

function App() {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState([]);
    const [files, setFiles] = useState([]);
    const [fileNeedsProcessing, setFileNeedsProcessing] = useState(false);
    const [status, setStatus] = useState('Upload a document or image');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [displayedProgress, setDisplayedProgress] = useState(0);
    const fileInputRef = useRef(null);
    const progressAnimationRef = useRef(null);
    const progressStartedRef = useRef(false);

    const animateProgressTo = (target) => {
        const nextTarget = Math.max(0, Math.min(100, Number(target) || 0));
        if (progressAnimationRef.current) {
            window.clearInterval(progressAnimationRef.current);
        }

        progressAnimationRef.current = window.setInterval(() => {
            setDisplayedProgress((current) => {
                if (current >= nextTarget) {
                    window.clearInterval(progressAnimationRef.current);
                    progressAnimationRef.current = null;
                    return current;
                }
                return Math.min(current + 1, nextTarget);
            });
        }, 120);
    };

    const showNotice = (message) => {
        setNotice(message);
        window.setTimeout(() => setNotice(''), 4200);
    };

    const handleFiles = (event) => {
        const selected = Array.from(event.target.files || []).slice(0, 1);
        if (!selected.length) return;

        setFiles(selected);
        setFileNeedsProcessing(true);
        setStatus(`Document ready: ${selected[0].name}`);
        showNotice('Document ready to send with your question');
    };

    const removeSelectedFile = () => {
        setFiles([]);
        setFileNeedsProcessing(false);
        setProgress(null);
        setDisplayedProgress(0);
        setStatus('Upload a document or image');
        if (progressAnimationRef.current) {
            window.clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const askModel = async (event) => {
        event?.preventDefault();
        const question = prompt.trim();
        if (!question || loading) return;

        setMessages((current) => [...current, { role: 'user', text: question }]);
        setPrompt('');
        setLoading(true);
        setStatus(files[0] ? `Sending ${files[0].name}...` : 'Sending question...');

        let progressTimer;
        let requestSucceeded = false;
        const shouldShowProgress = Boolean(files[0] && fileNeedsProcessing);
        if (!shouldShowProgress) {
            setProgress(null);
            setDisplayedProgress(0);
            if (progressAnimationRef.current) {
                window.clearInterval(progressAnimationRef.current);
                progressAnimationRef.current = null;
            }
        }
        if (shouldShowProgress) {
            progressStartedRef.current = false;
            setDisplayedProgress(0);
            setProgress({
                status: 'EMBEDDING',
                totalChunks: 0,
                completedChunks: 0,
                percentage: 0
            });

            const refreshProgress = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/documents/progress`);
                    if (!response.ok) return;
                    const nextProgress = await response.json();
                    if (nextProgress.status === 'EMBEDDING') {
                        progressStartedRef.current = true;
                    }
                    if (nextProgress.status === 'COMPLETED' && !progressStartedRef.current) {
                        return;
                    }
                    setProgress(nextProgress);
                    animateProgressTo(nextProgress.percentage);
                } catch {
                    // The main request reports the actionable error.
                }
            };

            refreshProgress();
            progressTimer = window.setInterval(refreshProgress, 1000);
        }

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
            requestSucceeded = true;
            if (files[0]) setFileNeedsProcessing(false);
        } catch {
            setMessages((current) => [...current, {
                role: 'assistant',
                text: 'Request failed. Reconnecting....',
            }]);
            setStatus('Request failed');
            showNotice('Could not connect to the Model. Please try again');
        } finally {
            if (progressTimer) window.clearInterval(progressTimer);
            setLoading(false);
            if (shouldShowProgress && requestSucceeded) {
                animateProgressTo(100);
                setProgress((current) => current ? {
                    ...current,
                    status: 'COMPLETED',
                    percentage: 100,
                    completedChunks: current.totalChunks || current.completedChunks
                } : null);
                window.setTimeout(() => setProgress(null), 1800);
            } else if (shouldShowProgress) {
                if (progressAnimationRef.current) {
                    window.clearInterval(progressAnimationRef.current);
                    progressAnimationRef.current = null;
                }
                setProgress(null);
                setDisplayedProgress(0);
            }
        }
    };

    const startNewChat = () => {
        setMessages([]);
        setPrompt('');
        setFiles([]);
        setFileNeedsProcessing(false);
        setStatus('Upload a document or image');
        setProgress(null);
        setDisplayedProgress(0);
        if (progressAnimationRef.current) {
            window.clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }
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
                        {files[0] && (
                            <div className="selected-file" title={files[0].name}>
                                <span className="document-icon" aria-hidden="true">▤</span>
                                <span className="selected-file-name">{shortFileName(files[0].name)}</span>
                                <button className="remove-file" type="button" onClick={removeSelectedFile} aria-label={`Remove ${files[0].name}`} title="Remove document">×</button>
                            </div>
                        )}
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
            {progress && (
                <div className="progress-floating" role="status" aria-live="polite">
                    <div className="progress-heading">
                        <span>{progress.status === 'COMPLETED' ? 'Document ready' : 'Indexing document'}</span>
                        <strong>{displayedProgress}%</strong>
                    </div>
                    <div className="progress-track" aria-hidden="true">
                        <span style={{ width: `${displayedProgress}%` }} />
                    </div>
                    <div className="progress-details">
                        <span>{progress.completedChunks ?? 0} / {progress.totalChunks ?? 0} chunks confirmed</span>
                        <span>{progress.status}</span>
                    </div>
                </div>
            )}
            {notice && <div className="toast" role="status">{notice}</div>}
        </div>
    );
}

export default App;

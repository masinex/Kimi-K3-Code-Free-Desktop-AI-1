import { FormEvent, KeyboardEvent, useState } from 'react'

type Message = {
	role: 'user' | 'assistant'
	content: string
}

const defaultEndpoint = 'https://api.moonshot.ai/v1'

function App() {
	const [messages, setMessages] = useState<Message[]>([])
	const [draft, setDraft] = useState('')
	const [apiKey, setApiKey] = useState('')
	const [model, setModel] = useState('kimi-k3')
	const [endpoint, setEndpoint] = useState(defaultEndpoint)
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')

	async function sendMessage(event?: FormEvent) {
		event?.preventDefault()
		const content = draft.trim()
		if (!content || busy) return
		if (!apiKey.trim()) {
			setSettingsOpen(true)
			setError('Add your Moonshot API key in settings to start a chat.')
			return
		}

		const conversation = [...messages, { role: 'user' as const, content }]
		setMessages(conversation)
		setDraft('')
		setError('')
		setBusy(true)

		try {
			const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ model, messages: conversation, stream: false }),
			})
			const result = await response.json()
			if (!response.ok) {
				throw new Error(result.error?.message || `Request failed (${response.status})`)
			}
			const answer = result.choices?.[0]?.message?.content
			if (typeof answer !== 'string') throw new Error('The API returned no message.')
			setMessages([...conversation, { role: 'assistant', content: answer }])
		} catch (requestError) {
			setMessages(conversation)
			setError(requestError instanceof Error ? requestError.message : 'The request failed.')
		} finally {
			setBusy(false)
		}
	}

	function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			void sendMessage()
		}
	}

	function startNewChat() {
		setMessages([])
		setDraft('')
		setError('')
	}

	return (
		<main className="app-shell">
			<aside className="sidebar">
				<div className="brand"><span className="brand-mark">K</span><span>KIMI <b>CODE</b></span></div>
				<button className="new-chat" onClick={startNewChat}><span>＋</span> New chat</button>
				<div className="side-label">WORKSPACE</div>
				<button className="nav-item active"><span className="nav-glyph">◷</span> Chat</button>
				<button className="nav-item" onClick={() => setSettingsOpen(true)}><span className="nav-glyph">⚙</span> Model settings</button>
				<div className="sidebar-spacer" />
				<div className="connection"><span className={apiKey ? 'status-dot ready' : 'status-dot'} />{apiKey ? 'API key configured' : 'API key needed'}</div>
				<div className="sidebar-foot">KIMI CODE DESK <span>LOCAL SESSION</span></div>
			</aside>

			<section className="workspace">
				<header className="topbar">
					<div className="crumb">Chat <span>/</span> <strong>New conversation</strong></div>
					<div className="top-actions">
						<div className="model-chip"><span className="model-dot" />{model}</div>
						<button className="settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings" title="Settings">⚙</button>
					</div>
				</header>

				<div className="chat-scroll">
					{messages.length === 0 ? (
						<div className="welcome">
							<div className="welcome-kicker"><span className="model-dot" /> YOUR CODING WORKSPACE</div>
							<h1>What are we<br /><em>building</em> today?</h1>
							<p>Ask a question, explore an idea, or work through a tricky bug.</p>
							<div className="prompt-grid">
								<button onClick={() => setDraft('Help me understand this code: ')}><span>01</span><strong>Explain a codebase</strong><small>Trace the flow and find the important parts</small></button>
								<button onClick={() => setDraft('Help me debug this error: ')}><span>02</span><strong>Debug an issue</strong><small>Share an error and work toward a fix</small></button>
								<button onClick={() => setDraft('Help me write a function that ')}><span>03</span><strong>Write something</strong><small>Turn a clear spec into working code</small></button>
							</div>
						</div>
					) : (
						<div className="message-list">
							{messages.map((message, index) => (
								<article className={`message ${message.role}`} key={`${index}-${message.role}`}>
									<div className="message-avatar">{message.role === 'user' ? 'Y' : 'K'}</div>
									<div className="message-body"><div className="message-author">{message.role === 'user' ? 'You' : 'Kimi'}</div><p>{message.content}</p></div>
								</article>
							))}
							{busy && <div className="thinking"><span /><span /><span /> Kimi is thinking</div>}
							<div className="end-anchor" />
						</div>
					)}
				</div>

				<div className="composer-wrap">
					{error && <div className="error-banner">{error}</div>}
					<form className="composer" onSubmit={sendMessage}>
						<textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onComposerKeyDown} placeholder="Ask Kimi anything about code..." rows={2} />
						<div className="composer-bottom"><span>ENTER TO SEND <i>·</i> SHIFT + ENTER FOR NEW LINE</span><button type="submit" disabled={busy || !draft.trim()} aria-label="Send message">{busy ? '…' : '↑'}</button></div>
					</form>
					<div className="disclaimer">Kimi can make mistakes. Verify important code before using it.</div>
				</div>
			</section>

			{settingsOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
				<section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
					<div className="modal-heading"><div><span className="modal-kicker">CONNECTION</span><h2 id="settings-title">Model settings</h2></div><button className="close-button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button></div>
					<label>API endpoint<input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder={defaultEndpoint} /></label>
					  <label>Model<input value={model} onChange={(event) => setModel(event.target.value)} placeholder="kimi-k3" /></label>
					<label>Moonshot API key<input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Enter your API key" /></label>
					<p className="key-note">Your key stays in this browser session and is sent directly to the configured API.</p>
					<button className="save-button" onClick={() => { setSettingsOpen(false); setError('') }}>Done <span>→</span></button>
				</section>
			</div>}
		</main>
	)
}

export default App

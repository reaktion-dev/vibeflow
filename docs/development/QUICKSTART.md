# Quick Start Guide

Get the Daytona AI Dev Platform running in minutes.

## 1. Setup

```bash
# Clone repository
git clone <repo-url> daytona-ai-dev
cd daytona-ai-dev

# Install dependencies
pnpm install

# Copy environment example
cp .env.example .env.development.local

# Edit with your API keys
nano .env.development.local  # or use your editor
```

## 2. Configure Environment

Edit `.env.development.local`:

```bash
# Required
DAYTONA_API_KEY=pk_xxx...  # Get from https://daytona.io
DAYTONA_API_BASE_URL=https://api.daytona.io

# Pick one AI provider:
# Option A: Vercel AI Gateway (recommended)
VERCEL_AI_GATEWAY_KEY=...

# Option B: OpenAI
# OPENAI_API_KEY=sk-...
```

## 3. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 4. Create Your First Project

1. Click "New Project" button
2. Enter project name: "My First App"
3. (Optional) Paste Git repo URL: `https://github.com/user/repo.git`
4. Click "Create Project"
5. Wait for sandbox to initialize

## 5. Use the IDE

### File Browser (Left Sidebar)
- Click files to open in editor
- Files sync with Daytona sandbox

### Editor Pane (Center)
- Edit code directly
- Click "Save" or use Ctrl+S
- File info at bottom shows line/character count

### Terminal (Bottom)
- Type commands like: `ls`, `npm install`, `node app.js`
- Output streams in real-time
- Hit Enter to execute

### AI Assistant (Right Sidebar)
- Ask questions: "How do I fix this error?"
- Request changes: "Add error handling to this function"
- Get suggestions: "Refactor this code for performance"
- AI uses tools to read/write files and run commands automatically

## 6. Next Steps

### Learn the Interface
- Expand/collapse sidebar with button in header
- Toggle chat sidebar with button in header
- Resize panes by dragging dividers
- Close files with X button

### Try AI Features
- Ask AI to read a file: "Show me src/main.ts"
- Ask AI to make changes: "Add comments to main.ts"
- Ask to run commands: "Install express and create app.js"

### Explore Git Integration
- Clone repo during project creation
- Use terminal to: `git status`, `git add`, `git commit`
- AI can help with Git operations

### Try Different Projects
- Create multiple projects
- Switch between them from dashboard
- Each project is isolated in its own sandbox

## Common Commands

```bash
# Terminal examples
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
node app.js          # Run Node script
python script.py     # Run Python script
git clone <url>      # Clone repo
git status           # Check git status
ls -la              # List files
cat filename        # Show file contents
```

## Troubleshooting

### "Project creation failed"
- Check Daytona API key is correct
- Ensure Daytona service is reachable
- Check .env.development.local is loaded

### "Files not showing up"
- Click refresh if needed
- Check file path in sidebar
- Terminal: `ls -la` to verify files exist

### "AI not responding"
- Verify AI_GATEWAY_KEY or OPENAI_API_KEY is set
- Restart dev server: `Ctrl+C`, then `pnpm dev`
- Check browser console for errors

### "Command not found in terminal"
- Ensure you're in correct directory
- Check if package is installed
- Use full paths: `/usr/bin/python3` instead of `python`

## Tips & Tricks

1. **Quick Navigation**: Click folder icons to expand/collapse directories
2. **Save Shortcut**: Changes are auto-tracked, click Save button to persist
3. **Clear Terminal**: Click trash icon to clear output
4. **AI Context**: AI reads selected file automatically, so open relevant files first
5. **Fast Iteration**: Edit → Save → Test in terminal → Ask AI for help loop

## Next: Deploy or Share

Once ready:
- Run `npm run build` to prepare for production
- Deploy to Vercel: `vercel deploy`
- Share project URL with team
- Set up CI/CD in git repo

## Need Help?

- Check README.md for architecture details
- Review API documentation in README.md
- Check Daytona documentation: https://daytona.io/docs
- Review AI SDK docs: https://sdk.vercel.ai

Good luck building!

## Prompt 1 - build

Build 'Tab Goblin' in the folder C:\Users\admin\Documents\Harsh Vanguard\Vscode\28. BSERC AI Projects\14-Tab-Goblin. It's a Chrome extension (Manifest V3) where a goblin eats the tabs I ignored: it puts them to sleep and can bring them back.

What to build:
1. A popup showing the tab count and a goblin (simple inline SVG) whose mood changes with the count.
2. A list of tabs ordered by how long they've been ignored (use lastAccessed), e.g. '3 days ago'. Clicking a tab switches to it.
3. Put tabs to sleep without closing them using chrome.tabs.discard, one at a time or all tabs older than a time I choose ('Feed the goblin'). Never sleep the active tab, pinned tabs, tabs playing audio, or tabs with a half-filled form (use a small content script that notices when I type in a form field).
4. A Keep list the goblin never touches.
5. Save a session (all open tab URLs with a name and date) and restore it later in a new window.

Done when: it handles 30 open tabs smoothly; a half-filled form is never lost; a saved session restores after a Chrome restart; sleeping tabs wake correctly when clicked. The README should explain installing it via chrome://extensions > Load unpacked.

Rules: plain HTML, CSS and JavaScript with no framework and no build step. It must work fully offline: no CDN, no paid API, no login (if you need a library, save its file inside the folder). Make it look good: clear layout, readable text, buttons that say what they do, no gradients or emojis. Keep the code short and easy to read. Add a short README.md: what it is, how to run or install it, the features, and the 'Done when' list with how to check each one. Don't run git commands and don't use the browser preview pane; I'll test it myself. First save this message word for word in prompts.md under '## Prompt 1 - build'. When you're done, reply with the file list and what I should test.

# Tab Goblin

A Chrome extension (Manifest V3) where a goblin eats the tabs you ignored. It puts them to sleep with `chrome.tabs.discard` (they stay in the tab bar and reload when you click them) and never closes anything. Plain HTML, CSS and JavaScript. No build step, no libraries, no network use: it works fully offline.

## Install

1. Download this repo: on GitHub click **Code > Download ZIP**, then unzip it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the unzipped `Tab-Goblin-main` folder (the one that contains `manifest.json`).
5. Pin the extension from the puzzle-piece menu, then click the Tab Goblin button to open the popup.

After editing any file, click the reload arrow on the extension card.

## Features

- Popup header shows the tab count and a goblin whose face changes: Bored (up to 9 tabs), Content (10-19), Hungry (20-34), Ravenous (35+).
- Tab list from all windows, most ignored first, with times like "3 days ago". Click a tab to switch to it.
- **Sleep** button on each tab, or **Feed the goblin** to sleep every tab ignored for at least a time you choose (minutes, hours or days). The button shows how many tabs it will eat.
- Never sleeps: the tab you are looking at, pinned tabs, tabs playing audio, tabs with a half-filled form, and Keep list sites. The reason shows next to each tab.
- **Keep list**: use Keep on any tab to protect its site, or add a site by name in the Keep list tab. Subdomains are covered too.
- **Sessions**: save every open tab address with a name and date, and restore a session into a new window. Only http, https and file addresses are restored; browser pages such as `chrome://` are skipped.

How the form check works: `content.js` notices typing in any input, textarea, select or editable box, and `background.js` remembers that tab. Submitting the form, or reloading the page, clears the flag. Sleeping a tab with a draft is refused, even in Feed the goblin.

## Done when - and how to check

1. **Handles 30 open tabs smoothly.** Open about 30 tabs (for example, bookmark a folder of pages and choose "Open all"). Open the popup: it should appear instantly and scroll smoothly. Click Feed the goblin with 1 minute and check the count in the header changes.
2. **A half-filled form is never lost.** Open any page with a text box or comment form, type something, and switch to another tab. Open the popup: that tab shows "unsent form" and its Sleep button is disabled. Feed the goblin with 1 minute: the tab stays awake with your text intact. Tabs that were open before you installed the extension only count once you type after installing.
3. **A saved session restores after a Chrome restart.** In the Sessions tab, type a name and click Save session. Quit Chrome completely, reopen it, open the popup, and click Restore in new window. The tabs open in a new window.
4. **Sleeping tabs wake correctly when clicked.** Click Sleep on a tab (it shows "asleep" and is greyed). Click it in the popup: Chrome switches to it and reloads the page. Clicking the sleeping tab in the tab bar works the same way.

Also worth a try: pin a tab, play audio in one, and add a site to the Keep list. None of them should be eaten.

## Files

- `manifest.json` - extension settings and permissions.
- `popup.html`, `popup.css`, `popup.js` - the popup, goblin, lists and buttons.
- `content.js` - notices typing in form fields.
- `background.js` - remembers which tabs have unsent forms.
- `prompts.md` - the prompt this was built from.

## Notes

The extension asks for access to http and https pages only so the form-watching script can run. Nothing is sent anywhere; data stays in Chrome (Keep list and sessions in local extension storage). The toolbar button uses Chrome's default icon, since no image files were added.

## Tested

Installed in Chrome with Load unpacked and checked with about 30 tabs: the list sorts by most ignored, a sleeping tab wakes when clicked, a tab with typed form text is spared by Feed the goblin, and a saved session restores after a Chrome restart.

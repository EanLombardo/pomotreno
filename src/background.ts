chrome.action.onClicked.addListener(async (_: chrome.tabs.Tab) => {
  const extensionId = chrome.runtime.id;
  const timerPageUrl = `chrome-extension://${extensionId}/src/timer_page.html`;

  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find(tab => tab.url === timerPageUrl);

  if (existingTab) {
    await chrome.tabs.update(existingTab.id!, { active: true });
    if (existingTab.windowId) {
      const window = await chrome.windows.get(existingTab.windowId);
      if (window.state === 'minimized') {
        await chrome.windows.update(existingTab.windowId, { state: 'normal' });
      }
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: 'src/timer_page.html' });
  }
});

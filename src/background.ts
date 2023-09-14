import * as browser from "webextension-polyfill";
import { Tabs } from "webextension-polyfill";
import { ConfigProvider } from "./config";



async function gitbridgeifyCurrentTab(tab: Tabs.Tab) {
	var currentTabId: number | undefined = tab.id
	if(currentTabId !== undefined){
		try {
	        // add a dummy div element to indicate that gitbridgeify.bundle.js was injected by a user click on the gitbridge icon
	        browser.scripting.executeScript({ 
				target: { tabId : currentTabId },
				func: () => { 
					document.body.innerHTML += '<div style=\"display: none;\" id=\"gitbridge-extension-icon-clicked\"></div>'
				} 
			})
	        browser.scripting.executeScript({ 
				target: { tabId : currentTabId },
				files: [ "/dist/bundles/gitbridgeify.bundle.js" ]
			});
	    } catch {
	        try {
	            const configProvider = await ConfigProvider.create();
	            const config = configProvider.getConfig();
				browser.windows.create({
					url: config.gitbridgeURL,
				});
	        } catch {
	        }
	    }
	}
}

browser.action.onClicked.addListener(gitbridgeifyCurrentTab)

// browser.runtime.onInstalled.addListener((details) => {
//     if (details.reason === "install") {
        
//     }
// });
// browser.runtime.setUninstallURL("");

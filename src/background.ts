import { browser } from "webextension-polyfill-ts";
import { ConfigProvider } from "./config";

async function gitbridgeifyCurrentTab() {
    try {
        // add a dummy div element to indicate that gitbridgeify.bundle.js was injected by a user click on the gitbridge icon
        browser.tabs.executeScript({ code: "document.body.innerHTML += '<div style=\"display: none;\" id=\"gitbridge-extension-icon-clicked\"></div>'" })
        browser.tabs.executeScript({ file: "/dist/bundles/gitbridgeify.bundle.js" });
    } catch {
        try {
            const configProvider = await ConfigProvider.create();
            const config = configProvider.getConfig();
            window.open(config.gitbridgeURL);
        } catch {
        }
    }
}

browser.browserAction.onClicked.addListener(gitbridgeifyCurrentTab)

// browser.runtime.onInstalled.addListener((details) => {
//     if (details.reason === "install") {
        
//     }
// });
// browser.runtime.setUninstallURL("");

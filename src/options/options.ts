import { ConfigProvider } from "../config";

const gitbridgeUrlInput = document.getElementById("gitbridge-url-input")! as HTMLInputElement;
const gitbridgeRewriteKeybind = document.getElementById("gitbridge-replace-keybind")! as HTMLInputElement;
const gitbridgePopupInput = document.getElementById("gitbridge-open-as-popup")! as HTMLInputElement;
const messageElement = document.getElementById("message")! as HTMLDivElement;


const init = async () => {
    const configProvider = await ConfigProvider.create();

    // Initialize UI
    const initialConfig = configProvider.getConfig();
    gitbridgeUrlInput.value = initialConfig.gitbridgeURL;
    gitbridgePopupInput.checked = initialConfig.openAsPopup;
    gitbridgeRewriteKeybind.checked = initialConfig.rewritePeriodKeybind;

    let timeout: number | undefined = undefined;

    // Save config before close
    const save = () => {
        // Update config (propagated internally)
        configProvider.setConfig({
            gitbridgeURL: gitbridgeUrlInput.value || undefined,
            openAsPopup: gitbridgePopupInput.checked,
            rewritePeriodKeybind: gitbridgeRewriteKeybind.checked
        });
        if (timeout) {
            window.clearTimeout(timeout);
            timeout = undefined;
        }
        messageElement.innerText = "Saved.";
        timeout = window.setTimeout(() => { messageElement.innerText = ""; timeout = undefined }, 3000);
    };
    gitbridgeUrlInput.addEventListener("keyup", (event: KeyboardEvent) => {
        if (event.isComposing || event.keyCode === 229) {
            return;
        }
        save() 
    });
    [gitbridgePopupInput, gitbridgeRewriteKeybind].forEach((el) => el.addEventListener('change', save))
};

init().catch(err => console.error(err));

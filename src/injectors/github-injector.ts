import * as select from 'select-dom';
import * as ghInjection from 'github-injection';
import { ConfigProvider } from '../config';
import { ButtonInjector, InjectorBase, checkIsBtnUpToDate, rewritePeriodKeybindGitHub } from './injector';
import { renderGitBridgeUrl, makeOpenInPopup } from '../utils';

namespace GitBridgeify {
	export const NAV_BTN_ID = "gitbridge-btn-nav";
	export const NAV_BTN_CLASS = "gitbridge-nav-btn";
    export const NAV_BTN_CLASS_SELECTOR = "." + NAV_BTN_CLASS;
    
    export const CSS_REF_BTN_CONTAINER = "gitbridge-btn-container";
    export const CSS_REF_NO_CONTAINER = "no-container";
}

/**
 * This implementation currently assumes that there is only ever one button per page
 */
export class GitHubInjector extends InjectorBase {

    constructor(configProvider: ConfigProvider) {
        super(configProvider, [
            new PullInjector(),
            new IssueInjector(),
            new FileInjector(),
            new NavigationInjector(),
            new EmptyRepositoryInjector(),
        ]);
    }

    canHandleCurrentPage(): boolean {
        // TODO Does this work for GitHub Enterprise, too?
        const metaTags = document.getElementsByTagName("meta");
        for (let i = 0; i < metaTags.length; i++) {
            const metaTag = metaTags[i];
            if (metaTag.name === "hostname" && metaTag.content.includes("github")) {
                return true;
            }
        }
        return false;
    }

    checkIsInjected(): boolean {
        const button = document.getElementById(`${GitBridgeify.NAV_BTN_ID}`);
        const currentUrl = renderGitBridgeUrl(this.config.gitbridgeURL);
        return checkIsBtnUpToDate(button, currentUrl);
    }

    async inject(): Promise<void> {
        // ghInjection triggers an event whenever only parts of the GitHub page have been reloaded
	    ghInjection(() => {
            if (!this.checkIsInjected()) {
                this.injectButtons();
            }
            
            (async () => {
               await rewritePeriodKeybindGitHub();
            })();
        });
    }

    async update(): Promise<void> {
        this.injectButtons();
    }
}

abstract class ButtonInjectorBase implements ButtonInjector {

    constructor(
        protected readonly parentSelector: string,
        protected readonly btnClasses: string,
        protected readonly float: boolean = true,
        protected readonly asFirstChild: boolean = false
    ) {}

    abstract isApplicableToCurrentPage(): boolean;

    inject(currentUrl: string, openAsPopup: boolean) {
        const actionbar = select(this.parentSelector);
        if (!actionbar) {
            return;
        }

        const oldBtn = document.getElementById(GitBridgeify.NAV_BTN_ID);
        if (oldBtn) {
            if (!checkIsBtnUpToDate(oldBtn, currentUrl)) {
                // update button
                (oldBtn as HTMLAnchorElement).href = currentUrl;
            }
            // button is there and up-to-date
            return;
        }

        const btn = this.renderButton(currentUrl, openAsPopup);

        const btnGroup = actionbar.getElementsByClassName("BtnGroup");
        const detailsBtn = Array.from(actionbar.children)
            .filter(child => child.tagName.toLowerCase() === "details" && child.id.endsWith("more-options-details"));
        if (btnGroup && btnGroup.length > 0 && btnGroup[0].classList.contains('float-right')) {
            actionbar.insertBefore(btn, btnGroup[0]);
        } else if (detailsBtn && detailsBtn.length > 0) {
            if (detailsBtn[0].previousElementSibling) {
                detailsBtn[0].previousElementSibling.classList.remove("mr-2");
            }
            btn.classList.add("mr-2");
            actionbar.insertBefore(btn, detailsBtn[0]);
        } else if (this.asFirstChild && actionbar) {
            actionbar.insertBefore(btn, actionbar.firstChild);
        } else {
            actionbar.appendChild(btn);
        }

        const primaryButtons = actionbar.getElementsByClassName("btn-primary");
        if (primaryButtons && primaryButtons.length > 1) {
            Array.from(primaryButtons)
                .slice(0, primaryButtons.length - 1)
                .forEach(primaryButton => primaryButton.classList.replace("btn-primary", "btn-secondary"));
        }
    }

    protected renderButton(url: string, openAsPopup: boolean): HTMLElement {
        let classes = this.btnClasses + ` ${GitBridgeify.NAV_BTN_CLASS}`;
        if (this.float) {
            classes = classes + ` float-right`;
        }

        const container = document.createElement('div');
        container.id = GitBridgeify.CSS_REF_BTN_CONTAINER;
        container.className = classes;

        const a = document.createElement('a');
        a.id = GitBridgeify.NAV_BTN_ID;
        a.title = "GitBridge - Open in VSCode";
        a.text = "🔗 VSCode"
        a.href = url;
        if (openAsPopup) {
            makeOpenInPopup(a);
        }
        a.className = "btn btn-sm btn-primary";

        this.adjustButton(a);

        container.appendChild(a);
        return container;
    }
    protected adjustButton(a: HTMLAnchorElement) {
        // do nothing
    }
}

class PullInjector extends ButtonInjectorBase {
    constructor() {
        super(".gh-header-actions", "");
    }

    isApplicableToCurrentPage(): boolean {
		return window.location.pathname.includes("/pull/");
    }
}

class IssueInjector extends ButtonInjectorBase {
    constructor() {
        super(".gh-header-actions", "");
    }

    isApplicableToCurrentPage(): boolean {
		return window.location.pathname.includes("/issues/");
    }
}

class FileInjector extends ButtonInjectorBase {
    constructor() {
        super(".repository-content > div > div", "gitbridge-file-btn");
    }

    protected adjustButton(a: HTMLAnchorElement): void {
        a.className = "btn btn-primary";
    }

    isApplicableToCurrentPage(): boolean {
        return window.location.pathname.includes("/blob/");
    }
}

class NavigationInjector extends ButtonInjectorBase {
    constructor() {
        super(".file-navigation", "empty-icon position-relative");
    }

    protected adjustButton(a: HTMLAnchorElement): void {
        a.className = "btn btn-primary";
    }

    isApplicableToCurrentPage(): boolean {
        return !!select.exists(".file-navigation");
    }
}

class EmptyRepositoryInjector extends ButtonInjectorBase {
    constructor() {
        super(".repository-content", GitBridgeify.CSS_REF_NO_CONTAINER, false, true);
    }

    protected adjustButton(a: HTMLAnchorElement): void {
        a.className = "btn btn-primary";
    }

    isApplicableToCurrentPage(): boolean {
        return !!select.exists("#empty-setup-clone-url");
    }
}
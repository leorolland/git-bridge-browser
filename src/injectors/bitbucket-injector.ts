import { InjectorBase, ButtonInjector, checkIsBtnUpToDate } from "./injector";
import { ConfigProvider } from "../config";
import { renderGitBridgeUrl, makeOpenInPopup } from "../utils";
import select = require("select-dom");
import * as octicons from '@primer/octicons';

namespace GitBridgeify {
	export const NAV_BTN_ID = "gitbridge-btn-nav";
	export const NAV_BTN_CLASS = "gitbridge-nav-btn";
    export const NAV_BTN_CLASS_SELECTOR = "." + NAV_BTN_CLASS;
    
    export const CSS_REF_BTN_CONTAINER = "gitbridge-btn-container";
    export const CSS_REF_NO_CONTAINER = "no-container";
}

export class BitbucketInjector extends InjectorBase {

    constructor(configProvider: ConfigProvider) {
        super(configProvider, [
            new BranchInjector(),
            new PullRequestInjector(),
            new IssuesInjector(),
            new NewPullRequestInjector(),
            new CommitInjector(),
            new RepositoryInjector()
        ]);
    }

    canHandleCurrentPage(): boolean {
        const metaTags = document.getElementsByTagName("meta");
        for (let i = 0; i < metaTags.length; i++) {
            const metaTag = metaTags[i];
            if (metaTag.name === "application-name" && metaTag.content.toLowerCase().includes("bitbucket")) {
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
        this.injectButtons(false);
    }

    async update(): Promise<void> {
        this.injectButtons(false);
    }

}

abstract class ButtonInjectorBase implements ButtonInjector {

    constructor(protected readonly parent: string, protected btnClasses: string, protected readonly up?: number) {

    }

    abstract isApplicableToCurrentPage(): boolean;

    inject(currentUrl: string, openAsPopup: boolean) {
        let actionbar = select(this.parent);
        if(actionbar && this.up) {
            for(let i = 0; i < this.up; i++) {
                if(actionbar.parentElement) {
                    actionbar = actionbar.parentElement;
                } else {
                    return;
                }
            }
        }
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

        const btnGroup = actionbar.children;
        if (btnGroup && btnGroup.length > 0){
            btnGroup[0].insertAdjacentElement("afterend",btn);
        } 
    }

    protected renderButton(url: string, openAsPopup: boolean, float: boolean = true): HTMLElement {
        let classes = GitBridgeify.NAV_BTN_CLASS;
        if (float) {
            classes = `${classes} ${this.btnClasses} aui-button`;
        }   

        const container = document.createElement('div');
        container.id = GitBridgeify.CSS_REF_BTN_CONTAINER;
        container.className = classes;

		const spanIcon = document.createElement('span');
		spanIcon.style.marginRight = "0.4rem"
		spanIcon.style.verticalAlign = "middle"
        spanIcon.innerHTML = octicons['desktop-download'].toSVG({ width:14, height:14 });

        const a = document.createElement('a');
        a.id = GitBridgeify.NAV_BTN_ID;
        a.title = "GitBridge - Open in VSCode";
		a.appendChild(spanIcon);
		a.innerHTML += "VSCode"
        a.href = url;
        if (openAsPopup) {
            makeOpenInPopup(a);
        }
        a.className = "btn btn-sm btn-primary";

        container.appendChild(a);
        return container;
    }
}

class BranchInjector extends ButtonInjectorBase {

    constructor() {
        super('.branch-toolbar .aui-buttons', '');
    }

    isApplicableToCurrentPage(): boolean {
        return window.location.pathname.includes("/branch/");
    }

}

class PullRequestInjector extends ButtonInjectorBase {

    constructor() {
        super('#pullrequest-actions .aui-buttons:last-child', '');
    }

    isApplicableToCurrentPage(): boolean {
        return select(this.parent) && window.location.pathname.includes("/pull-requests/");
    }

}

class NewPullRequestInjector extends ButtonInjectorBase {

    constructor() {
        super('[data-qa="pr-header-actions-drop-down-menu-styles"]', 'bitbucket-button', 2);
    }

    isApplicableToCurrentPage(): boolean {
        return select(this.parent) && window.location.pathname.includes("/pull-requests/");
    }

}

class IssuesInjector extends ButtonInjectorBase {

    constructor() {
        super('#issue-header .aui-buttons:last-child', '');
    }

    isApplicableToCurrentPage(): boolean {
        return select(this.parent) && window.location.pathname.includes("/issues/");
    }

}

class CommitInjector extends ButtonInjectorBase {

    constructor() {
        super('.commit-actions', '');
    }

    isApplicableToCurrentPage(): boolean {
        return window.location.pathname.includes("/commits/");
    }

}

class RepositoryInjector extends ButtonInjectorBase {

    constructor() {
        super('[data-qa="page-header-wrapper"] button', 'bitbucket-button', 2);
    }

    isApplicableToCurrentPage(): boolean {
        return window.location.pathname.includes("/src/");
    }

}

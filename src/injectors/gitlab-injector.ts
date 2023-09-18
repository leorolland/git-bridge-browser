import * as domloaded from 'dom-loaded';
import * as select from 'select-dom';
import { ConfigProvider } from '../config';
import { ButtonInjector, InjectorBase, checkIsBtnUpToDate, rewritePeriodKeybindGitLab } from './injector';
import { renderGitBridgeUrl, makeOpenInPopup } from '../utils';
import * as octicons from '@primer/octicons';

namespace GitBridgeify {
	export const BTN_ID = "gitbridge-btn-nav";
	export const BTN_CLASS = "gitbridge-nav-btn";
}

export class GitlabInjector extends InjectorBase {

    constructor(protected readonly configProvider: ConfigProvider) {
        super(configProvider, [
            new RepositoryInjector(),
            new EmptyRepositoryInjector(),
            new FileInjector()
        ]);
    }

    canHandleCurrentPage(): boolean {
        const metaTags = document.getElementsByTagName("meta");
        for (let i = 0; i < metaTags.length; i++) {
            const metaTag = metaTags[i];
            if (metaTag.content.toLowerCase().includes("gitlab")) {
                return true;
            }
        }
        return false;
    }

    checkIsInjected(): boolean {
        const button = document.getElementById(`${GitBridgeify.BTN_ID}`);
        const currentUrl = renderGitBridgeUrl(this.config.gitbridgeURL);
        return checkIsBtnUpToDate(button, currentUrl);
    }

    async inject(): Promise<void> {
        await domloaded;    // TODO(geropl) This is dead slow, improve.
        this.injectButtons(false);
        if (this.canHandleCurrentPage() && this.checkIsInjected()) {
            await rewritePeriodKeybindGitLab();
        }
    }

    async update(): Promise<void> {
        this.injectButtons(false);
    }
}

abstract class ButtonInjectorBase implements ButtonInjector {

    constructor(
        protected readonly parentSelector: string,
        protected readonly containerClasses: string = "git-clone-holder js-git-clone-holder",
        protected readonly containerWrapper: boolean = true,
        protected readonly insertBeforeSelector: string | undefined = undefined
    ) { }

    abstract isApplicableToCurrentPage(): boolean;

    inject(currentUrl: string, openAsPopup: boolean) {
        const parent = select(this.parentSelector);
        if (!parent) {
            return;
        }
        const before = this.insertBeforeSelector ? select(this.insertBeforeSelector, parent) : undefined;

        const oldBtn = document.getElementById(GitBridgeify.BTN_ID);
        if (oldBtn) {
            // Only add once
			if (!checkIsBtnUpToDate(oldBtn, currentUrl)) {
            	(oldBtn as HTMLAnchorElement).href = currentUrl;
			}	
            return;
        }

        const btn = this.renderButton(currentUrl, openAsPopup);
        if (before) {
            parent.insertBefore(btn, before);
        } else {
            parent.appendChild(btn);
        }
    }

    protected renderButton(url: string, openAsPopup: boolean): HTMLElement {

        const a = document.createElement('a');
        a.id = GitBridgeify.BTN_ID;
        a.title = "GitBridge - Open in VSCode";
        a.innerHTML = octicons['desktop-download'].toSVG({ class: "s16 gl-icon gl-button-icon mr-2", width: 16, height: 16 }) + "VSCode"
        a.href = url;
        a.className = "gl-button btn btn-info";
        
        if (openAsPopup) {
            makeOpenInPopup(a);
        }
        this.adjustButton(a);

        const container = document.createElement('div');
        container.className = this.containerClasses;
        container.appendChild(a);

        if (this.containerWrapper) {
            const containerWrapper = document.createElement('div');
            containerWrapper.className = "project-clone-holder d-none d-md-inline-block";
            containerWrapper.appendChild(container);
            this.adjustWrapper(containerWrapper);
            return containerWrapper;
        } else {
            return container;
        }
    }
    protected adjustButton(a: HTMLAnchorElement) {
        // do nothing
    }
    protected adjustWrapper(div: HTMLDivElement) {
        // do nothing
    }
}

class RepositoryInjector extends ButtonInjectorBase {
    constructor() {
        super(".tree-controls :first-child");
    }

    isApplicableToCurrentPage(): boolean {
        const result = !!select.exists(this.parentSelector)
            && !!select.exists(".project-clone-holder")
            && !select.exists('[data-qa-selector="gitbridge_button"]');
        return result;
    }
}

class EmptyRepositoryInjector extends ButtonInjectorBase {
    constructor() {
        super(".project-buttons","git-clone-holder js-git-clone-holder",true, ".float-left");
    }
    
    protected adjustWrapper(div: HTMLDivElement) {
        div.className += " gl-mb-3 gl-mr-3 float-left"
    }
    
    isApplicableToCurrentPage(): boolean {
        const result = !!select.exists(this.parentSelector)
            && !!select.exists(".project-clone-holder");
        return result;
    }
}

class FileInjector extends ButtonInjectorBase {
    constructor() {
        super("#fileHolder > div > div.file-actions", "gl-mr-3", false, "[data-qa-selector='default_actions_container']");
    }

    protected adjustButton(a: HTMLAnchorElement) {
        a.className = "btn btn-confirm btn-md gl-button";
        a.style.marginRight = "1px";
    }

    isApplicableToCurrentPage(): boolean {
        return window.location.pathname.includes("/blob/");
    }
}
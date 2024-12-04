window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RibbonInterface = class {
    constructor() {
        this.ribbon = null;
        this.observer = null;
        this.resizeTimeout = null;
        
        this.state = {
            history: [],
            historyIndex: -1,
            maxHistory: 50
        };

        this.CONFIG = {
            scripts: [
                "../ribbon/ribbon-styles.js",
                "../ribbon/ribbon-data.js",
                "../ribbon/ribbon-core.js",
                "../ribbon/ribbon-tooltips.js",
                "../ribbon/ribbon-extended.js",
                "../ribbon/ribbon-init.js",
                "../ribbon/functions/navlist.js",
                "../ribbon/functions/grid_overlay.js"
            ],
            observerConfig: {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["data-sl-type"]
            }
        };

        // Bind methods
        this.loadScript = this.loadScript.bind(this);
        this.waitForDS = this.waitForDS.bind(this);
        this.setupKeyboardShortcuts = this.setupKeyboardShortcuts.bind(this);
        this.setupResizeHandler = this.setupResizeHandler.bind(this);
        this.setupMutationObserver = this.setupMutationObserver.bind(this);
        this.updateUndoRedoState = this.updateUndoRedoState.bind(this);
        this.init = this.init.bind(this);
        this.destroy = this.destroy.bind(this);
        this.toggleRibbon = this.toggleRibbon.bind(this);
        this.getRibbon = this.getRibbon.bind(this);
        this.pushState = this.pushState.bind(this);
    }

    async loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async waitForDS() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.DS) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && ["Space", "KeyS", "KeyZ", "KeyY"].includes(e.code)) {
                e.preventDefault();
            }

            if (e.ctrlKey) {
                switch (e.code) {
                    case "Space":
                        this.toggleRibbon();
                        break;
                    case "KeyS":
                        this.ribbon?.handleQuickSave();
                        break;
                    case "KeyZ":
                        if (!e.shiftKey) this.ribbon?.handleUndo();
                        else this.ribbon?.handleRedo();
                        break;
                    case "KeyY":
                        this.ribbon?.handleRedo();
                        break;
                }
            }
        });
    }

    setupResizeHandler() {
        window.addEventListener("resize", () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.ribbon?.render();
            }, 250);
        });
    }

    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            const shouldUpdate = mutations.some(mutation => 
                Array.from(mutation.addedNodes)
                    .concat(Array.from(mutation.removedNodes))
                    .some(node => node.hasAttribute?.("data-sl-type"))
            );
            
            if (shouldUpdate) {
                this.ribbon?.render();
            }
        });

        this.observer.observe(document.body, this.CONFIG.observerConfig);
    }

    updateUndoRedoState() {
        const undoButton = document.querySelector(".sl-ribbon-undo");
        const redoButton = document.querySelector(".sl-ribbon-redo");
        
        if (undoButton) {
            undoButton.disabled = this.state.historyIndex < 0;
        }
        if (redoButton) {
            redoButton.disabled = this.state.historyIndex >= this.state.history.length - 1;
        }
    }

    async init() {
        if (window.storylineInterfaceInitialized) {
            console.warn("Storyline interface is already initialized");
            return this;
        }

        try {
            await this.waitForDS();
            
            for (const script of this.CONFIG.scripts) {
                await this.loadScript(script);
            }

            this.ribbon = ArticulateTools.ExtendedRibbon.init();
            
            this.setupKeyboardShortcuts();
            this.setupResizeHandler();
            this.setupMutationObserver();

            window.storylineInterfaceInitialized = true;
            console.log("Storyline interface successfully initialized");
            return this;

        } catch (error) {
            console.error("Failed to initialize interface:", error);
            this.destroy();
            throw error;
        }
    }

    pushState(action) {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        }

        this.state.history.push(action);
        
        if (this.state.history.length > this.state.maxHistory) {
            this.state.history.shift();
        } else {
            this.state.historyIndex++;
        }

        this.updateUndoRedoState();
    }

    toggleRibbon() {
        this.ribbon?.toggle();
    }

    destroy() {
        this.observer?.disconnect();
        clearTimeout(this.resizeTimeout);
        this.ribbon?.destroy();
        window.storylineInterfaceInitialized = false;
    }

    getRibbon() {
        return this.ribbon;
    }

    static init() {
        const ribbonInterface = new ArticulateTools.RibbonInterface();
        return ribbonInterface.init();
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => ArticulateTools.RibbonInterface.init());
} else {
    ArticulateTools.RibbonInterface.init();
}
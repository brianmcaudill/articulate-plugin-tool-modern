window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RiseRibbonAdapter = class {
    constructor(ribbonLoader) {
        this.ribbonLoader = ribbonLoader;
        this.originalSelectors = {};
        this.patchSelectors();
    }

    patchSelectors() {
        // Store original selectors
        const tools = this.ribbonLoader.instances.tools;
        
        tools.forEach(tool => {
            if (tool.selectors) {
                this.originalSelectors[tool.name] = {...tool.selectors};
                // Update selectors for Rise
                tool.selectors = {
                    ...tool.selectors,
                    container: '#app > div',
                    text: '.text-block',
                    image: '.block-image img'
                };
            }
        });
    }

    restore() {
        // Restore original selectors if needed
        const tools = this.ribbonLoader.instances.tools;
        tools.forEach(tool => {
            if (this.originalSelectors[tool.name]) {
                tool.selectors = this.originalSelectors[tool.name];
            }
        });
    }
}
console.log("rise-ribbon-adapter.js loaded");
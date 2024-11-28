window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RibbonInitializer = class {
    constructor() {
        this.instance = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.destroy = this.destroy.bind(this);
        this.getInstance = this.getInstance.bind(this);
        this.createRibbon = this.createRibbon.bind(this);
        this.validateInstance = this.validateInstance.bind(this);
        this.createToggleFunction = this.createToggleFunction.bind(this);
    }

    validateInstance() {
        if (!ArticulateTools.Ribbon) {
            throw new Error('ArticulateTools.Ribbon class is not defined');
        }
    }

    createToggleFunction() {
        if (!this.instance) return;

        window.toggleStorylineRibbon = () => {
            const display = this.instance.container.style.display === 'none' ? 'block' : 'none';
            this.instance.container.style.display = display;
            this.instance.spacer.style.display = display;
        };
    }

    createRibbon() {
        const ribbon = new ArticulateTools.ExtendedRibbon();
        ribbon.init();
        return ribbon;
    }

    init() {
        try {
            this.validateInstance();
            
            if (this.instance) {
                console.warn('Ribbon already initialized');
                return this.instance;
            }

            this.instance = this.createRibbon();
            this.instance.mount();
            this.createToggleFunction();
            
            console.log('Storyline ribbon initialized! Use window.toggleStorylineRibbon() to show/hide.');
            return this.instance;

        } catch (error) {
            console.error('Failed to initialize ribbon:', error);
            this.destroy();
            throw error;
        }
    }

    destroy() {
        if (this.instance) {
            this.instance.destroy();
            this.instance = null;
            delete window.toggleStorylineRibbon;
        }
    }

    getInstance() {
        return this.instance;
    }

    static init() {
        const initializer = new ArticulateTools.RibbonInitializer();
        return initializer.init();
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        ArticulateTools.RibbonInitializer.init();
        console.log('Ribbon initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ribbon:', error);
    }
});
console.log('ribbon-init.js loaded');
window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RibbonInitializer = class {
    constructor() {
        this.instance = null;
    }

    createRibbon() {
        const ribbon = new ArticulateTools.Ribbon();
        ribbon.init();
        return ribbon;
    }

    init() {
        if (this.instance) {
            console.warn('Ribbon already initialized');
            return this.instance;
        }

        try {
            this.instance = this.createRibbon();
            this.instance.mount();
            
            window.toggleRibbon = () => {
                this.instance.toggle();
            };

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
            delete window.toggleRibbon;
        }
    }

    getInstance() {
        return this.instance;
    }
}
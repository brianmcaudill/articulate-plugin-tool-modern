/**
 * This adapter:
1. Detects Rise vs Storyline
3. Waits for content to load
4. Provides consistent selectors for tools
 * 
 */
window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.CourseAdapter = class {
    constructor() {
        this.isRise = this.detectRise();
        this.contentLoaded = false;
        this.ribbon = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        //this.waitForContent = this.waitForContent.bind(this);
        this.destroy = this.destroy.bind(this);
    }

    detectRise() {
        return !!document.querySelector('#app') && 
               !!window.labelSet;
    }



    async init() {
        // Store ribbon instance
        const loader = new ArticulateTools.RibbonLoader();
        this.ribbon = loader.init();
    
        // If Rise, adapt the ribbon and adjust positioning
        if (this.isRise) {
            // Add Rise-specific spacer
            const riseHeader = document.querySelector('.rise-header');
            if (riseHeader) {
                this.ribbon.container.style.top = riseHeader.offsetHeight + 'px';
            }
            
            // Adjust content spacing
            const appContent = document.querySelector('#app > div');
            if (appContent) {
                appContent.style.marginTop = '150px'; // Adjust based on ribbon height
            }
        }
    }

    destroy() {
        if (this.ribbon) {
            this.ribbon.destroy();
            this.ribbon = null;
        }
    }
};
console.log('course-adapter.js loaded');
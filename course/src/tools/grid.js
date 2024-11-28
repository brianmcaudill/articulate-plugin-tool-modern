// Create namespace for all tools
window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.GridTool = class {
    constructor() {
        this.gridContainer = null;
        this.isInitialized = false;
        this.styles = `
    .storyline-grid {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    }

    .storyline-grid-lines {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
            linear-gradient(to right, rgba(0, 100, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 100, 255, 0.1) 1px, transparent 1px);
    }

    .storyline-grid-major {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
            linear-gradient(to right, rgba(0, 100, 255, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 100, 255, 0.2) 1px, transparent 1px);
    }
`;
    }

    initStyles() {
        if (!document.getElementById('grid-tool-styles')) {
            const styleSheet = document.createElement("style");
            styleSheet.id = 'grid-tool-styles';
            styleSheet.textContent = this.styles;
            document.head.appendChild(styleSheet);
        }
    }

    toggle() {
        if (!this.gridContainer) return;
        
        const gridControls = document.getElementById('gridControls');
        const isVisible = this.gridContainer.style.display !== 'none';
        
        this.gridContainer.style.display = isVisible ? 'none' : 'block';
        gridControls.style.display = isVisible ? 'none' : 'block';
    }

    updateGridSize(minor, major) {
        if (!this.gridContainer) return;
        
        const gridLines = this.gridContainer.querySelector('.storyline-grid-lines');
        const gridMajor = this.gridContainer.querySelector('.storyline-grid-major');
        
        gridLines.style.backgroundSize = `${minor}px ${minor}px`;
        gridMajor.style.backgroundSize = `${major}px ${major}px`;
    }

    destroy() {
        if (this.gridContainer) {
            this.gridContainer.remove();
            this.gridContainer = null;
        }
        const controls = document.getElementById('gridControls');
        if (controls) {
            controls.remove();
        }
        const styles = document.getElementById('grid-tool-styles');
        if (styles) {
            styles.remove();
        }
        this.isInitialized = false;
    }
    createGridElements() {
        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'storyline-grid';
        this.gridContainer.style.display = 'none';
        
        const gridMajor = document.createElement('div');
        gridMajor.className = 'storyline-grid-major';
        
        const gridLines = document.createElement('div');
        gridLines.className = 'storyline-grid-lines';
        
        this.gridContainer.appendChild(gridMajor);
        this.gridContainer.appendChild(gridLines);
        document.body.appendChild(this.gridContainer);
    }

    createControls() {
        const controls = document.createElement('div');
        controls.id = 'gridControls';
        controls.className = 'grid-controls';
        controls.innerHTML = `
            <label>
                Minor Grid:
                <input type="number" id="minorGrid" value="10" min="1" max="100"> px
            </label>
            <label>
                Major Grid:
                <input type="number" id="majorGrid" value="50" min="1" max="500"> px
            </label>
        `;

        // Use arrow function to preserve 'this' context
        controls.addEventListener('input', (e) => {
            const minorSize = document.getElementById('minorGrid').value;
            const majorSize = document.getElementById('majorGrid').value;
            this.updateGridSize(minorSize, majorSize);
        });

        return controls;
    }
    // init() {
    //     if (this.isInitialized) return;
        
    //     this.initStyles();
    //     this.createGridElements();
    //     const controls = this.createControls();

    //     const panel = document.querySelector('.sl-control-panel .sl-control-content');
    //     if (panel) {
    //         panel.appendChild(controls);
    //     }

    //     this.updateGridSize(10, 50);
    //     this.isInitialized = true;
    // }
    init() {
        if (this.isInitialized) return;
        
        this.initStyles();
        this.createGridElements();
        
        // Create control panel if it doesn't exist
        let panel = document.querySelector('.sl-control-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'sl-control-panel';
            const content = document.createElement('div');
            content.className = 'sl-control-content';
            panel.appendChild(content);
            document.body.appendChild(panel);
        }
    
        const controls = this.createControls();
        const panelContent = panel.querySelector('.sl-control-content');
        panelContent.appendChild(controls);
    
        // Initialize grid with default values
        this.updateGridSize(10, 50);
        this.isInitialized = true;
    }
}
console.log('grid.js loaded');
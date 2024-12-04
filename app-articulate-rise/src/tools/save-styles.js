window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.StyleManager = class {
    constructor() {
        // Bind methods
        this.init = this.init.bind(this);
        this.saveStyles = this.saveStyles.bind(this);
        this.loadStyles = this.loadStyles.bind(this);
        this.destroy = this.destroy.bind(this);
        this.findModelId = this.findModelId.bind(this);
        this.findElementIndex = this.findElementIndex.bind(this);
        this.findElementsByModelId = this.findElementsByModelId.bind(this);
        this.collectStyleChanges = this.collectStyleChanges.bind(this);
        this.applyStyles = this.applyStyles.bind(this);
        this.createSaveLoadButtons = this.createSaveLoadButtons.bind(this);
    }

    findModelId(element) {
        let current = element;
        while (current && !current.hasAttribute('data-model-id')) {
            current = current.parentElement;
        }
        return current ? current.getAttribute('data-model-id') : null;
    }

    findElementIndex(element) {
        const siblings = element.parentElement.querySelectorAll(element.tagName);
        return Array.from(siblings).indexOf(element);
    }

    findElementsByModelId(modelId, elementType, index) {
        const container = document.querySelector(`[data-model-id="${modelId}"]`);
        if (!container) return [];
        
        const elements = container.querySelectorAll(elementType);
        if (index !== undefined && elements[index]) {
            return [elements[index]];
        }
        return Array.from(elements);
    }

    collectStyleChanges() {
        const styleChanges = {};
        
        document.querySelectorAll('text, tspan').forEach(element => {
            const modelId = this.findModelId(element);
            if (!modelId) return;

            const elementType = element.tagName.toLowerCase();
            const elementIndex = this.findElementIndex(element);
            const key = `${modelId}-${elementType}-${elementIndex}`;
            
            styleChanges[key] = {
                fill: element.getAttribute('fill'),
                fontSize: element.getAttribute('font-size'),
                elementType,
                modelId,
                index: elementIndex
            };
        });

        return styleChanges;
    }

    applyStyles(styleChanges) {
        Object.values(styleChanges).forEach(style => {
            const elements = this.findElementsByModelId(style.modelId, style.elementType, style.index);
            elements.forEach(element => {
                if (style.fill) element.setAttribute('fill', style.fill);
                if (style.fontSize) element.setAttribute('font-size', style.fontSize);
            });
        });
    }

    createSaveLoadButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'style-group';
        buttonContainer.innerHTML = `
            <button class="style-btn" id="saveStyles">Save Styles</button>
            <button class="style-btn" id="loadStyles">Load Styles</button>
        `;

        return buttonContainer;
    }

    init(panelSelector = '.style-panel .style-content') {
        const panel = document.querySelector(panelSelector);
        if (!panel) {
            console.error('Style panel not found');
            return;
        }

        const buttons = this.createSaveLoadButtons();
        panel.appendChild(buttons);

        // Add event listeners
        buttons.querySelector('#saveStyles').addEventListener('click', this.saveStyles);
        buttons.querySelector('#loadStyles').addEventListener('click', this.loadStyles);
    }

    async saveStyles() {
        try {
            const styleChanges = this.collectStyleChanges();
            const dataStr = JSON.stringify(styleChanges, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'storyline-styles.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error saving styles:', error);
        }
    }

    async loadStyles() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    resolve();
                    return;
                }
                
                try {
                    const text = await file.text();
                    const styleChanges = JSON.parse(text);
                    this.applyStyles(styleChanges);
                    resolve(styleChanges);
                } catch (error) {
                    console.error('Error loading styles:', error);
                    reject(error);
                }
            };
            
            input.click();
        });
    }

    destroy() {
        const buttons = document.querySelector('.style-group');
        if (buttons) {
            buttons.remove();
        }
    }

    // Static factory method
    // static init(panelSelector) {
    //     const styleManager = new ArticulateTools.StyleManager();
    //     styleManager.init(panelSelector);
    //     return styleManager;
    // }
}
console.log('save-styles.js loaded');
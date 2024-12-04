// Extend ArticulateTools namespace
window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.TextStyler = class {
    constructor() {
        // Instance properties
        this.isEnabled = false;
        this.selectedText = null;
        this.panel = null;
        this.originalStyles = new WeakMap();

        // Bind methods
        this.init = this.init.bind(this);
        this.toggle = this.toggle.bind(this);
        this.destroy = this.destroy.bind(this);
        this.handleTextClick = this.handleTextClick.bind(this);
        this.enableTextEditing = this.enableTextEditing.bind(this);
        this.disableTextEditing = this.disableTextEditing.bind(this);
        this.updateTextStyle = this.updateTextStyle.bind(this);
        this.resetTextStyle = this.resetTextStyle.bind(this);
        this.deselectText = this.deselectText.bind(this);
        this.setupPanelEvents = this.setupPanelEvents.bind(this);
        this.storeOriginalStyle = this.storeOriginalStyle.bind(this);
    }



    static DEFAULT_VALUES = {
        color: '#000000',
        fontSize: 17
    };

    static COLOR_PRESETS = [
        { label: 'Black', value: '#000000' },
        { label: 'Red', value: '#FF0000' },
        { label: 'Blue', value: '#0000FF' },
        { label: 'Green', value: '#008000' }
    ];

    static STYLES = `
    .style-panel {
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 15px;
        width: 200px;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
    }
    .style-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .style-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .style-group label {
        font-weight: bold;
        color: #333;
    }
    .color-presets {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
    }
    .style-btn {
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }
    .style-btn:hover {
        background: #f0f0f0;
    }
    .color-input {
        width: 100%;
        padding: 4px;
    }
    .size-input {
        width: 60px;
        padding: 4px;
    }
    .collapse-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 18px;
        color: #666;
    }
    .text-highlight {
        cursor: pointer;
    }
    .text-highlight:hover {
        outline: 1px dashed #0066cc;
    }
    .selected-text {
        outline: 2px solid #0066cc;
    }
`;
    initStyles() {
        if (!document.getElementById('text-styler-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'text-styler-styles';
            styleSheet.textContent = ArticulateTools.TextStyler.STYLES;
            document.head.appendChild(styleSheet);
        }
    }

    createPanel() {
        const presetButtons = ArticulateTools.TextStyler.COLOR_PRESETS
            .map(preset => `<button class="style-btn" data-color="${preset.value}">${preset.label}</button>`)
            .join('');

        this.panel = document.createElement('div');
        this.panel.className = 'style-panel';
        this.panel.style.display = 'none';
        this.panel.innerHTML = `
            <button class="collapse-btn">−</button>
            <h3>Text Styler</h3>
            <div class="style-content">
                <div class="style-group">
                    <label>Color:</label>
                    <input type="color" class="color-input" value="${ArticulateTools.TextStyler.DEFAULT_VALUES.color}">
                    <div class="color-presets">
                        ${presetButtons}
                    </div>
                </div>
                <div class="style-group">
                    <label>Size:</label>
                    <input type="number" class="size-input" value="${ArticulateTools.TextStyler.DEFAULT_VALUES.fontSize}" min="8" max="72">
                    <button class="style-btn" data-size="-1">−</button>
                    <button class="style-btn" data-size="+1">+</button>
                </div>
                <div class="style-group">
                    <button class="style-btn" id="resetStyles">Reset Styles</button>
                </div>
            </div>
        `;

        return this.panel;
    }

    setupPanelEvents() {
        const colorInput = this.panel.querySelector('.color-input');
        const sizeInput = this.panel.querySelector('.size-input');

        colorInput.addEventListener('change', (e) => {
            if (this.selectedText) {
                this.updateTextStyle(this.selectedText, { color: e.target.value });
            }
        });

        sizeInput.addEventListener('change', (e) => {
            if (this.selectedText) {
                this.updateTextStyle(this.selectedText, { fontSize: parseFloat(e.target.value) });
            }
        });

        this.panel.querySelectorAll('[data-color]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.selectedText) {
                    const color = btn.dataset.color;
                    this.updateTextStyle(this.selectedText, { color });
                    colorInput.value = color;
                }
            });
        });

        this.panel.querySelectorAll('[data-size]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.selectedText) {
                    const newSize = parseFloat(sizeInput.value) + parseFloat(btn.dataset.size);
                    if (newSize >= 8 && newSize <= 72) {
                        sizeInput.value = newSize;
                        this.updateTextStyle(this.selectedText, { fontSize: newSize });
                    }
                }
            });
        });

        this.panel.querySelector('#resetStyles').addEventListener('click', () => {
            if (this.selectedText) {
                this.resetTextStyle(this.selectedText);
                this.deselectText();
            }
        });

        const collapseBtn = this.panel.querySelector('.collapse-btn');
        const styleContent = this.panel.querySelector('.style-content');
        collapseBtn.addEventListener('click', () => {
            const isCollapsed = styleContent.style.display === 'none';
            styleContent.style.display = isCollapsed ? 'block' : 'none';
            collapseBtn.textContent = isCollapsed ? '−' : '+';
            this.panel.classList.toggle('collapsed');
        });
    }

    storeOriginalStyle(element) {
        if (!this.originalStyles.has(element)) {
            this.originalStyles.set(element, {
                color: element.getAttribute('fill'),
                fontSize: element.getAttribute('font-size')
            });
        }
    }

    updateTextStyle(element, styles) {
        if (styles.color) {
            element.setAttribute('fill', styles.color);
        }
        if (styles.fontSize) {
            element.setAttribute('font-size', `${styles.fontSize}px`);
        }
    }

    resetTextStyle(element) {
        const original = this.originalStyles.get(element);
        if (original) {
            this.updateTextStyle(element, {
                color: original.color,
                fontSize: parseFloat(original.fontSize)
            });
        }
    }

    deselectText() {
        if (this.selectedText) {
            this.selectedText.classList.remove('selected-text');
            this.selectedText = null;
        }
    }

    handleTextClick(e) {
        const textElement = e.target.closest('text, tspan');
        if (!textElement) return;

        this.deselectText();

        this.selectedText = textElement;
        this.selectedText.classList.add('selected-text');

        const colorInput = this.panel.querySelector('.color-input');
        const sizeInput = this.panel.querySelector('.size-input');

        colorInput.value = textElement.getAttribute('fill') || ArticulateTools.TextStyler.DEFAULT_VALUES.color;
        sizeInput.value = parseFloat(textElement.getAttribute('font-size')) || ArticulateTools.TextStyler.DEFAULT_VALUES.fontSize;

        e.stopPropagation();
    }

    enableTextEditing() {
        document.querySelectorAll('.slide-object-vectorshape').forEach(shape => {
            shape.querySelectorAll('text, tspan').forEach(text => {
                text.classList.add('text-highlight');
                this.storeOriginalStyle(text);
                text.addEventListener('click', this.handleTextClick);
            });
        });
        this.panel.style.display = 'block';
    }

    disableTextEditing() {
        this.deselectText();
        document.querySelectorAll('.slide-object-vectorshape').forEach(shape => {
            shape.querySelectorAll('text, tspan').forEach(text => {
                text.classList.remove('text-highlight');
                text.removeEventListener('click', this.handleTextClick);
            });
        });
        this.panel.style.display = 'none';
    }

    init() {
        this.initStyles();
        this.panel = this.createPanel();
        document.body.appendChild(this.panel);
        this.setupPanelEvents();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        if (this.isEnabled) {
            this.enableTextEditing();
        } else {
            this.disableTextEditing();
        }
        return this.isEnabled;
    }

    destroy() {
        this.disableTextEditing();
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        document.getElementById('text-styler-styles')?.remove();
        this.isEnabled = false;
        this.selectedText = null;
    }

    // Static factory method
    static init() {
        const textStyler = new ArticulateTools.TextStyler();
        textStyler.init();
        return textStyler;
    }

    getEnabled() {
        return this.isEnabled;
    }
}
console.log('text-styler.js loaded');
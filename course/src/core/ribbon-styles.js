window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RibbonStyles = class {
    constructor() {
        this.STYLE_ID = 'articulate-ribbon-styles';
        this.CORE_STYLES = {
            container: `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ffffff;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10000;
                user-select: none;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            `,
            tabs: `
                display: flex;
                border-bottom: 1px solid #ddd;
                padding: 0 8px;
            `,
            content: `
                padding: 8px;
                display: flex;
                gap: 16px;
                transition: height 0.3s;
            `,
            group: `
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 4px;
                border-right: 1px solid #ddd;
            `,
            tools: `
                display: flex;
                gap: 4px;
            `
        };
    
        this.STYLES = `
            .sl-ribbon-container {
                ${this.CORE_STYLES.container}
            }
            .sl-ribbon-tabs {
                ${this.CORE_STYLES.tabs}
            }
            .sl-ribbon-tab {
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 2px solid transparent;
            }
            .sl-ribbon-tab.active {
                border-bottom-color: #0066cc;
                color: #0066cc;
            }
            .sl-ribbon-content {
                ${this.CORE_STYLES.content}
            }
            .sl-ribbon-content.collapsed {
                height: 0;
                overflow: hidden;
                padding: 0;
            }
            .sl-ribbon-group {
                ${this.CORE_STYLES.group}
            }
            .sl-ribbon-tools {
                ${this.CORE_STYLES.tools}
            }
            .sl-ribbon-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 4px 8px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 4px;
            }
            .sl-ribbon-button:hover {
                background: rgba(0,0,0,0.05);
            }
            .sl-ribbon-icon {
                font-size: 20px;
                margin-bottom: 4px;
            }
            .sl-ribbon-label {
                font-size: 12px;
                text-align: center;
            }
                            .sl-ribbon-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 4px 8px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 4px;
                position: relative;
            }
            .sl-ribbon-button:hover {
                background: rgba(0,0,0,0.05);
            }
            .sl-ribbon-button.active {
                background: #e3f2fd;
                border: 1px solid #90caf9;
            }
            .sl-ribbon-button.active::after {
                content: '';
                position: absolute;
                bottom: -4px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                background: #1976d2;
                border-radius: 50%;
            }
        `;
    }

    isStylesheetExists() {
        return !!document.getElementById(this.STYLE_ID);
    }

    createStylesheet() {
        const style = document.createElement('style');
        style.id = this.STYLE_ID;
        style.textContent = this.STYLES;
        document.head.appendChild(style);
        return style;
    }

    init() {
        if (this.isStylesheetExists()) {
            console.warn('Ribbon styles already initialized');
            return null;
        }
        return this.createStylesheet();
    }

    destroy() {
        document.getElementById(this.STYLE_ID)?.remove();
    }

    getStyles() {
        return { ...this.CORE_STYLES };
    }

    getStyleElement() {
        return document.getElementById(this.STYLE_ID);
    }

    applyStyle(element, styleName) {
        if (this.CORE_STYLES[styleName]) {
            element.style.cssText = this.CORE_STYLES[styleName];
            return true;
        }
        return false;
    }

    getScopedStyles(prefix = 'sl') {
        return this.STYLES.replace(/\.sl-/g, `.${prefix}-`);
    }

    // Static factory method
    static init() {
        const styles = new ArticulateTools.RibbonStyles();
        return styles.init();
    }
}
console.log('ribbon-styles loaded');
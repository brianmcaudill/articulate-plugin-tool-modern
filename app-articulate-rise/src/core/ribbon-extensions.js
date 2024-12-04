// Extend the base Ribbon class
ArticulateTools.ExtendedRibbon = class extends ArticulateTools.Ribbon {
    static STORAGE_KEY = 'articulate-ribbon-recent';
    static CLASSES = {
        tooltip: 'sl-ribbon-tooltip',
        tooltipShortcut: 'sl-ribbon-tooltip-shortcut',
        menu: 'sl-ribbon-menu',
        menuItem: 'sl-ribbon-menu-item',
        menuIcon: 'sl-ribbon-menu-icon',
        menuSeparator: 'sl-ribbon-menu-separator'
    };

    static TooltipManager = ArticulateTools.RibbonManagers.TooltipManager;
    static QuickAccessManager = ArticulateTools.RibbonManagers.QuickAccessManager;
    static ContextualTabsManager = ArticulateTools.RibbonManagers.ContextualTabsManager;
    static RecentItemsManager = ArticulateTools.RibbonManagers.RecentItemsManager;

    constructor() {
        super();
        // Wait for container to be created before initializing extensions
        this.initExtensions = this.initExtensions.bind(this);
    }

    initExtensions() {
        // Initialize styles
        ArticulateTools.ExtendedRibbon.initStyles(); // Changed from RibbonExtensions to ExtendedRibbon

        // Initialize managers
        this.tooltipManager = new ArticulateTools.RibbonManagers.TooltipManager();
        this.quickAccessManager = new ArticulateTools.RibbonManagers.QuickAccessManager(
            this.container,
            this.tooltipManager
        );
        this.contextualTabsManager = new ArticulateTools.RibbonManagers.ContextualTabsManager(
            this.container
        );
        this.recentManager = new ArticulateTools.RibbonManagers.RecentItemsManager();

        // Apply tooltips to existing buttons
        this.setupTooltips();
    }

    static initStyles() {
        // Add any extension-specific styles here
        const styleSheet = document.createElement('style');
        styleSheet.id = 'ribbon-extensions-styles';
        styleSheet.textContent = `
            .sl-ribbon-tooltip {
                position: absolute;
                background: #333;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10001;
                transition: opacity 0.2s;
            }
            .sl-ribbon-tooltip-shortcut {
                margin-left: 8px;
                opacity: 0.7;
            }
            .sl-ribbon-quick-access {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-right: 1px solid #ddd;
        }
        .sl-ribbon-quick-button {
            padding: 4px;
            background: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        .sl-ribbon-quick-button:hover {
            background: rgba(0,0,0,0.1);
        }
            .sl-ribbon-contextual-tab {
            background: #f0f0f0;
            border-bottom: 1px solid #ddd;
            padding: 8px;
        }
        .sl-ribbon-contextual-header {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .sl-ribbon-contextual-content {
            display: flex;
            gap: 8px;
        }
        `;
        document.head.appendChild(styleSheet);
    }


    setupTooltips() {
        if (!this.container) return;
    
        this.container.querySelectorAll('.sl-ribbon-button').forEach(button => {
            const tool = this.findToolData(button);
            if (!tool) return;
    
            button.addEventListener('mouseenter', () => {
                this.tooltipManager.show(button, tool.label, tool.shortcut);
            });
    
            button.addEventListener('mouseleave', () => {
                this.tooltipManager.hide();
            });
        });
    }

    findToolData(button) {
        const label = button.querySelector('.sl-ribbon-label')?.textContent;
        if (!label) return null;

        for (const tab of ArticulateTools.RibbonConfig.TABS) {
            for (const group of tab.groups) {
                const tool = group.tools.find(t => t.label === label);
                if (tool) return tool;
            }
        }
        return null;
    }

    renderContent() {
        super.renderContent();
        this.setupTooltips();
    }

    addRecentItem(item) {
        this.recentManager.addItem(item);
        this.updateRecentDisplay();
    }

    updateRecentDisplay() {
        const items = this.recentManager.getItems();
        const recent = this.container.querySelector('.sl-ribbon-recent');

        if (recent) {
            if (items.length > 0) {
                recent.textContent = `Recent: ${items[0].name}`;
                recent.title = items.map(i => i.name).join('\n');
            } else {
                recent.textContent = '';
            }
        }
    }

    showContextualTabs(type) {
        this.contextualTabsManager.showTabs(type);
    }

    hideContextualTabs() {
        this.contextualTabsManager.hideTabs();
    }

    destroy() {
        this.tooltipManager?.destroy();
        this.quickAccessManager?.destroy();
        this.contextualTabsManager?.destroy();
        this.recentManager?.clear();
        super.destroy();
    }
    init() {
        super.init();
        this.initExtensions();
    }
    // Static factory method
    static init() {
        const ribbon = new ArticulateTools.ExtendedRibbon();
        ribbon.mount();

        // Add global toggle function
        window.toggleStorylineRibbon = () => {
            const display = ribbon.container.style.display === 'none' ? 'block' : 'none';
            ribbon.container.style.display = display;
            ribbon.spacer.style.display = display;
        };

        console.log('Extended Storyline ribbon initialized! Use window.toggleStorylineRibbon() to show/hide.');
        return ribbon;
    }
};
console.log('ribbon-extensions.js loaded');
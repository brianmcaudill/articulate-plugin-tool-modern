window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RibbonManagers = class {
    static STORAGE_KEY = 'articulate-ribbon-recent';
    static CLASSES = {
        tooltip: 'sl-ribbon-tooltip',
        tooltipShortcut: 'sl-ribbon-tooltip-shortcut',
        menu: 'sl-ribbon-menu',
        menuItem: 'sl-ribbon-menu-item',
        menuIcon: 'sl-ribbon-menu-icon',
        menuSeparator: 'sl-ribbon-menu-separator'
    };

    static TooltipManager = class {
        #tooltip = null;

        constructor() {
            this.#createTooltip();
        }

        #createTooltip() {
            this.#tooltip = document.createElement('div');
            this.#tooltip.className = ArticulateTools.RibbonManagers.CLASSES.tooltip;
            this.#tooltip.style.opacity = '0';
            this.#tooltip.style.pointerEvents = 'none';
            document.body.appendChild(this.#tooltip);
        }

        show(element, content, shortcut = '') {
            if (!this.#tooltip) return;

            const rect = element.getBoundingClientRect();
            this.#tooltip.innerHTML = content +
                (shortcut ? `<span class="${ArticulateTools.RibbonManagers.CLASSES.tooltipShortcut}">${shortcut}</span>` : '');

            this.#tooltip.style.opacity = '1';
            const tooltipRect = this.#tooltip.getBoundingClientRect();

            const left = Math.max(0,
                Math.min(
                    rect.left + (rect.width - tooltipRect.width) / 2,
                    window.innerWidth - tooltipRect.width
                )
            );

            this.#tooltip.style.left = `${left}px`;
            this.#tooltip.style.top = `${rect.bottom + 8}px`;
        }

        hide() {
            if (this.#tooltip) {
                this.#tooltip.style.opacity = '0';
            }
        }

        destroy() {
            this.#tooltip?.remove();
            this.#tooltip = null;
        }
    };

    static RecentItemsManager = class {
        #items = [];
        #maxItems;

        constructor(maxItems = 10) {
            this.#maxItems = maxItems;
            this.#loadItems();
        }

        #loadItems() {
            try {
                const saved = localStorage.getItem(ArticulateTools.RibbonManagers.STORAGE_KEY);
                if (saved) {
                    this.#items = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Failed to load recent items:', error);
                this.#items = [];
            }
        }

        #saveItems() {
            try {
                localStorage.setItem(ArticulateTools.RibbonManagers.STORAGE_KEY, JSON.stringify(this.#items));
            } catch (error) {
                console.error('Failed to save recent items:', error);
            }
        }

        addItem(item) {
            if (!item?.id) return false;

            this.#items = [item, ...this.#items.filter(i => i.id !== item.id)]
                .slice(0, this.#maxItems);
            this.#saveItems();
            return true;
        }

        getItems() {
            return [...this.#items];
        }

        clear() {
            this.#items = [];
            localStorage.removeItem(ArticulateTools.RibbonManagers.STORAGE_KEY);
        }
    };

    static QuickAccessManager = class {
        constructor(container, tooltipManager) {
            this.container = container;
            this.tooltipManager = tooltipManager;
            this.quickAccessBar = this.createQuickAccessBar();
            this.container?.appendChild(this.quickAccessBar);
        }

        createQuickAccessBar() {
            const bar = document.createElement('div');
            bar.className = 'sl-ribbon-quick-access';
            return bar;
        }

        addButton(icon, label, action, shortcut = '') {
            const button = document.createElement('button');
            button.className = 'sl-ribbon-quick-button';
            button.innerHTML = icon;
            button.onclick = action;

            button.addEventListener('mouseenter', () => {
                this.tooltipManager?.show(button, label, shortcut);
            });

            button.addEventListener('mouseleave', () => {
                this.tooltipManager?.hide();
            });

            this.quickAccessBar.appendChild(button);
            return button;
        }

        destroy() {
            this.quickAccessBar?.remove();
            this.quickAccessBar = null;
            this.container = null;
            this.tooltipManager = null;
        }
    };

    static ContextualTabsManager = class {
        constructor(container) {
            this.container = container;
            this.contextualTabs = new Map();
        }

        createTab(type, label, content) {
            const tab = document.createElement('div');
            tab.className = 'sl-ribbon-contextual-tab';
            tab.dataset.type = type;
            tab.innerHTML = `
                <div class="sl-ribbon-contextual-header">${label}</div>
                <div class="sl-ribbon-contextual-content">${content}</div>
            `;
            tab.style.display = 'none';
            this.contextualTabs.set(type, tab);
            this.container?.appendChild(tab);
            return tab;
        }

        showTabs(type) {
            const tab = this.contextualTabs.get(type);
            if (tab) {
                tab.style.display = 'block';
            }
        }

        hideTabs() {
            this.contextualTabs.forEach(tab => {
                tab.style.display = 'none';
            });
        }

        destroy() {
            this.contextualTabs.forEach(tab => tab.remove());
            this.contextualTabs.clear();
            this.container = null;
        }
    };
    
    static MenuManager = class {
        #activeMenu = null;
        #documentClickHandler = null;

        constructor() {
            this.#documentClickHandler = () => this.hideActiveMenu();
            document.addEventListener('click', this.#documentClickHandler);
        }

        #createMenuItem(item) {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = ArticulateTools.RibbonManagers.CLASSES.menuSeparator;
                return separator;
            }

            const menuItem = document.createElement('div');
            menuItem.className = ArticulateTools.RibbonManagers.CLASSES.menuItem;
            menuItem.innerHTML = `
                <span class="${ArticulateTools.RibbonManagers.CLASSES.menuIcon}">${item.icon || ''}</span>
                <span>${item.label}</span>
            `;

            menuItem.onclick = (e) => {
                e.stopPropagation();
                item.action?.();
                this.hideActiveMenu();
            };

            return menuItem;
        }

        #positionMenu(menu, button) {
            const buttonRect = button.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();

            let left = buttonRect.left;
            let top = buttonRect.bottom + 4;

            if (left + menuRect.width > window.innerWidth) {
                left = window.innerWidth - menuRect.width - 4;
            }
            if (top + menuRect.height > window.innerHeight) {
                top = buttonRect.top - menuRect.height - 4;
            }

            menu.style.left = `${Math.max(4, left)}px`;
            menu.style.top = `${Math.max(4, top)}px`;
        }

        showMenu(button, items) {
            this.hideActiveMenu();

            if (!Array.isArray(items) || items.length === 0) return;

            const menu = document.createElement('div');
            menu.className = ArticulateTools.RibbonManagers.CLASSES.menu;

            items.forEach(item => {
                menu.appendChild(this.#createMenuItem(item));
            });

            document.body.appendChild(menu);
            this.#positionMenu(menu, button);
            this.#activeMenu = menu;
        }

        hideActiveMenu() {
            if (this.#activeMenu) {
                this.#activeMenu.remove();
                this.#activeMenu = null;
            }
        }

        destroy() {
            this.hideActiveMenu();
            document.removeEventListener('click', this.#documentClickHandler);
            this.#documentClickHandler = null;
        }
    };

};

console.log('ribbon-manager.js loaded');
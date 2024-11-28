window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.Ribbon = class {
    #elements = {};
    #activeTab = 'home';
    #isCollapsed = false;
    #activeTools = new Set();

    constructor() {
        this.#elements = {
            container: null,
            tabs: null,
            content: null,
            minimizeBtn: null
        };
    }


    init() {
        this.#createContainer();
        this.#createTabs();
        this.#createContent();
        this.render();
    }

    #createContainer() {
        this.#elements.container = document.createElement('div');
        this.#elements.container.className = 'sl-ribbon-container';
    }

    #createTabs() {
        this.#elements.tabs = document.createElement('div');
        this.#elements.tabs.className = 'sl-ribbon-tabs';
        this.#elements.container.appendChild(this.#elements.tabs);
    }

    #createContent() {
        this.#elements.content = document.createElement('div');
        this.#elements.content.className = 'sl-ribbon-content';
        this.#elements.container.appendChild(this.#elements.content);
    }

    mount() {
        document.body.appendChild(this.#elements.container);
    }

    toggle() {
        this.#isCollapsed = !this.#isCollapsed;
        this.#elements.content.classList.toggle('collapsed');
    }

    destroy() {
        this.#elements.container?.remove();
        this.#activeTools.clear();
        this.#elements = {};
    }
    render() {
        // Clear existing content
        this.#elements.tabs.innerHTML = '';
        this.#elements.content.innerHTML = '';

        // Render tabs
        ArticulateTools.RibbonConfig.TABS.forEach(tab => {
            const tabElement = document.createElement('div');
            tabElement.className = 'sl-ribbon-tab';
            tabElement.textContent = tab.label;
            tabElement.dataset.tab = tab.id;
            
            if (tab.id === this.#activeTab) {
                tabElement.classList.add('active');
            }

            tabElement.addEventListener('click', () => {
                this.#activeTab = tab.id;
                this.render();
            });

            this.#elements.tabs.appendChild(tabElement);
        });

        // Render active tab content
        const activeTabConfig = ArticulateTools.RibbonConfig.TABS.find(t => t.id === this.#activeTab);
        if (activeTabConfig) {
            activeTabConfig.groups.forEach(group => {
                const groupElement = document.createElement('div');
                groupElement.className = 'sl-ribbon-group';
                
                const toolsContainer = document.createElement('div');
                toolsContainer.className = 'sl-ribbon-tools';

                group.tools.forEach(tool => {
                    const button = document.createElement('button');
                    button.className = 'sl-ribbon-button';
                    if (this.#activeTools.has(tool.id)) {
                        button.classList.add('active');
                    }
                    button.innerHTML = `
                        <span class="sl-ribbon-icon">${tool.icon}</span>
                        <span class="sl-ribbon-label">${tool.label}</span>
                    `;
                    if (tool.toggleFn) {
                        button.addEventListener('click', () => {
                            if (this.#activeTools.has(tool.id)) {
                                this.#activeTools.delete(tool.id);
                            } else {
                                this.#activeTools.add(tool.id);
                            }
                            window[tool.toggleFn]();
                            button.classList.toggle('active');
                        });
                    }
                    toolsContainer.appendChild(button);
                });

                groupElement.appendChild(toolsContainer);
                this.#elements.content.appendChild(groupElement);
            });
        }
    }
    get container() {
        return this.#elements.container;
    }
}
console.log('ribbon-core.js loaded');
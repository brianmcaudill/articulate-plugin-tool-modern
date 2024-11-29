window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.Ribbon = class {
    #elements = {
        container: null,
        tabs: null,
        content: null,
        subToolbars: new Map()
    };
    #activeTab = 'home';
    #isCollapsed = false;
    #activeTools = new Set();
    #activeSubToolbar = null;
    constructor() {
        this.#elements = {
            ...this.#elements,
            container: null,
            tabs: null,
            content: null,
            minimizeBtn: null
        };
            // Set the active tab in constructor after RibbonConfig is available
            this.#activeTab = ArticulateTools.RibbonConfig.TabID.HOME;
    }
    createSubToolbar(tool) {
        const toolbar = document.createElement('div');
        toolbar.className = 'sl-ribbon-subtoolbar';
        toolbar.style.display = 'none';
        
        tool.subTools?.forEach(subTool => {
            const button = this.createToolButton(subTool);
            toolbar.appendChild(button);
        });
        
        this.#elements.container.appendChild(toolbar);
        this.#elements.subToolbars.set(tool.id, toolbar);
        
        return toolbar;
    }
    createToolButton(tool) {
        const button = document.createElement('button');
        button.className = 'sl-ribbon-button';
        if (tool.subTools?.length) {
            button.classList.add('has-subtools');
        }
        
        button.innerHTML = `
            <span class="sl-ribbon-icon">${tool.icon}</span>
            <span class="sl-ribbon-label">${tool.label}</span>
        `;
        
        button.addEventListener('click', () => {
            if (tool.subTools?.length) {
                this.toggleSubToolbar(tool.id);
            } else if (tool.toggleFn) {
                window[tool.toggleFn]();
            }
        });
        
        return button;
    }
    toggleSubToolbar(toolId) {
    // If clicking the same tool that's already active, hide the toolbar
    if (this.#activeSubToolbar && this.#activeSubToolbar === this.#elements.subToolbars.get(toolId)) {
        this.#activeSubToolbar.style.display = 'none';
        this.#activeSubToolbar = null;
        return;
    }
    // Hide current subtoolbar if exists
    if (this.#activeSubToolbar) {
        this.#activeSubToolbar.style.display = 'none';
    }

        const toolbar = this.#elements.subToolbars.get(toolId);
        if (toolbar) {
            toolbar.style.display = 'block';
            this.#activeSubToolbar = toolbar;
        }
    }

    init() {
        this.#createContainer();
        this.#createTabs();
        this.#createContent();
        this.render();
    }

    // #createContainer() {
    //     this.#elements.container = document.createElement('div');
    //     this.#elements.container.className = 'sl-ribbon-container';
    // }
    #createContainer() {
        // Create spacer element
        this.spacer = document.createElement('div');
        this.spacer.className = 'sl-ribbon-spacer';
        document.body.prepend(this.spacer);
    
        // Create ribbon container
        this.#elements.container = document.createElement('div');
        this.#elements.container.className = 'sl-ribbon-container';
        document.body.prepend(this.#elements.container);
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

    // destroy() {
    //     this.#elements.container?.remove();
    //     this.#activeTools.clear();
    //     this.#elements = {};
    // }
    destroy() {
        this.#elements.container?.remove();
        this.spacer?.remove();
        this.#activeTools.clear();
        this.#elements = {};
    }
    render() {
    // Clear existing content
    this.#elements.tabs.innerHTML = '';
    this.#elements.content.innerHTML = '';

    // Set default tab if undefined
    if (!this.#activeTab) {
        this.#activeTab = ArticulateTools.RibbonConfig.TabID.HOME;
    }

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
                    const button = this.createToolButton(tool);
                    toolsContainer.appendChild(button);
                    
                    if (tool.subTools?.length) {
                        this.createSubToolbar(tool);
                    }
                });
                // group.tools.forEach(tool => {
                //     const button = document.createElement('button');
                //     button.className = 'sl-ribbon-button';
                //     if (this.#activeTools.has(tool.id)) {
                //         button.classList.add('active');
                //     }
                //     button.innerHTML = `
                //         <span class="sl-ribbon-icon">${tool.icon}</span>
                //         <span class="sl-ribbon-label">${tool.label}</span>
                //     `;
                //     if (tool.toggleFn) {
                //         button.addEventListener('click', () => {
                //             if (this.#activeTools.has(tool.id)) {
                //                 this.#activeTools.delete(tool.id);
                //             } else {
                //                 this.#activeTools.add(tool.id);
                //             }
                //             window[tool.toggleFn]();
                //             button.classList.toggle('active');
                //         });
                //     }
                //     toolsContainer.appendChild(button);
                // });

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
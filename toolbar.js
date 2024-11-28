

// Storyline Ribbon Data Structure

// Storyline Ribbon Core Functionality


// Initialize and export
const initStorylineRibbon = () => {
    const ribbon = new StorylineRibbon();
    ribbon.mount();
    
    // Export toggle function
    window.toggleStorylineRibbon = () => {
        ribbon.container.style.display = 
            ribbon.container.style.display === 'none' ? 'block' : 'none';
        ribbon.spacer.style.display = ribbon.container.style.display;
    };

    console.log('Storyline ribbon initialized! Use window.toggleStorylineRibbon() to show/hide.');
};
// Additional styles for tooltips and enhanced features
const initRibbonExtendedStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .sl-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10001;
            pointer-events: none;
            transition: opacity 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            max-width: 200px;
            white-space: nowrap;
        }

        .sl-tooltip-shortcut {
            opacity: 0.8;
            margin-left: 4px;
            padding: 1px 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
        }

        .sl-ribbon-button-tooltip {
            margin-top: 4px;
        }

        .sl-ribbon-contextual {
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
        }

        .sl-ribbon-button.with-menu::after {
            content: '▾';
            font-size: 10px;
            margin-top: 2px;
        }

        .sl-ribbon-menu {
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 4px 0;
            min-width: 120px;
            z-index: 10002;
        }

        .sl-ribbon-menu-item {
            padding: 6px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sl-ribbon-menu-item:hover {
            background: #f5f5f5;
        }

        .sl-ribbon-menu-separator {
            height: 1px;
            background: #ddd;
            margin: 4px 0;
        }

        .sl-ribbon-quick-access {
            position: absolute;
            left: 8px;
            top: 4px;
            display: flex;
            gap: 4px;
        }

        .sl-ribbon-quick-button {
            padding: 4px;
            border-radius: 4px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
        }

        .sl-ribbon-quick-button:hover {
            opacity: 1;
            background: rgba(0,0,0,0.05);
        }

        .sl-ribbon-recent {
            position: absolute;
            right: 40px;
            top: 4px;
            font-size: 12px;
            color: #666;
        }
    `;
    document.head.appendChild(style);
};






// Initialize with extended features
const initStorylineRibbonExtended = () => {
    initRibbonExtendedStyles();
    const ribbon = new StorylineRibbonExtended();
    ribbon.mount();
    
    window.toggleStorylineRibbon = () => {
        ribbon.container.style.display = 
            ribbon.container.style.display === 'none' ? 'block' : 'none';
        ribbon.spacer.style.display = ribbon.container.style.display;
    };

    console.log('Extended Storyline ribbon initialized! Use window.toggleStorylineRibbon() to show/hide.');
    return ribbon;
};
// Main initialization function for the Storyline ribbon interface
const initStorylineInterface = () => {
    // Initialize all required components
    const ribbon = initStorylineRibbonExtended();

    // Set up global event listeners
    document.addEventListener('keydown', (e) => {
        // Ctrl+Space to toggle ribbon
        if (e.ctrlKey && e.code === 'Space') {
            window.toggleStorylineRibbon();
            e.preventDefault();
        }

        // Ctrl+S for quick save
        if (e.ctrlKey && e.code === 'KeyS') {
            ribbon.handleQuickSave();
            e.preventDefault();
        }

        // Ctrl+Z for undo
        if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey) {
            ribbon.handleUndo();
            e.preventDefault();
        }

        // Ctrl+Shift+Z or Ctrl+Y for redo
        if ((e.ctrlKey && e.shiftKey && e.code === 'KeyZ') || 
            (e.ctrlKey && e.code === 'KeyY')) {
            ribbon.handleRedo();
            e.preventDefault();
        }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            ribbon.render(); // Re-render ribbon to adjust layout
        }, 250);
    });

    // Set up mutation observer to handle dynamic content
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.hasAttribute('data-sl-type')) {
                    shouldUpdate = true;
                }
            });
            
            mutation.removedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.hasAttribute('data-sl-type')) {
                    shouldUpdate = true;
                }
            });
        });

        if (shouldUpdate) {
            ribbon.showContextualTabs(document.querySelector('[data-sl-type]')?.dataset.slType);
        }
    });

    // Start observing the document for dynamic content changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-sl-type']
    });

    // Handle focus tracking
    document.addEventListener('mousedown', (e) => {
        const target = e.target.closest('[data-sl-type]');
        if (target) {
            // Remove previous focus indicators
            document.querySelectorAll('.sl-focus').forEach(el => {
                el.classList.remove('sl-focus');
            });
            
            // Add focus to new target
            target.classList.add('sl-focus');
            
            // Show appropriate contextual tabs
            ribbon.showContextualTabs(target.dataset.slType);
        }
    });

    // Initialize state management
    const state = {
        history: [],
        historyIndex: -1,
        maxHistory: 50
    };

    // Function to add state to history
    const pushState = (action) => {
        // Remove any future states if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
        }

        // Add new state
        state.history.push(action);
        
        // Remove oldest state if we exceed max history
        if (state.history.length > state.maxHistory) {
            state.history.shift();
        } else {
            state.historyIndex++;
        }

        // Enable/disable undo/redo buttons based on history
        updateUndoRedoState();
    };

    // Function to update undo/redo button states
    const updateUndoRedoState = () => {
        const undoButton = document.querySelector('#sl-quick-undo');
        const redoButton = document.querySelector('#sl-quick-redo');

        if (undoButton) {
            undoButton.disabled = state.historyIndex < 0;
        }
        if (redoButton) {
            redoButton.disabled = state.historyIndex >= state.history.length - 1;
        }
    };

    // Export necessary functions to window for external access
    window.storylineInterface = {
        ribbon,
        pushState,
        toggleRibbon: window.toggleStorylineRibbon
    };

    // Return the interface object
    return window.storylineInterface;
};
// Loader function to initialize the Storyline interface
(() => {
    // Check if already initialized
    if (window.storylineInterfaceInitialized) {
        console.warn('Storyline interface is already initialized');
        return;
    }

    // Function to load scripts in sequence
    const loadScript = async (url) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Function to check if DS is loaded
    const waitForDS = () => {
        return new Promise((resolve) => {
            const check = () => {
                if (window.DS) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    };

    // Main initialization sequence
    const init = async () => {
        try {
            // Wait for DS to be available
            await waitForDS();

            // Load dependencies in sequence
            const scripts = [
                'ribbon-styles.js',
                'ribbon-data.js',
                'ribbon-core.js',
                'ribbon-tooltips.js',
                'ribbon-extended.js',
                'ribbon-init.js'
            ];

            for (const script of scripts) {
                await loadScript(script);
            }

            // Initialize the interface
            const interface = initStorylineInterface();

            // Mark as initialized
            window.storylineInterfaceInitialized = true;

            // Log success
            console.log('Storyline interface successfully initialized');

            return interface;

        } catch (error) {
            console.error('Failed to initialize Storyline interface:', error);
            throw error;
        }
    };

    // Handle initialization based on document ready state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();



initStorylineRibbon()
initRibbonStyles()
initStorylineRibbonExtended()
initRibbonExtendedStyles()
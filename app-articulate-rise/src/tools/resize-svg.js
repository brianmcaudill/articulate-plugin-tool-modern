window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.ResizeSvgTool = class {
    constructor() {
        this.isEnabled = false;
        this.vectorshapeStates = new WeakMap();

        // Bind methods
        this.init = this.init.bind(this);
        this.toggle = this.toggle.bind(this);
        this.destroy = this.destroy.bind(this);
        this.getEnabled = this.getEnabled.bind(this);
        this.makeVectorshapeResizable = this.makeVectorshapeResizable.bind(this);
        this.removeVectorshapeResize = this.removeVectorshapeResize.bind(this);
    }

    static STYLES = `
        .resize-handle {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #ff4444;
            cursor: se-resize;
            border-radius: 50%;
            border: 2px solid white;
            z-index: 10002;
            box-shadow: 0 0 3px rgba(0,0,0,0.5);
            pointer-events: auto !important;
        }
        .resizing {
            user-select: none;
        }
        .reset-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 2px 5px;
            cursor: pointer;
            font-size: 12px;
            z-index: 10001;
            pointer-events: auto !important;
        }
        .slide-object-vectorshape {
            pointer-events: auto !important;
            position: relative;
            display: inline-block;
        }
    `;

    initStyles() {
        if (!document.getElementById('resize-tool-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'resize-tool-styles';
            styleSheet.textContent = ArticulateTools.ResizeSvgTool.STYLES;
            document.head.appendChild(styleSheet);
        }
    }
    createControlIcons(vectorshape) {
        const container = vectorshape.closest('.slide-object-vectorshape');
        if (!container) {
            console.error('Error: No container found for vectorshape.');
            return;
        }

        // Create controls container
        const controls = document.createElement('div');
        controls.className = 'resize-controls';
        controls.style.position = 'absolute';
        controls.style.top = '10px'; // Adjusted for better placement
        controls.style.right = '10px'; // Adjusted for better placement
        controls.style.display = 'flex';
        controls.style.gap = '10px'; // Increased gap for spacing
        controls.style.zIndex = '20';

        // Define actions and icons
        const actions = [
            { icon: '↩️', label: 'Undo' },
            { icon: '↪️', label: 'Redo' },
            { icon: '❌', label: 'Delete' },
            { icon: '🔄', label: 'Swap' }
        ];

        // Create each button
        actions.forEach((action, index) => {
            const button = document.createElement('button');
            button.textContent = action.icon;
            button.setAttribute('aria-label', action.label); // Accessibility
            button.style.background = 'rgba(0, 0, 0, 0.7)';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.padding = '8px';
            button.style.cursor = 'pointer';
            button.style.fontSize = '16px'; // Larger font size
            button.title = action.label; // Tooltip for clarity

            // Add hover effect
            button.addEventListener('mouseover', () => (button.style.background = 'rgba(0, 0, 0, 0.9)'));
            button.addEventListener('mouseout', () => (button.style.background = 'rgba(0, 0, 0, 0.7)'));

            // Add action handler
            button.addEventListener('click', () => this.handleControlAction(index, vectorshape));

            controls.appendChild(button);
        });
    }

    getOriginalDimensions(vectorshape) {
        console.log('Fetching original dimensions for:', vectorshape);

        // Ensure vectorshape is not null or undefined
        if (!vectorshape) {
            console.error('Error: vectorshape is null or undefined.');
            return this.defaultDimensions();
        }

        // Check if it's a valid DOM element
        if (!(vectorshape instanceof Element)) {
            console.error('Error: vectorshape is not a DOM element.', vectorshape);
            return this.defaultDimensions();
        }

        // Find the SVG element or a suitable child within the container
        const svgElement = vectorshape.querySelector('svg');
        if (!svgElement) {
            console.error('Error: No <svg> element found inside vectorshape.', vectorshape);
            return this.defaultDimensions();
        }

        console.log('Found <svg> element:', svgElement);

        // Try getBBox if available on the <svg> or its children
        try {
            const bboxElement = svgElement.querySelector('image, path, g') || svgElement; // Look for meaningful child elements
            if (bboxElement && typeof bboxElement.getBBox === 'function') {
                const bbox = bboxElement.getBBox();
                console.log('Using getBBox:', bbox);
                return {
                    width: bbox.width,
                    height: bbox.height,
                    x: bbox.x,
                    y: bbox.y,
                    transform: svgElement.getAttribute('transform') || '',
                };
            }
        } catch (error) {
            console.error('Error fetching dimensions with getBBox:', error);
        }

        // Fallback to getBoundingClientRect
        try {
            const rect = svgElement.getBoundingClientRect();
            console.log('Using getBoundingClientRect:', rect);
            return {
                width: rect.width,
                height: rect.height,
                x: rect.left,
                y: rect.top,
                transform: svgElement.getAttribute('transform') || '',
            };
        } catch (error) {
            console.error('Error fetching dimensions with getBoundingClientRect:', error);
        }

        // Return default dimensions if all methods fail
        console.warn('Unable to fetch dimensions. Returning default values.');
        return this.defaultDimensions();
    }

    defaultDimensions() {
        return {
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            transform: '',
        };
    }


    createResizeHandles(vectorshape) {
        const container = vectorshape.closest('.slide-object-vectorshape');
        if (!container) {
            console.error('Error: No container found for vectorshape.');
            return;
        }

        // Create the handle
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.style.position = 'absolute';
        handle.style.width = '20px';
        handle.style.height = '20px';
        handle.style.background = '#007bff';
        handle.style.border = '3px solid white';
        handle.style.borderRadius = '50%';
        handle.style.cursor = 'pointer';
        handle.style.zIndex = '10';

        // Position the handle at the bottom-right corner
        const bbox = this.getOriginalDimensions(vectorshape);
        handle.style.left = `${bbox.width - 10}px`;
        handle.style.top = `${bbox.height - 10}px`;

        // Append handle to the container
        container.style.position = 'relative'; // Ensure container is positioned
        container.appendChild(handle);

        // Add listeners for resizing
        container.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                console.log('Handle clicked via delegation:', e.target);
                this.startResize(e, vectorshape);
            }
        });
        

        console.log('Resize handle added:', handle);
    }



    createResetButton() {
        console.log('ResizeSvgTool.createResetButton(): vars: resetBtn');
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.innerText = '↺';
        return resetBtn;
    }

    updateVectorshapeTransform(vectorshape, scaleX, scaleY) {
        vectorshape.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
    }

    makeVectorshapeResizable(vectorshape) {
        const state = {
            original: this.getOriginalDimensions(vectorshape),
            isResizing: false,
            startX: 0,
            startY: 0,
            scaleX: 1,
            scaleY: 1,
        };
        this.vectorshapeStates.set(vectorshape, state);

        // Create resize handle
        const handle = this.createResizeHandles(vectorshape);
        const resetBtn = this.createResetButton();

        // Start resize logic
        const startResize = (e) => {
            this.currentResizingShape = vectorshape; // Track the current shape being resized
            const state = this.vectorshapeStates.get(vectorshape);
        
            if (!state) {
                console.error('Error: No state found for vectorshape.');
                return;
            }
        
            state.isResizing = true;
            state.startX = e.clientX;
            state.startY = e.clientY;
            state.startWidth = vectorshape.offsetWidth;
            state.startHeight = vectorshape.offsetHeight;
        
            // Add event listeners for resizing
            document.addEventListener('mousemove', this.doResize);
            document.addEventListener('mouseup', this.endResize);
        
            console.log('Resize started for:', vectorshape);
        };

        // Perform resize logic
        const doResize = (e) => {
            const vectorshape = this.currentResizingShape; // Track the active resizing shape
            const state = this.vectorshapeStates.get(vectorshape);
            if (!state || !state.isResizing) return;

            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;

            // Calculate new dimensions
            const newWidth = Math.max(50, state.startWidth + dx);
            const newHeight = Math.max(50, state.startHeight + dy);

            // Update dimensions
            vectorshape.style.width = `${newWidth}px`;
            vectorshape.style.height = `${newHeight}px`;

            console.log(`Resizing: Width=${newWidth}, Height=${newHeight}`);
        };

        // End resize logic
        const endResize = () => {
            const vectorshape = this.currentResizingShape; // Track the active resizing shape
            const state = this.vectorshapeStates.get(vectorshape);
            if (!state) return;

            state.isResizing = false;

            // Remove event listeners
            document.removeEventListener('mousemove', this.doResize);
            document.removeEventListener('mouseup', this.endResize);

            console.log('Resize ended for:', vectorshape);
        };

        // Reset dimensions
        resetBtn.addEventListener('click', () => {
            vectorshape.setAttribute('transform', state.original.transform);
        });

        // Attach event listeners
        try {
            handle.addEventListener('mousedown', startResize, true);
            document.addEventListener('mousemove', doResize, true);
            document.addEventListener('mouseup', endResize, true);

            // Attach reset button
            vectorshape.closest('svg')?.parentNode.appendChild(resetBtn);
            // Ensure controls are added during initialization
            this.createControlIcons(vectorshape);

        } catch (e) {
            console.error('Error attaching resize event listeners:', e);
            throw e;
         }
    }

    removeVectorshapeResize(vectorshape) {
        const state = this.vectorshapeStates.get(vectorshape);
        if (!state) return;

        const handle = document.querySelector('.resize-handle');
        const resetBtn = document.querySelector('.reset-btn');

        handle?.remove();
        resetBtn?.remove();

        this.vectorshapeStates.delete(vectorshape);
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');

        if (this.isEnabled) {
            vectorshapes.forEach(shape => this.makeVectorshapeResizable(shape));
        } else {
            vectorshapes.forEach(shape => this.removeVectorshapeResize(shape));
        }
    }

    init() {
        this.initStyles();
    }

    destroy() {
        const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');
        vectorshapes.forEach(shape => this.removeVectorshapeResize(shape));

        const styleTag = document.getElementById('resize-tool-styles');
        styleTag?.remove();

        this.isEnabled = false;
    }

    getEnabled() {
        return this.isEnabled;
    }

    static init() {
        const resizeSvgTool = new ArticulateTools.ResizeSvgTool();
        resizeSvgTool.init();
        return resizeSvgTool;
    }
};

console.log('SVG ResizeSvgTool loaded.');

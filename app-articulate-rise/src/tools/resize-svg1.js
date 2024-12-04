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

    getOriginalDimensions(vectorshape) {
        console.log('Fetching original dimensions for:', vectorshape);
    
        // Ensure the element is valid and part of the DOM
        if (!vectorshape || !(vectorshape instanceof SVGGraphicsElement)) {
            console.error('Error: vectorshape is not a valid SVGGraphicsElement.', vectorshape);
            return this.defaultDimensions();
        }
    console.log(1)
        // Check visibility in the DOM
        if (!document.contains(vectorshape)) {
            console.warn('Warning: vectorshape is not yet rendered in the DOM.', vectorshape);
            return this.defaultDimensions();
        }
        console.log(2)
        // Use getBBox if available and the element is rendered
        if (typeof vectorshape.getBBox === 'function') {
            console.log("vectorshape.getBBox: " + vectorshape.getBBox)
            try {
                const options = { stroke: true }; // Include stroke in bounding box if needed
                const bbox = vectorshape.getBBox(options);
                console.log('Using getBBox:', bbox);
                return {
                    width: bbox.width,
                    height: bbox.height,
                    x: bbox.x,
                    y: bbox.y,
                    transform: vectorshape.getAttribute('transform') || '',
                };
            } catch (error) {
                console.error('Error fetching dimensions with getBBox:', error);
            }
        }
        console.log(3)
        // Fallback to getBoundingClientRect
        if (typeof vectorshape.getBoundingClientRect === 'function') {
            try {
                const rect = vectorshape.getBoundingClientRect();
                console.log('Using getBoundingClientRect:', rect);
                return {
                    width: rect.width,
                    height: rect.height,
                    x: rect.left,
                    y: rect.top,
                    transform: vectorshape.getAttribute('transform') || '',
                };
            } catch (error) {
                console.error('Error fetching dimensions with getBoundingClientRect:', error);
            }
        }
        console.log(4)
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

    createResizeHandle(vectorshape) {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';

        const { width, height, x, y } = this.getOriginalDimensions(vectorshape);

        handle.style.position = 'absolute';
        handle.style.left = `${x + width - 6}px`;
        handle.style.top = `${y + height - 6}px`;

        document.body.appendChild(handle); // Attach handle to the document body
        return handle;
    }

    createResetButton() {
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
        const handle = this.createResizeHandle(vectorshape);
        const resetBtn = this.createResetButton(vectorshape);

        // Start resize logic
        const startResize = (e) => {
            state.isResizing = true;
            state.startX = e.clientX;
            state.startY = e.clientY;

            document.body.classList.add('resizing');
            e.preventDefault();
        };

        // Perform resize logic
        const doResize = (e) => {
            if (!state.isResizing) return;

            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;

            const newScaleX = Math.max(0.1, state.scaleX + dx / state.original.width);
            const newScaleY = Math.max(0.1, state.scaleY + dy / state.original.height);

            this.updateVectorshapeTransform(vectorshape, newScaleX, newScaleY);
        };

        // End resize logic
        const endResize = () => {
            if (!state.isResizing) return;

            state.isResizing = false;
            document.body.classList.remove('resizing');
        };

        // Reset dimensions
        resetBtn.addEventListener('click', () => {
            vectorshape.setAttribute('transform', state.original.transform);
        });

        // Attach event listeners
        handle.addEventListener('mousedown', startResize, true);
        document.addEventListener('mousemove', doResize, true);
        document.addEventListener('mouseup', endResize, true);

        // Attach reset button
        vectorshape.closest('svg')?.parentNode.appendChild(resetBtn);
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

window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.ResizeTool = class {
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
            right: -6px;
            bottom: -6px;
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
            position: absolute !important;
        }
    `;

    initStyles() {
        if (!document.getElementById('resize-tool-styles')) {
            console.log('Adding ResizeTool styles...');
            const styleSheet = document.createElement('style');
            styleSheet.id = 'resize-tool-styles';
            styleSheet.textContent = ArticulateTools.ResizeTool.STYLES;
            document.head.appendChild(styleSheet);
        } else {
            console.log('ResizeTool styles already exist.');
        }
    }

    getOriginalDimensions(vectorshape) {
        console.log('Fetching original dimensions...');
        const original = {
            width: parseFloat(vectorshape.style.width) || vectorshape.offsetWidth,
            height: parseFloat(vectorshape.style.height) || vectorshape.offsetHeight,
            transform: vectorshape.style.transform || '',
            scale: 1
        };

        const transformMatch = original.transform.match(/scale\(([\d.]+),\s*([\d.]+)\)/);
        if (transformMatch) {
            original.scale = parseFloat(transformMatch[1]);
        }

        console.log('Original dimensions:', original);
        return original;
    }

    createResizeHandle() {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        return handle;
    }

    createResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.innerText = '↺';
        return resetBtn;
    }

    updateVectorshapeDimensions(vectorshape, newWidth, newHeight, state) {
        console.log(`Updating dimensions: Width=${newWidth}px, Height=${newHeight}px`);
        vectorshape.style.width = `${newWidth}px`;
        vectorshape.style.height = `${newHeight}px`;

        const image = vectorshape.querySelector('image');
        if (image) {
            const scaleX = newWidth / state.original.width;
            const scaleY = newHeight / state.original.height;
            image.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
        }
    }

    makeVectorshapeResizable(vectorshape) {
        console.log('Making vectorshape resizable:', vectorshape);

        // State for the vectorshape
        const state = {
            original: this.getOriginalDimensions(vectorshape),
            isResizing: false,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0
        };
        this.vectorshapeStates.set(vectorshape, state);

        // Ensure proper positioning and interactivity
        vectorshape.style.position = 'absolute';
        vectorshape.style.pointerEvents = 'auto';

        // Create resize handle and reset button
        const handle = this.createResizeHandle();
        const resetBtn = this.createResetButton();
        vectorshape.appendChild(handle);
        vectorshape.appendChild(resetBtn);

        // Start resize logic
        const startResize = (e) => {
            console.log('Resize started for:', vectorshape);
            state.isResizing = true;
            state.startX = e.clientX;
            state.startY = e.clientY;
            state.startWidth = vectorshape.offsetWidth;
            state.startHeight = vectorshape.offsetHeight;

            document.body.classList.add('resizing');
            e.preventDefault();
        };

        // Perform resize logic
        const doResize = (e) => {
            if (!state.isResizing) return;

            const dx = e.clientX - state.startX;
            const aspectRatio = state.original.width / state.original.height;
            const newWidth = Math.max(50, state.startWidth + dx);
            const newHeight = newWidth / aspectRatio;

            this.updateVectorshapeDimensions(vectorshape, newWidth, newHeight, state);
            e.preventDefault();
        };

        // End resize logic
        const endResize = () => {
            if (!state.isResizing) return;

            console.log('Resize ended for:', vectorshape);
            state.isResizing = false;
            document.body.classList.remove('resizing');
        };

        // Reset dimensions
        resetBtn.addEventListener('click', (e) => {
            console.log('Resetting dimensions for:', vectorshape);
            const state = this.vectorshapeStates.get(vectorshape);
            if (!state) return;

            vectorshape.style.width = `${state.original.width}px`;
            vectorshape.style.height = `${state.original.height}px`;
            vectorshape.style.transform = state.original.transform;

            e.stopPropagation();
        });

        // Attach event listeners
        handle.addEventListener('mousedown', startResize, true);
        document.addEventListener('mousemove', doResize, true);
        document.addEventListener('mouseup', endResize, true);
    }

    removeVectorshapeResize(vectorshape) {
        console.log('Removing resize functionality for:', vectorshape);
        vectorshape.querySelectorAll('.resize-handle, .reset-btn').forEach(el => el.remove());
        this.vectorshapeStates.delete(vectorshape);
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');

        if (this.isEnabled) {
            console.log('Enabling resize for vectorshapes...');
            vectorshapes.forEach(shape => this.makeVectorshapeResizable(shape));
        } else {
            console.log('Disabling resize for vectorshapes...');
            vectorshapes.forEach(shape => this.removeVectorshapeResize(shape));
        }
    }

    init() {
        console.log('Initializing ResizeTool...');
        this.initStyles();
    }

    destroy() {
        console.log('Destroying ResizeTool...');
        document.querySelectorAll('.slide-object-vectorshape')
            .forEach(shape => this.removeVectorshapeResize(shape));
        document.getElementById('resize-tool-styles')?.remove();
        this.isEnabled = false;
    }

    getEnabled() {
        return this.isEnabled;
    }

    // Static factory method
    static init() {
        const resizeTool = new ArticulateTools.ResizeTool();
        resizeTool.init();
        return resizeTool;
    }
}
console.log('resize.js loaded');
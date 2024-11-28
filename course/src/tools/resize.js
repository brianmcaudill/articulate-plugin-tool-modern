window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.ResizeTool = class {
    constructor() {
        this.isEnabled = false;
        this.vectorshapeStates = new WeakMap();
    
        // Bind methods
        this.init = this.init.bind(this);
        this.toggle = this.toggle.bind(this);
        this.destroy = this.destroy.bind(this);
        this.getEnabled = this.getEnabled.bind(this);  // Changed from isEnabled to getEnabled
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
        }
    `;

    initStyles() {
        if (!document.getElementById('resize-tool-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'resize-tool-styles';
            styleSheet.textContent = ArticulateTools.ResizeTool.STYLES;
            document.head.appendChild(styleSheet);
        }
    }

    getOriginalDimensions(vectorshape) {
        const original = {
            width: parseFloat(vectorshape.style.width),
            height: parseFloat(vectorshape.style.height),
            transform: vectorshape.style.transform,
            scale: 1
        };

        const transformMatch = vectorshape.style.transform.match(/scale\(([\d.]+),\s*([\d.]+)\)/);
        if (transformMatch) {
            original.scale = parseFloat(transformMatch[1]);
        }

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

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            cursor: se-resize;
        `;
        return overlay;
    }

    updateVectorshapeDimensions(vectorshape, newWidth, newHeight, state) {
        vectorshape.style.width = `${newWidth}px`;
        vectorshape.style.height = `${newHeight}px`;

        const svg = vectorshape.querySelector('svg');
        if (svg) {
            svg.style.width = '100%';
            svg.style.height = '100%';
        }

        const image = vectorshape.querySelector('image');
        if (image) {
            const scaleX = newWidth / state.original.width;
            const scaleY = newHeight / state.original.height;
            image.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
        }
    }

    makeVectorshapeResizable(vectorshape) {
        const state = {
            original: this.getOriginalDimensions(vectorshape),
            isResizing: false,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            overlay: null
        };
        this.vectorshapeStates.set(vectorshape, state);

        vectorshape.style.position = 'absolute';
        vectorshape.style.pointerEvents = 'auto';

        const handle = this.createResizeHandle();
        const resetBtn = this.createResetButton();
        vectorshape.appendChild(handle);
        vectorshape.appendChild(resetBtn);

        const startResize = (e) => {
            if (!state) return;
            
            state.isResizing = true;
            state.startX = e.clientX;
            state.startY = e.clientY;
            state.startWidth = vectorshape.offsetWidth;
            state.startHeight = vectorshape.offsetHeight;
            
            document.body.classList.add('resizing');
            e.preventDefault();
            e.stopPropagation();

            state.overlay = this.createOverlay();
            document.body.appendChild(state.overlay);
        };

        const doResize = (e) => {
            if (!state?.isResizing) return;

            const dx = e.clientX - state.startX;
            const aspectRatio = state.original.width / state.original.height;
            const newWidth = Math.max(50, state.startWidth + dx);
            const newHeight = newWidth / aspectRatio;

            this.updateVectorshapeDimensions(vectorshape, newWidth, newHeight, state);
            e.preventDefault();
            e.stopPropagation();
        };

        const endResize = () => {
            if (!state?.isResizing) return;
            
            state.isResizing = false;
            document.body.classList.remove('resizing');
            
            if (state.overlay) {
                state.overlay.remove();
                state.overlay = null;
            }
        };

        resetBtn.addEventListener('click', (e) => {
            const state = this.vectorshapeStates.get(vectorshape);
            if (!state) return;

            vectorshape.style.width = `${state.original.width}px`;
            vectorshape.style.height = `${state.original.height}px`;
            vectorshape.style.transform = state.original.transform;
            
            const image = vectorshape.querySelector('image');
            if (image) {
                image.setAttribute('transform', `scale(${state.original.scale}, ${state.original.scale})`);
            }
            
            e.stopPropagation();
        });

        handle.addEventListener('mousedown', startResize, true);
        document.addEventListener('mousemove', doResize, true);
        document.addEventListener('mouseup', endResize, true);

        state.cleanup = () => {
            document.removeEventListener('mousemove', doResize, true);
            document.removeEventListener('mouseup', endResize, true);
            if (state.overlay) {
                state.overlay.remove();
            }
            this.vectorshapeStates.delete(vectorshape);
        };
    }

    removeVectorshapeResize(vectorshape) {
        const state = this.vectorshapeStates.get(vectorshape);
        if (state?.cleanup) {
            state.cleanup();
        }

        vectorshape.querySelectorAll('.resize-handle, .reset-btn').forEach(el => el.remove());
    }

    init() {
        this.initStyles();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');
        
        if (this.isEnabled) {
            vectorshapes.forEach(shape => this.makeVectorshapeResizable(shape));
            console.log('Vectorshape resize enabled');
        } else {
            vectorshapes.forEach(shape => this.removeVectorshapeResize(shape));
            console.log('Vectorshape resize disabled');
        }

        return this.isEnabled;
    }

    destroy() {
        document.querySelectorAll('.slide-object-vectorshape')
            .forEach(shape => this.removeVectorshapeResize(shape));
        
        document.getElementById('resize-tool-styles')?.remove();
        this.isEnabled = false;
    }

    getEnabled() {
        return this.isEnabled;
    }

    // Static factory method
    // static init() {
    //     const resizeTool = new ArticulateTools.ResizeTool();
    //     resizeTool.init();
    //     return resizeTool;
    // }
}
console.log('resize.js loaded');
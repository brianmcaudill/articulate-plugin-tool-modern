window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.DragTool = class {
    constructor() {
        this.isEnabled = false;
        this.draggedElements = new WeakMap(); // Store element-specific data
        this.styles = `
            .draggable {
                cursor: grab !important;
                position: absolute !important;
                pointer-events: auto !important;
            }
            .draggable:active {
                cursor: grabbing !important;
            }
            .dragging {
                user-select: none;
            }
            .drag-handle {
                position: absolute;
                top: 0;
                left: 0;
                background: #4444ff;
                color: white;
                border: 2px solid white;
                border-radius: 50%;
                width: 12px;
                height: 12px;
                cursor: grab;
                z-index: 10002;
                box-shadow: 0 0 3px rgba(0,0,0,0.5);
                pointer-events: auto !important;
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
        `;
    }

    initStyles() {
        if (!document.getElementById('drag-tool-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'drag-tool-styles';
            styleSheet.textContent = this.styles;
            document.head.appendChild(styleSheet);
        }
    }

    getElementOriginalState(element) {
        const rect = element.getBoundingClientRect();
        const transform = window.getComputedStyle(element).transform;
        const matrix = new DOMMatrix(transform);
        
        return {
            x: matrix.e || rect.left,
            y: matrix.f || rect.top,
            transform: element.style.transform || ''
        };
    }

    createDragHandle() {
        const handle = document.createElement('div');
        handle.className = 'drag-handle';
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
            cursor: grabbing;
        `;
        return overlay;
    }

    makeElementDraggable(element) {
        // Store element state
        const state = {
            original: this.getElementOriginalState(element),
            isDragging: false,
            startX: 0,
            startY: 0,
            elementX: 0,
            elementY: 0,
            overlay: null
        };
        this.draggedElements.set(element, state);

        // Add UI elements
        const handle = this.createDragHandle();
        const resetBtn = this.createResetButton();
        element.appendChild(handle);
        element.appendChild(resetBtn);
        element.classList.add('draggable');

        // Event handlers
        const startDrag = (e) => {
            if (e.target === resetBtn) return;
    
    const state = this.draggedElements.get(element);
    if (!state) return; // Add this check
    
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;

    const transform = window.getComputedStyle(element).transform;
    const matrix = new DOMMatrix(transform);
    state.elementX = matrix.e;
    state.elementY = matrix.f;

    document.body.classList.add('dragging');
    e.preventDefault();
    e.stopPropagation();

    state.overlay = this.createOverlay();
    document.body.appendChild(state.overlay);
        };

        const doDrag = (e) => {
            const state = this.draggedElements.get(element);
            if (!state?.isDragging) return;

            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;

            const currentTransform = window.getComputedStyle(element).transform;
            const matrix = new DOMMatrix(currentTransform);
            const scale = matrix.a;
            
            const newMatrix = new DOMMatrix()
                .translate(state.elementX + dx, state.elementY + dy)
                .scale(scale);

            element.style.transform = newMatrix.toString();

            e.preventDefault();
            e.stopPropagation();
        };

        const endDrag = () => {
            const state = this.draggedElements.get(element);
            if (!state?.isDragging) return;

            state.isDragging = false;
            document.body.classList.remove('dragging');
            
            if (state.overlay) {
                state.overlay.remove();
                state.overlay = null;
            }
        };

        // Reset functionality
        resetBtn.addEventListener('click', (e) => {
            const state = this.draggedElements.get(element);
            element.style.transform = state.original.transform;
            e.stopPropagation();
        });

        // Add event listeners
        handle.addEventListener('mousedown', startDrag, true);
        element.addEventListener('mousedown', startDrag, true);
        document.addEventListener('mousemove', doDrag, true);
        document.addEventListener('mouseup', endDrag, true);

        // Store cleanup function
        state.cleanup = () => {
            document.removeEventListener('mousemove', doDrag, true);
            document.removeEventListener('mouseup', endDrag, true);
            if (state.overlay) {
                state.overlay.remove();
            }
            this.draggedElements.delete(element);
        };
    }

    removeElementDrag(element) {
        const state = this.draggedElements.get(element);
        if (state?.cleanup) {
            state.cleanup();
        }
        element.classList.remove('draggable');
        element.querySelectorAll('.drag-handle, .reset-btn').forEach(el => el.remove());
    }

    init() {
        this.initStyles();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const elements = document.querySelectorAll('[data-model-id]');
        
        if (this.isEnabled) {
            elements.forEach(el => this.makeElementDraggable(el));
            console.log('Element drag enabled');
        } else {
            elements.forEach(el => this.removeElementDrag(el));
            console.log('Element drag disabled');
        }
    }

    destroy() {
        // Cleanup all draggable elements
        document.querySelectorAll('[data-model-id]').forEach(el => this.removeElementDrag(el));
        
        // Remove styles
        const styles = document.getElementById('drag-tool-styles');
        if (styles) {
            styles.remove();
        }

        this.isEnabled = false;
    }

    getEnabled() {
        return this.isEnabled;
    }
}
console.log('drag.js loaded');
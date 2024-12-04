window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.DragTool = class {
    constructor() {
        this.isEnabled = false;
        this.draggedElements = new WeakMap(); // Store element-specific data
        this.keyStep = 1;  // Pixels to move per keypress
        this.selectedElement = null;
        // Bind the new method
        this.handleKeyDown = this.handleKeyDown.bind(this);
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
    applyMovement(dx, dy) {
        if (!this.selectedElement) return;
    
        // Read the current transform to determine the latest position
        const computedStyle = window.getComputedStyle(this.selectedElement);
        const currentTransform = computedStyle.transform || "none";
        let currentX = 0, currentY = 0;
    
        if (currentTransform !== "none") {
            const match = currentTransform.match(/matrix.*\((.+)\)/);
            if (match) {
                const [, , , , e, f] = match[1].split(',').map(parseFloat);
                currentX = e || 0;
                currentY = f || 0;
            }
        } else {
            // Fallback to dataset values if no transform is present
            currentX = parseFloat(this.selectedElement.dataset.initialX) || 0;
            currentY = parseFloat(this.selectedElement.dataset.initialY) || 0;
        }
    
        // Calculate new position
        const newX = currentX + dx;
        const newY = currentY + dy;
    
        // Apply the new transform
        this.selectedElement.style.transform = `translate(${newX}px, ${newY}px)`;
    
        // Update dataset to reflect the new position
        this.selectedElement.dataset.initialX = newX;
        this.selectedElement.dataset.initialY = newY;
    
        console.log(`Element moved by keys to: (${newX}px, ${newY}px)`);
    }
    
    
    
    
    
    handleKeyDown(e) {
        console.log("Keydown event triggered:", e.key);
    
        // Ensure the tool is enabled
        if (!this.isEnabled) {
            console.log("Keydown ignored: Tool is disabled.");
            return;
        }
    
        // Exclude certain elements (e.g., form inputs) from triggering the tool
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            console.log("Keydown ignored due to conflicting focus on:", e.target.tagName);
            return;
        }
        //If buttons are used as drag handles, allow their interaction without blocking key events:
        if (e.target.tagName === 'BUTTON' && e.target.classList.contains('drag-handle')) {
            console.log("Keydown allowed for drag handle button");
        }
        if (!this.selectedElement) {
            console.log("No element selected for movement");
            return;
        }
    
        // Movement logic
        let dx = 0, dy = 0;
        switch (e.key) {
            case 'ArrowLeft':
                dx = -this.keyStep;
                break;
            case 'ArrowRight':
                dx = this.keyStep;
                break;
            case 'ArrowUp':
                dy = -this.keyStep;
                break;
            case 'ArrowDown':
                dy = this.keyStep;
                break;
            default:
                return; // Ignore non-arrow keys
        }
    
        if (e.shiftKey) {
            dx *= 10;
            dy *= 10;
        }
    
        // Apply movement (SVG or HTML logic already implemented)
        console.log(`Moving element by: dx=${dx}, dy=${dy}`);
        this.applyMovement(dx, dy);
    
        e.preventDefault(); // Stop default browser behavior (e.g., scrolling)
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
    
        const handle = this.createDragHandle();
        const resetBtn = this.createResetButton();
        element.appendChild(handle);
        element.appendChild(resetBtn);
        element.classList.add('draggable');
    
        const setSelectedElement = (element) => {
            if (this.selectedElement) {
                // Deselect previous element
                this.selectedElement.style.outline = '';
            }
        
            // Select new element
            this.selectedElement = element;
        
            // Initialize position if not already set
            const computedStyle = window.getComputedStyle(element);
            const currentTransform = computedStyle.transform;
        
            if (currentTransform && currentTransform !== 'none') {
                const match = currentTransform.match(/matrix.*\((.+)\)/);
                if (match) {
                    const [scaleX, skewY, skewX, scaleY, translateX, translateY] = match[1].split(',').map(parseFloat);
                    element.dataset.initialX = translateX || 0;
                    element.dataset.initialY = translateY || 0;
                }
            } else {
                // If no transform is present, set default positions
                element.dataset.initialX = 0;
                element.dataset.initialY = 0;
            }
        
            element.style.outline = '2px solid #4444ff';
            console.log(`Selected element initialized at: (${element.dataset.initialX}px, ${element.dataset.initialY}px)`);
        };
        
    
        const startDrag = (e) => {
            const state = this.draggedElements.get(element);
            if (!state) return;

            state.isDragging = true;
            state.startX = e.clientX;
            state.startY = e.clientY;

            setSelectedElement(element);

            const transform = window.getComputedStyle(element).transform;
            const matrix = new DOMMatrix(transform);
            state.elementX = matrix.e || 0;
            state.elementY = matrix.f || 0;

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
        
            // Calculate new position
            const newX = state.elementX + dx;
            const newY = state.elementY + dy;
        
            // Apply the transform
            this.selectedElement.style.transform = `translate(${newX}px, ${newY}px)`;
        
            // Synchronize the dataset with the transform
            this.selectedElement.dataset.initialX = newX;
            this.selectedElement.dataset.initialY = newY;
        
            console.log(`Dragging: (${newX}px, ${newY}px)`);
            e.preventDefault();
            e.stopPropagation();
        };
        
        
    
        const endDrag = () => {
            const state = this.draggedElements.get(element);
            if (!state?.isDragging) return;
        
            state.isDragging = false;
        
            // Read the current transform to ensure the dataset is synchronized
            const computedStyle = window.getComputedStyle(this.selectedElement);
            const currentTransform = computedStyle.transform || "none";
        
            if (currentTransform !== "none") {
                const match = currentTransform.match(/matrix.*\((.+)\)/);
                if (match) {
                    const [, , , , e, f] = match[1].split(',').map(parseFloat);
                    this.selectedElement.dataset.initialX = e || 0;
                    this.selectedElement.dataset.initialY = f || 0;
                }
            }
        
            console.log("Drag ended. Final position:", this.selectedElement.dataset.initialX, this.selectedElement.dataset.initialY);
        
            document.body.classList.remove('dragging');
        
            if (state.overlay) {
                state.overlay.remove();
                state.overlay = null;
            }
        
            if (this.selectedElement === element) {
                element.style.outline = '2px solid #4444ff';
                console.log("Drag ended, keeping selected element:", this.selectedElement);
            }
        };
        
        
    
        resetBtn.addEventListener('click', (e) => {
            const state = this.draggedElements.get(element);
            if (state) {
                element.style.transform = state.original.transform;
            }
            e.stopPropagation();
        });
    
        handle.addEventListener('mousedown', startDrag, true);
        element.addEventListener('mousedown', startDrag, true);
        document.addEventListener('mousemove', doDrag, true);
        document.addEventListener('mouseup', endDrag, true);
    
        element.addEventListener('click', (e) => {
            if (e.target === resetBtn) return;
            setSelectedElement(element);
            e.stopPropagation();
        });
    
        document.addEventListener('click', (e) => {
            if (!element.contains(e.target) && this.selectedElement === element) {
                this.selectedElement.style.outline = '';
                //this.selectedElement = null;
                console.log("Deselected element.");
            }
        });
    
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
        console.log("DragTool().toggle()");
        this.isEnabled = !this.isEnabled;
        const elements = document.querySelectorAll('[data-model-id]');

        if (this.isEnabled) {
            elements.forEach(el => this.makeElementDraggable(el));
            // Add event listener to document instead of specific elements
            document.addEventListener('keydown', this.handleKeyDown);
            console.log('Element drag enabled');
        } else {
            elements.forEach(el => this.removeElementDrag(el));
            document.removeEventListener('keydown', this.handleKeyDown);
            this.selectedElement = null;
            console.log('Element drag disabled');
        }

        return this.isEnabled;
    }

    destroy() {
        // Cleanup all draggable elements
        document.querySelectorAll('[data-model-id]').forEach(el => this.removeElementDrag(el));

        // Remove styles
        const styles = document.getElementById('drag-tool-styles');
        if (styles) {
            styles.remove();
        }
        document.removeEventListener('keydown', this.handleKeyDown);
        this.selectedElement = null;
        this.isEnabled = false;
    }

    getEnabled() {
        return this.isEnabled;
    }
}
console.log('drag.js loaded');
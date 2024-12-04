window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RiseDragTool = class extends ArticulateTools.DragTool {
    constructor() {
        super();
        console.log("RiseDragTool constructor super() called");
        this.styles = `
            .rise-draggable {
                cursor: grab !important;
                position: relative !important;
                z-index: 1000 !important;
            }
            .rise-draggable:active {
                cursor: grabbing !important;
            }
            .rise-dragging {
                user-select: none;
            }
        `;
    }

    getValidElements() {
        return document.querySelectorAll('.fr-view, .blocks-button__button, img');
    }

    makeElementDraggable(element) {
        const state = {
            isDragging: false,
            startX: 0,
            startY: 0,
            elementX: 0,
            elementY: 0
        };
        this.draggedElements.set(element, state);

        element.classList.add('rise-draggable');

        const startDrag = (e) => {
            state.isDragging = true;
            state.startX = e.clientX;
            state.startY = e.clientY;

            const transform = window.getComputedStyle(element).transform;
            const matrix = new DOMMatrix(transform);
            state.elementX = matrix.e || 0;
            state.elementY = matrix.f || 0;

            document.body.classList.add('rise-dragging');
            e.stopPropagation();
        };

        const doDrag = (e) => {
            if (!state.isDragging) return;

            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;

            element.style.transform = `translate(${state.elementX + dx}px, ${state.elementY + dy}px)`;
            e.stopPropagation();
        };

        const endDrag = () => {
            if (!state.isDragging) return;
            state.isDragging = false;
            document.body.classList.remove('rise-dragging');
        };

        element.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);

        state.cleanup = () => {
            element.removeEventListener('mousedown', startDrag);
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', endDrag);
            this.draggedElements.delete(element);
        };
    }

    toggle() {
        console.log("RiseDragTool.toggle()")
        this.isEnabled = !this.isEnabled;
        const elements = this.getValidElements();

        if (this.isEnabled) {
            elements.forEach(el => this.makeElementDraggable(el));
        } else {
            elements.forEach(el => this.removeElementDrag(el));
        }

        return this.isEnabled;
    }
}
window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.ResizeImgTool = class {
    constructor() {
        this.isEnabled = false;
        this.imageStates = new WeakMap();

        // Bind methods
        this.init = this.init.bind(this);
        this.toggle = this.toggle.bind(this);
        this.destroy = this.destroy.bind(this);
        this.getEnabled = this.getEnabled.bind(this);
        this.makeImageResizable = this.makeImageResizable.bind(this);
        this.removeImageResize = this.removeImageResize.bind(this);
    }

    static STYLES = `
        .resizable {
            position: absolute;
            display: inline-block;
            overflow: hidden;
            border: 2px solid #ccc;
            cursor: move;
        }
        .resizable img {
            display: block;
            max-width: 100%;
            height: auto;
        }
        .resizer {
            width: 10px;
            height: 10px;
            background: #007bff;
            position: absolute;
            z-index: 10;
        }
        .resizer.top-left { top: 0; left: 0; cursor: nwse-resize; }
        .resizer.top-right { top: 0; right: 0; cursor: nesw-resize; }
        .resizer.bottom-left { bottom: 0; left: 0; cursor: nesw-resize; }
        .resizer.bottom-right { bottom: 0; right: 0; cursor: nwse-resize; }
        .controls {
            position: absolute;
            top: 5px;
            right: 5px;
            display: flex;
            gap: 5px;
            z-index: 20;
        }
        .controls button {
            background: rgba(0, 0, 0, 0.6);
            border: none;
            color: white;
            font-size: 14px;
            padding: 5px;
            border-radius: 4px;
            cursor: pointer;
        }
        .controls button:hover {
            background: rgba(0, 0, 0, 0.8);
        }
    `;

    initStyles() {
        if (!document.getElementById('resize-tool-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'resize-tool-styles';
            styleSheet.textContent = ArticulateTools.ResizeImgTool.STYLES;
            document.head.appendChild(styleSheet);
        }
    }

    createResizers() {
        const resizers = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(position => {
            const resizer = document.createElement('div');
            resizer.className = `resizer ${position}`;
            return resizer;
        });
        return resizers;
    }

    createControlButtons() {
        const controls = document.createElement('div');
        controls.className = 'controls';

        ['Undo ↩️', 'Redo ↪️', 'Delete ❌', 'Swap 🔄'].forEach((label, index) => {
            const button = document.createElement('button');
            button.innerHTML = label;
            button.dataset.action = label.split(' ')[0].toLowerCase();
            controls.appendChild(button);
        });

        return controls;
    }

    saveState(imageContainer) {
        const state = {
            width: imageContainer.offsetWidth,
            height: imageContainer.offsetHeight,
            top: imageContainer.offsetTop,
            left: imageContainer.offsetLeft,
            src: imageContainer.querySelector('img').src
        };

        const { undoStack, redoStack } = this.imageStates.get(imageContainer);
        undoStack.push(state);
        redoStack.length = 0; // Clear redo stack on a new action
    }

    applyState(imageContainer, state) {
        const img = imageContainer.querySelector('img');
        imageContainer.style.width = `${state.width}px`;
        imageContainer.style.height = `${state.height}px`;
        imageContainer.style.top = `${state.top}px`;
        imageContainer.style.left = `${state.left}px`;
        img.src = state.src;
    }

    makeImageResizable(imageContainer) {
        const image = imageContainer.querySelector('img');
        const undoStack = [];
        const redoStack = [];
        this.imageStates.set(imageContainer, { undoStack, redoStack });

        imageContainer.classList.add('resizable');
        this.createResizers().forEach(resizer => imageContainer.appendChild(resizer));
        imageContainer.appendChild(this.createControlButtons());

        const resizers = imageContainer.querySelectorAll('.resizer');
        const controls = imageContainer.querySelector('.controls');

        const state = this.imageStates.get(imageContainer);

        let isResizing = false, startX, startY, startWidth, startHeight;

        const startResize = (e) => {
            this.saveState(imageContainer);
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = imageContainer.offsetWidth;
            startHeight = imageContainer.offsetHeight;
        };

        const resize = (e) => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const newWidth = Math.max(startWidth + dx, 50);
            const newHeight = Math.max(startHeight + dy, 50);
            imageContainer.style.width = `${newWidth}px`;
            imageContainer.style.height = `${newHeight}px`;
        };

        const endResize = () => {
            if (isResizing) isResizing = false;
        };

        resizers.forEach(resizer => {
            resizer.addEventListener('mousedown', startResize);
        });

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', endResize);

        controls.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action) return;

            if (action === 'undo' && state.undoStack.length > 0) {
                const currentState = {
                    width: imageContainer.offsetWidth,
                    height: imageContainer.offsetHeight,
                    top: imageContainer.offsetTop,
                    left: imageContainer.offsetLeft,
                    src: image.src
                };
                state.redoStack.push(currentState);
                const previousState = state.undoStack.pop();
                this.applyState(imageContainer, previousState);
            }

            if (action === 'redo' && state.redoStack.length > 0) {
                const nextState = state.redoStack.pop();
                this.saveState(imageContainer);
                this.applyState(imageContainer, nextState);
            }

            if (action === 'delete') {
                imageContainer.style.display = 'none';
            }

            if (action === 'swap') {
                const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
                const currentSrc = image.src;
                const newSrc = images[(images.indexOf(currentSrc) + 1) % images.length];
                this.saveState(imageContainer);
                image.src = newSrc;
            }
        });
    }

    removeImageResize(imageContainer) {
        imageContainer.querySelectorAll('.resizer, .controls').forEach(el => el.remove());
        this.imageStates.delete(imageContainer);
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const images = document.querySelectorAll('.resizable-image');
        images.forEach(image => {
            if (this.isEnabled) {
                this.makeImageResizable(image);
            } else {
                this.removeImageResize(image);
            }
        });
    }

    init() {
        this.initStyles();
    }

    destroy() {
        document.querySelectorAll('.resizable-image').forEach(image => this.removeImageResize(image));
        document.getElementById('resize-tool-styles')?.remove();
    }
    getEnabled() {
        return this.isEnabled;
    }

    // Static factory method
    static init() {
        const resizeImgTool = new ArticulateTools.ResizeImgTool();
        resizeImgTool.init();
        return resizeImgTool;
    }
};
console.log('IMG ResizeImgTool loaded.');
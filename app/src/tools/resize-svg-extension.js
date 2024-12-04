// Ensure ArticulateTools namespace exists
window.ArticulateTools = window.ArticulateTools || {};

// Define ResizeSvgTool class and immediately assign to ArticulateTools namespace
ArticulateTools.ResizeSvgTool = class ResizeSvgTool {
    constructor() {
        console.log('ResizeSvgTool.constructor(): No parameters | vars: isEnabled=false, vectorshapeStates=new WeakMap()');
        try {
            this.isEnabled = false;
            this.vectorshapeStates = new WeakMap();

            // Bind methods
            this.init = this.init.bind(this);
            this.toggle = this.toggle.bind(this);
            this.destroy = this.destroy.bind(this);
            this.getEnabled = this.getEnabled.bind(this);
            this.makeVectorshapeResizable = this.makeVectorshapeResizable.bind(this);
            this.removeVectorshapeResize = this.removeVectorshapeResize.bind(this);
        } catch (error) {
            console.error('Error in ResizeSvgTool constructor:', error);
            throw error;
        }
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
        console.log('ResizeSvgTool.initStyles(): No parameters | vars: styleSheet=style#resize-tool-styles');
        try {
            if (!document.getElementById('resize-tool-styles')) {
                const styleSheet = document.createElement('style');
                if (!styleSheet) throw new Error('Failed to create style element');
                
                styleSheet.id = 'resize-tool-styles';
                styleSheet.textContent = ArticulateTools.ResizeSvgTool.STYLES;
                document.head.appendChild(styleSheet);
            }
        } catch (error) {
            console.error('Error initializing styles:', error);
            throw error;
        }
    }

    createControlIcons(vectorshape) {
        console.log('ResizeSvgTool.createControlIcons(vectorshape):', vectorshape, '| vars: container=.slide-object-vectorshape, controls=div.resize-controls');
        try {
            if (!vectorshape) throw new Error('Vectorshape is required');

            const container = vectorshape.closest('.slide-object-vectorshape');
            if (!container) {
                throw new Error('No container found for vectorshape');
            }

            const controls = document.createElement('div');
            if (!controls) throw new Error('Failed to create controls div');

            controls.className = 'resize-controls';
            controls.style.position = 'absolute';
            controls.style.top = '10px';
            controls.style.right = '10px';
            controls.style.display = 'flex';
            controls.style.gap = '10px';
            controls.style.zIndex = '20';

            const actions = [
                { icon: '↩️', label: 'Undo' },
                { icon: '↪️', label: 'Redo' },
                { icon: '❌', label: 'Delete' },
                { icon: '🔄', label: 'Swap' }
            ];

            actions.forEach((action, index) => {
                const button = document.createElement('button');
                if (!button) throw new Error('Failed to create control button');

                button.textContent = action.icon;
                button.setAttribute('aria-label', action.label);
                button.style.background = 'rgba(0, 0, 0, 0.7)';
                button.style.color = 'white';
                button.style.border = 'none';
                button.style.borderRadius = '4px';
                button.style.padding = '8px';
                button.style.cursor = 'pointer';
                button.style.fontSize = '16px';
                button.title = action.label;

                button.addEventListener('mouseover', () => (button.style.background = 'rgba(0, 0, 0, 0.9)'));
                button.addEventListener('mouseout', () => (button.style.background = 'rgba(0, 0, 0, 0.7)'));
                button.addEventListener('click', () => this.handleControlAction(index, vectorshape));

                controls.appendChild(button);
            });

            container.appendChild(controls);
        } catch (error) {
            console.error('Error creating control icons:', error);
            throw error;
        }
    }

    getOriginalDimensions(vectorshape) {
        console.log('ResizeSvgTool.getOriginalDimensions(vectorshape):', vectorshape, '| vars: svgElement, bbox/rect dimensions');
        try {
            if (!vectorshape) throw new Error('Vectorshape is required');

            if (!(vectorshape instanceof Element)) {
                throw new Error('Vectorshape is not a DOM element');
            }

            const svgElement = vectorshape.querySelector('svg');
            if (!svgElement) {
                throw new Error('No SVG element found inside vectorshape');
            }

            try {
                const bboxElement = svgElement.querySelector('image, path, g') || svgElement;
                if (bboxElement && typeof bboxElement.getBBox === 'function') {
                    const bbox = bboxElement.getBBox();
                    return {
                        width: bbox.width,
                        height: bbox.height,
                        x: bbox.x,
                        y: bbox.y,
                        transform: svgElement.getAttribute('transform') || '',
                    };
                }
            } catch (bboxError) {
                console.warn('getBBox failed, falling back to getBoundingClientRect:', bboxError);
            }

            const rect = svgElement.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height,
                x: rect.left,
                y: rect.top,
                transform: svgElement.getAttribute('transform') || '',
            };

        } catch (error) {
            console.error('Error getting original dimensions:', error);
            return this.defaultDimensions();
        }
    }

    defaultDimensions() {
        console.log('ResizeSvgTool.defaultDimensions(): No parameters | vars: default={width:0,height:0,x:0,y:0,transform:""}');
        return {
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            transform: '',
        };
    }

    createResizeHandles(vectorshape) {
        console.log('ResizeSvgTool.createResizeHandles(vectorshape):', vectorshape, '| vars: container=.slide-object-vectorshape, handle=div.resize-handle');
        try {
            if (!vectorshape) throw new Error('Vectorshape is required');

            const container = vectorshape.closest('.slide-object-vectorshape');
            if (!container) {
                throw new Error('No container found for vectorshape');
            }

            const handle = document.createElement('div');
            if (!handle) throw new Error('Failed to create handle element');

            handle.className = 'resize-handle';
            handle.style.position = 'absolute';
            handle.style.width = '20px';
            handle.style.height = '20px';
            handle.style.background = '#007bff';
            handle.style.border = '3px solid white';
            handle.style.borderRadius = '50%';
            handle.style.cursor = 'pointer';
            handle.style.zIndex = '10';

            const bbox = this.getOriginalDimensions(vectorshape);
            handle.style.left = `${bbox.width - 10}px`;
            handle.style.top = `${bbox.height - 10}px`;

            container.style.position = 'relative';
            container.appendChild(handle);

            container.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('resize-handle')) {
                    this.startResize(e, vectorshape);
                }
            });

            return handle;
        } catch (error) {
            console.error('Error creating resize handles:', error);
            throw error;
        }
    }

    createResetButton(vectorshape) {
        console.log('ResizeSvgTool.createResetButton(vectorshape):', vectorshape, '| vars: resetBtn=button.reset-btn');
        try {
            if (!vectorshape) throw new Error('Vectorshape is required');

            const resetBtn = document.createElement('button');
            if (!resetBtn) throw new Error('Failed to create reset button');

            resetBtn.className = 'reset-btn';
            resetBtn.innerText = '↺';
            return resetBtn;
        } catch (error) {
            console.error('Error creating reset button:', error);
            throw error;
        }
    }

    updateVectorshapeTransform(vectorshape, scaleX, scaleY) {
        console.log('ResizeSvgTool.updateVectorshapeTransform(vectorshape, scaleX, scaleY):', vectorshape, scaleX, scaleY, '| vars: transform=scale(scaleX,scaleY)');
        try {
            if (!vectorshape) throw new Error('Vectorshape is required');
            if (isNaN(scaleX) || isNaN(scaleY)) throw new Error('Invalid scale values');
            
            vectorshape.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
        } catch (error) {
            console.error('Error updating vectorshape transform:', error);
            throw error;
        }
    }

    makeVectorshapeResizable(vectorshape) {
        console.log('ResizeSvgTool.makeVectorshapeResizable(vectorshape):', vectorshape, '| vars: state={original,isResizing,startX,startY,scaleX,scaleY}');
        try {
            if (!vectorshape) throw new Error('Vectorshape is required');

            const state = {
                original: this.getOriginalDimensions(vectorshape),
                isResizing: false,
                startX: 0,
                startY: 0,
                scaleX: 1,
                scaleY: 1,
            };
            this.vectorshapeStates.set(vectorshape, state);

            // Create and attach resize handle
            const resizeHandle = this.createResizeHandles(vectorshape);
            if (!resizeHandle) {
                throw new Error('Failed to create resize handle');
            }

            // Create and attach reset button
            const resetBtn = this.createResetButton();
            if (!resetBtn) {
                throw new Error('Failed to create reset button');
            }

            // Add event handlers and controls
            this.createControlIcons(vectorshape);
            vectorshape.closest('svg')?.parentNode.appendChild(resetBtn);

            resetBtn.addEventListener('click', () => {
                vectorshape.setAttribute('transform', state.original.transform);
            });

        } catch (error) {
            console.error('Error making vectorshape resizable:', error);
            throw error;
        }
    }

    removeVectorshapeResize(vectorshape) {
        console.log('ResizeSvgTool.removeVectorshapeResize(vectorshape):', vectorshape, '| vars: state, handle=.resize-handle, resetBtn=.reset-btn');
        try {
            if (!vectorshape) throw new Error('Vectorshape is required');

            const state = this.vectorshapeStates.get(vectorshape);
            if (!state) return;

            const handle = document.querySelector('.resize-handle');
            const resetBtn = document.querySelector('.reset-btn');

            handle?.remove();
            resetBtn?.remove();

            this.vectorshapeStates.delete(vectorshape);
        } catch (error) {
            console.error('Error removing vectorshape resize:', error);
            throw error;
        }
    }

    toggle() {
        console.log('ResizeSvgTool.toggle(): No parameters | vars: isEnabled=' + !this.isEnabled + ', vectorshapes=.slide-object-vectorshape');
        try {
            this.isEnabled = !this.isEnabled;
            
            const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');
            if (!vectorshapes.length) {
                console.warn('No vectorshapes found to toggle');
            }

            if (this.isEnabled) {
                vectorshapes.forEach(shape => this.makeVectorshapeResizable(shape));
            } else {
                vectorshapes.forEach(shape => this.removeVectorshapeResize(shape));
            }
        } catch (error) {
            console.error('Error toggling resize tool:', error);
            throw error;
        }
    }

    init() {
        console.log('ResizeSvgTool.init(): No parameters | vars: none');
        try {
            this.initStyles();
        } catch (error) {
            console.error('Error initializing resize tool:', error);
            throw error;
        }
    }

    destroy() {
        console.log('ResizeSvgTool.destroy(): No parameters | vars: vectorshapes=.slide-object-vectorshape, styleTag=#resize-tool-styles');
        try {
            const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');
            vectorshapes.forEach(shape => this.removeVectorshapeResize(shape));

            const styleTag = document.getElementById('resize-tool-styles');
            styleTag?.remove();

            this.isEnabled = false;
        } catch (error) {
            console.error('Error destroying resize tool:', error);
            throw error;
        }
    }

    getEnabled() {
        console.log('ResizeSvgTool.getEnabled(): No parameters | vars: isEnabled=' + this.isEnabled);
        try {
            return this.isEnabled;
        } catch (error) {
            console.error('Error getting enabled state:', error);
            return false;
        }
    }

    static init() {
        console.log('ResizeSvgTool.static.init(): No parameters | vars: resizeSvgTool=new ResizeSvgTool()');
        try {
            const resizeSvgTool = new ArticulateTools.ResizeSvgTool();
            resizeSvgTool.init();
            return resizeSvgTool;
        } catch (error) {
            console.error('Error in static init:', error);
            throw error;
        }
    }
};

console.log('SVG ResizeSvgTool loaded.');

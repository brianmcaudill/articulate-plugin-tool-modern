window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.TspanEditor = class {
    constructor() {
        this.isEnabled = false;
        this.tspanStates = new WeakMap(); // Store tspan-specific data
        this.styles = `
            .text-edit-btn {
                position: absolute;
                top: 5px;
                left: 5px;
                background: #ff9800;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 5px;
                cursor: pointer;
                font-size: 12px;
                z-index: 10001;
                pointer-events: auto !important;
            }
            .tspan-highlight {
                cursor: pointer !important;
                fill: currentColor;
                outline: 1px dashed #ff9800;
            }
            .text-edit-input {
                position: fixed;
                background: white;
                border: 1px solid #ccc;
                padding: 4px;
                font-family: inherit;
                font-size: inherit;
                min-width: 100px;
                z-index: 10002;
            }
            .slide-object-vectorshape svg,
            .slide-object-vectorshape g,
            .slide-object-vectorshape text,
            .slide-object-vectorshape tspan {
                pointer-events: auto !important;
            }
        `;
    }

    initStyles() {
        if (!document.getElementById('tspan-editor-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'tspan-editor-styles';
            styleSheet.textContent = this.styles;
            document.head.appendChild(styleSheet);
        }
    }

    createTextInput(tspan, rect) {
        const input = document.createElement('input');
        input.className = 'text-edit-input';
        input.value = tspan.textContent;
        
        const computedStyle = window.getComputedStyle(tspan);
        Object.assign(input.style, {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width + 20}px`,
            height: `${rect.height}px`,
            fontSize: computedStyle.fontSize,
            fontFamily: computedStyle.fontFamily
        });
        
        return input;
    }

    setupTextInput(tspan, input) {
        const handleInputBlur = () => {
            tspan.textContent = input.value;
            input.remove();
        };

        const handleInputKeydown = (e) => {
            if (e.key === 'Enter') {
                tspan.textContent = input.value;
                input.remove();
            } else if (e.key === 'Escape') {
                input.remove();
            }
        };

        input.addEventListener('blur', handleInputBlur);
        input.addEventListener('keydown', handleInputKeydown);
    }

    editTspan(tspan) {
        const rect = tspan.getBoundingClientRect();
        
        // Store original text if not already stored
        const state = this.tspanStates.get(tspan) || {};
        if (!state.originalText) {
            state.originalText = tspan.textContent;
            this.tspanStates.set(tspan, state);
        }

        const input = this.createTextInput(tspan, rect);
        document.body.appendChild(input);
        this.setupTextInput(tspan, input);
        input.focus();
        input.select();
    }

    createResetButton(vectorshape) {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'text-edit-btn';
        resetBtn.innerText = '↺';
        resetBtn.title = 'Reset Text';
        
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            vectorshape.querySelectorAll('tspan').forEach(tspan => {
                const state = this.tspanStates.get(tspan);
                if (state?.originalText) {
                    tspan.textContent = state.originalText;
                }
            });
        });
        
        return resetBtn;
    }

    enableVectorshapeEditing(vectorshape) {
        const svg = vectorshape.querySelector('svg');
        if (svg) {
            svg.style.pointerEvents = 'auto';
        }

        let hasTspans = false;
        
        vectorshape.querySelectorAll('text').forEach(textElement => {
            textElement.style.pointerEvents = 'auto';
            
            const tspans = textElement.querySelectorAll('tspan');
            if (tspans.length > 0) {
                hasTspans = true;
                tspans.forEach(tspan => {
                    const state = {};
                    this.tspanStates.set(tspan, state);

                    tspan.style.pointerEvents = 'auto';
                    tspan.classList.add('tspan-highlight');
                    
                    if (!state.editHandler) {
                        state.editHandler = (e) => {
                            e.stopPropagation();
                            this.editTspan(tspan);
                        };
                        tspan.addEventListener('click', state.editHandler, true);
                    }
                });
            }
        });

        vectorshape.querySelectorAll('g').forEach(g => {
            g.style.pointerEvents = 'auto';
        });

        if (hasTspans && !vectorshape.querySelector('.text-edit-btn')) {
            vectorshape.appendChild(this.createResetButton(vectorshape));
        }
    }

    disableVectorshapeEditing(vectorshape) {
        vectorshape.querySelectorAll('tspan').forEach(tspan => {
            const state = this.tspanStates.get(tspan);
            if (state?.editHandler) {
                tspan.removeEventListener('click', state.editHandler, true);
            }
            this.tspanStates.delete(tspan);
            
            tspan.classList.remove('tspan-highlight');
            tspan.style.pointerEvents = '';
        });

        vectorshape.querySelectorAll('text, g').forEach(el => {
            el.style.pointerEvents = '';
        });

        const resetBtn = vectorshape.querySelector('.text-edit-btn');
        if (resetBtn) resetBtn.remove();
    }

    init() {
        this.initStyles();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');
        
        if (this.isEnabled) {
            vectorshapes.forEach(shape => this.enableVectorshapeEditing(shape));
            console.log('TSpan editing enabled');
        } else {
            vectorshapes.forEach(shape => this.disableVectorshapeEditing(shape));
            console.log('TSpan editing disabled');
        }

        return this.isEnabled;
    }

    destroy() {
        document.querySelectorAll('.slide-object-vectorshape')
            .forEach(shape => this.disableVectorshapeEditing(shape));
        
        const styles = document.getElementById('tspan-editor-styles');
        if (styles) {
            styles.remove();
        }

        this.isEnabled = false;
    }

    getEnabled() {
        return this.isEnabled;
    }
}
console.log('text-editor.js loaded');
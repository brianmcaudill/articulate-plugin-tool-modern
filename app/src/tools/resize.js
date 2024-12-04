window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.ResizeTool = class {
    constructor() {
        try {
            console.log("ResizeTool.constructor() | vars: isEnabled=false, vectorshapeStates=new WeakMap()");
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
            console.error("Error in ResizeTool constructor:", error);
            throw error;
        }
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
        try {
            console.log("ResizeTool.initStyles() | vars: styleSheet=new style element, id=resize-tool-styles");
            if (!document.getElementById("resize-tool-styles")) {
                const styleSheet = document.createElement("style");
                if (!styleSheet) throw new Error("Failed to create style element");
                
                styleSheet.id = "resize-tool-styles";
                styleSheet.textContent = ArticulateTools.ResizeTool.STYLES;
                document.head.appendChild(styleSheet);
            }
        } catch (error) {
            console.error("Error initializing styles:", error);
            throw error;
        }
    }

    getOriginalDimensions(vectorshape) {
        try {
            if (!vectorshape) throw new Error("Vectorshape is required");
            
            console.log("ResizeTool.getOriginalDimensions(vectorshape) | vars: original={width, height, transform, scale}");
            const original = {
                width: parseFloat(vectorshape.style.width) || vectorshape.offsetWidth,
                height: parseFloat(vectorshape.style.height) || vectorshape.offsetHeight,
                transform: vectorshape.style.transform || "",
                scale: 1
            };

            if (isNaN(original.width) || isNaN(original.height)) {
                throw new Error("Invalid dimensions detected");
            }

            const transformMatch = original.transform.match(/scale\(([\d.]+),\s*([\d.]+)\)/);
            if (transformMatch) {
                const scale = parseFloat(transformMatch[1]);
                if (!isNaN(scale)) {
                    original.scale = scale;
                }
            }

            return original;
        } catch (error) {
            console.error("Error getting original dimensions:", error);
            throw error;
        }
    }

    createResizeHandle() {
        try {
            console.log("ResizeTool.createResizeHandle() | vars: handle=div.resize-handle");
            const handle = document.createElement("div");
            if (!handle) throw new Error("Failed to create resize handle");
            
            handle.className = "resize-handle";
            return handle;
        } catch (error) {
            console.error("Error creating resize handle:", error);
            throw error;
        }
    }

    createResetButton() {
        try {
            console.log("ResizeTool.createResetButton() | vars: resetBtn=button.reset-btn");
            const resetBtn = document.createElement("button");
            if (!resetBtn) throw new Error("Failed to create reset button");
            
            resetBtn.className = "reset-btn";
            resetBtn.innerText = "↺";
            return resetBtn;
        } catch (error) {
            console.error("Error creating reset button:", error);
            throw error;
        }
    }

    updateVectorshapeDimensions(vectorshape, newWidth, newHeight, state) {
        try {
            if (!vectorshape || !state) throw new Error("Missing required parameters");
            if (isNaN(newWidth) || isNaN(newHeight)) throw new Error("Invalid dimensions");
            if (newWidth <= 0 || newHeight <= 0) throw new Error("Dimensions must be positive");

            console.log(`ResizeTool.updateVectorshapeDimensions() | vars: newWidth=${newWidth}, newHeight=${newHeight}, scaleX=${newWidth}/original.width, scaleY=${newHeight}/original.height`);
            vectorshape.style.width = `${newWidth}px`;
            vectorshape.style.height = `${newHeight}px`;

            const image = vectorshape.querySelector("image");
            if (image && state.original) {
                const scaleX = newWidth / state.original.width;
                const scaleY = newHeight / state.original.height;
                if (!isNaN(scaleX) && !isNaN(scaleY)) {
                    image.setAttribute("transform", `scale(${scaleX}, ${scaleY})`);
                }
            }
        } catch (error) {
            console.error("Error updating vectorshape dimensions:", error);
            throw error;
        }
    }

    makeVectorshapeResizable(vectorshape) {
        try {
            if (!vectorshape) throw new Error("Vectorshape is required");
            
            console.log("ResizeTool.makeVectorshapeResizable(vectorshape) | vars: state={original, isResizing, startX, startY, startWidth, startHeight}, handle=div.resize-handle, resetBtn=button.reset-btn");

            const state = {
                original: this.getOriginalDimensions(vectorshape),
                isResizing: false,
                startX: 0,
                startY: 0,
                startWidth: 0,
                startHeight: 0
            };
            this.vectorshapeStates.set(vectorshape, state);

            vectorshape.style.position = "absolute";
            vectorshape.style.pointerEvents = "auto";

            const handle = this.createResizeHandle();
            const resetBtn = this.createResetButton();
            vectorshape.appendChild(handle);
            vectorshape.appendChild(resetBtn);

            const startResize = (e) => {
                try {
                    console.log("ResizeTool.startResize(event) | vars: state.startX=" + e.clientX + ", state.startY=" + e.clientY + ", state.startWidth=" + vectorshape.offsetWidth + ", state.startHeight=" + vectorshape.offsetHeight);
                    state.isResizing = true;
                    state.startX = e.clientX;
                    state.startY = e.clientY;
                    state.startWidth = vectorshape.offsetWidth;
                    state.startHeight = vectorshape.offsetHeight;

                    document.body.classList.add("resizing");
                    e.preventDefault();
                } catch (error) {
                    console.error("Error starting resize:", error);
                    state.isResizing = false;
                }
            };

            const doResize = (e) => {
                try {
                    if (!state.isResizing) return;
                    console.log("ResizeTool.doResize(event) | vars: dx=" + (e.clientX - state.startX) + ", aspectRatio=" + (state.original.width / state.original.height) + ", newWidth, newHeight");

                    const dx = e.clientX - state.startX;
                    const aspectRatio = state.original.width / state.original.height;
                    if (isNaN(aspectRatio)) throw new Error("Invalid aspect ratio");

                    const newWidth = Math.max(50, state.startWidth + dx);
                    const newHeight = newWidth / aspectRatio;

                    this.updateVectorshapeDimensions(vectorshape, newWidth, newHeight, state);
                    e.preventDefault();
                } catch (error) {
                    console.error("Error during resize:", error);
                    endResize();
                }
            };

            const endResize = () => {
                try {
                    if (!state.isResizing) return;
                    console.log("ResizeTool.endResize() | vars: state.isResizing=false");
                    state.isResizing = false;
                    document.body.classList.remove("resizing");
                } catch (error) {
                    console.error("Error ending resize:", error);
                }
            };

            resetBtn.addEventListener("click", (e) => {
                try {
                    console.log("ResizeTool.resetDimensions() | vars: original width=" + state.original.width + ", original height=" + state.original.height + ", original transform=" + state.original.transform);
                    const state = this.vectorshapeStates.get(vectorshape);
                    if (!state) throw new Error("No state found for vectorshape");

                    vectorshape.style.width = `${state.original.width}px`;
                    vectorshape.style.height = `${state.original.height}px`;
                    vectorshape.style.transform = state.original.transform;

                    e.stopPropagation();
                } catch (error) {
                    console.error("Error resetting dimensions:", error);
                }
            });

            handle.addEventListener("mousedown", startResize, true);
            document.addEventListener("mousemove", doResize, true);
            document.addEventListener("mouseup", endResize, true);
        } catch (error) {
            console.error("Error making vectorshape resizable:", error);
            throw error;
        }
    }

    removeVectorshapeResize(vectorshape) {
        try {
            if (!vectorshape) throw new Error("Vectorshape is required");
            
            console.log("ResizeTool.removeVectorshapeResize(vectorshape) | vars: elements to remove=.resize-handle,.reset-btn");
            vectorshape.querySelectorAll(".resize-handle, .reset-btn").forEach(el => el.remove());
            this.vectorshapeStates.delete(vectorshape);
        } catch (error) {
            console.error("Error removing vectorshape resize:", error);
            throw error;
        }
    }

    toggle() {
        try {
            console.log("ResizeTool.toggle() | vars: isEnabled=" + !this.isEnabled + ", vectorshapes=.slide-object-vectorshape");
            this.isEnabled = !this.isEnabled;
            const vectorshapes = document.querySelectorAll(".slide-object-vectorshape");

            if (this.isEnabled) {
                vectorshapes.forEach(shape => {
                    try {
                        this.makeVectorshapeResizable(shape);
                    } catch (error) {
                        console.error("Error making shape resizable:", error);
                    }
                });
            } else {
                vectorshapes.forEach(shape => {
                    try {
                        this.removeVectorshapeResize(shape);
                    } catch (error) {
                        console.error("Error removing shape resize:", error);
                    }
                });
            }
        } catch (error) {
            console.error("Error toggling resize tool:", error);
            this.isEnabled = false;
            throw error;
        }
    }

    init() {
        try {
            console.log("ResizeTool.init() | No variables");
            this.initStyles();
        } catch (error) {
            console.error("Error initializing resize tool:", error);
            throw error;
        }
    }

    destroy() {
        try {
            console.log("ResizeTool.destroy() | vars: vectorshapes=.slide-object-vectorshape, isEnabled=false");
            document.querySelectorAll(".slide-object-vectorshape")
                .forEach(shape => {
                    try {
                        this.removeVectorshapeResize(shape);
                    } catch (error) {
                        console.error("Error removing shape resize during destroy:", error);
                    }
                });
            
            const styleElement = document.getElementById("resize-tool-styles");
            if (styleElement) styleElement.remove();
            
            this.isEnabled = false;
        } catch (error) {
            console.error("Error destroying resize tool:", error);
            throw error;
        }
    }

    getEnabled() {
        try {
            console.log("ResizeTool.getEnabled() | vars: isEnabled=" + this.isEnabled);
            return this.isEnabled;
        } catch (error) {
            console.error("Error getting enabled state:", error);
            return false;
        }
    }

    static init() {
        try {
            console.log("ResizeTool.init() | vars: resizeTool=new ResizeTool()");
            const resizeTool = new ArticulateTools.ResizeTool();
            resizeTool.init();
            return resizeTool;
        } catch (error) {
            console.error("Error in static init:", error);
            throw error;
        }
    }
};
console.log("resize.js loaded");
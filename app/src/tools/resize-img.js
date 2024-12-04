window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.ResizeImgTool = class {
    constructor() {
        console.log("ResizeImgTool.constructor(): No parameters | vars: isEnabled=false, imageStates=new WeakMap()");
        try {
            this.isEnabled = false;
            this.imageStates = new WeakMap();

            // Bind methods
            this.init = this.init.bind(this);
            this.toggle = this.toggle.bind(this);
            this.destroy = this.destroy.bind(this);
            this.getEnabled = this.getEnabled.bind(this);
            this.makeImageResizable = this.makeImageResizable.bind(this);
            this.removeImageResize = this.removeImageResize.bind(this);
        } catch (error) {
            console.error("Error in ResizeImgTool constructor:", error);
            throw error;
        }
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
        console.log("ResizeImgTool.initStyles(): No parameters | vars: styleSheet=style#resize-tool-styles");
        try {
            if (!document.getElementById("resize-tool-styles")) {
                const styleSheet = document.createElement("style");
                styleSheet.id = "resize-tool-styles";
                styleSheet.textContent = ArticulateTools.ResizeImgTool.STYLES;
                document.head.appendChild(styleSheet);
            }
        } catch (error) {
            console.error("Error initializing styles:", error);
            throw error;
        }
    }

    createResizers() {
        console.log("ResizeImgTool.createResizers(): No parameters | vars: resizers=div.resizer[]");
        try {
            const resizers = ["top-left", "top-right", "bottom-left", "bottom-right"].map(position => {
                const resizer = document.createElement("div");
                resizer.className = `resizer ${position}`;
                return resizer;
            });
            return resizers;
        } catch (error) {
            console.error("Error creating resizers:", error);
            throw error;
        }
    }

    createControlButtons() {
        console.log("ResizeImgTool.createControlButtons(): No parameters | vars: controls=div.controls");
        try {
            const controls = document.createElement("div");
            controls.className = "controls";

            ["Undo ↩️", "Redo ↪️", "Delete ❌", "Swap 🔄"].forEach(label => {
                const button = document.createElement("button");
                button.innerHTML = label;
                button.dataset.action = label.split(" ")[0].toLowerCase();
                controls.appendChild(button);
            });

            return controls;
        } catch (error) {
            console.error("Error creating control buttons:", error);
            throw error;
        }
    }

    saveState(imageContainer) {
        console.log("ResizeImgTool.saveState(imageContainer): imageContainer={HTMLElement} | vars: state={width,height,top,left,src}, undoStack, redoStack");
        try {
            if (!imageContainer) {
                throw new Error("Invalid image container");
            }

            const state = {
                width: imageContainer.offsetWidth,
                height: imageContainer.offsetHeight,
                top: imageContainer.offsetTop,
                left: imageContainer.offsetLeft,
                src: imageContainer.querySelector("img")?.src
            };

            if (!state.src) {
                throw new Error("Image source not found");
            }

            const imageState = this.imageStates.get(imageContainer);
            if (!imageState) {
                throw new Error("Image state not initialized");
            }

            const { undoStack, redoStack } = imageState;
            undoStack.push(state);
            redoStack.length = 0; // Clear redo stack on a new action
        } catch (error) {
            console.error("Error saving state:", error);
            throw error;
        }
    }

    applyState(imageContainer, state) {
        console.log("ResizeImgTool.applyState(imageContainer, state): imageContainer={HTMLElement}, state={Object} | vars: img=HTMLImageElement");
        try {
            if (!imageContainer || !state) {
                throw new Error("Invalid parameters for applying state");
            }

            const img = imageContainer.querySelector("img");
            if (!img) {
                throw new Error("Image element not found");
            }

            imageContainer.style.width = `${state.width}px`;
            imageContainer.style.height = `${state.height}px`;
            imageContainer.style.top = `${state.top}px`;
            imageContainer.style.left = `${state.left}px`;
            img.src = state.src;
        } catch (error) {
            console.error("Error applying state:", error);
            throw error;
        }
    }

    makeImageResizable(imageContainer) {
        console.log("ResizeImgTool.makeImageResizable(imageContainer): imageContainer={HTMLElement} | vars: image=HTMLImageElement, undoStack=[], redoStack=[], resizers=NodeList, controls=div.controls, isResizing=false");
        try {
            if (!imageContainer) {
                throw new Error("Invalid image container");
            }

            const image = imageContainer.querySelector("img");
            if (!image) {
                throw new Error("Image element not found");
            }

            const undoStack = [];
            const redoStack = [];
            this.imageStates.set(imageContainer, { undoStack, redoStack });

            imageContainer.classList.add("resizable");
            this.createResizers().forEach(resizer => imageContainer.appendChild(resizer));
            imageContainer.appendChild(this.createControlButtons());

            const resizers = imageContainer.querySelectorAll(".resizer");
            const controls = imageContainer.querySelector(".controls");

            const state = this.imageStates.get(imageContainer);
            if (!state) {
                throw new Error("Failed to initialize image state");
            }

            let isResizing = false, startX, startY, startWidth, startHeight;

            const startResize = (e) => {
                try {
                    console.log("ResizeImgTool.startResize(e): e={MouseEvent} | vars: isResizing=true");
                    this.saveState(imageContainer);
                    isResizing = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startWidth = imageContainer.offsetWidth;
                    startHeight = imageContainer.offsetHeight;
                } catch (error) {
                    console.error("Error starting resize:", error);
                    isResizing = false;
                }
            };

            const resize = (e) => {
                try {
                    console.log("ResizeImgTool.resize(e): e={MouseEvent} | vars: dx, dy, newWidth, newHeight");
                    if (!isResizing) return;
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    const newWidth = Math.max(startWidth + dx, 50);
                    const newHeight = Math.max(startHeight + dy, 50);
                    imageContainer.style.width = `${newWidth}px`;
                    imageContainer.style.height = `${newHeight}px`;
                } catch (error) {
                    console.error("Error during resize:", error);
                    isResizing = false;
                }
            };

            const endResize = () => {
                console.log("ResizeImgTool.endResize(): No parameters | vars: isResizing=false");
                isResizing = false;
            };

            resizers.forEach(resizer => {
                resizer.addEventListener("mousedown", startResize);
            });

            document.addEventListener("mousemove", resize);
            document.addEventListener("mouseup", endResize);

            controls.addEventListener("click", (e) => {
                try {
                    console.log("ResizeImgTool.controlsClickHandler(e): e={MouseEvent} | vars: action");
                    const action = e.target.dataset.action;
                    if (!action) return;

                    if (action === "undo" && state.undoStack.length > 0) {
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

                    if (action === "redo" && state.redoStack.length > 0) {
                        const nextState = state.redoStack.pop();
                        this.saveState(imageContainer);
                        this.applyState(imageContainer, nextState);
                    }

                    if (action === "delete") {
                        imageContainer.style.display = "none";
                    }

                    if (action === "swap") {
                        const images = ["image1.jpg", "image2.jpg", "image3.jpg"];
                        const currentSrc = image.src;
                        const newSrc = images[(images.indexOf(currentSrc) + 1) % images.length];
                        this.saveState(imageContainer);
                        image.src = newSrc;
                    }
                } catch (error) {
                    console.error("Error handling control action:", error);
                }
            });
        } catch (error) {
            console.error("Error making image resizable:", error);
            throw error;
        }
    }

    removeImageResize(imageContainer) {
        console.log("ResizeImgTool.removeImageResize(imageContainer): imageContainer={HTMLElement}");
        try {
            if (!imageContainer) {
                throw new Error("Invalid image container");
            }
            imageContainer.querySelectorAll(".resizer, .controls").forEach(el => el.remove());
            this.imageStates.delete(imageContainer);
        } catch (error) {
            console.error("Error removing image resize:", error);
            throw error;
        }
    }

    toggle() {
        console.log("ResizeImgTool.toggle(): No parameters | vars: isEnabled=!isEnabled");
        try {
            this.isEnabled = !this.isEnabled;
            const images = document.querySelectorAll(".resizable-image");
            images.forEach(image => {
                if (this.isEnabled) {
                    this.makeImageResizable(image);
                } else {
                    this.removeImageResize(image);
                }
            });
        } catch (error) {
            console.error("Error toggling resize tool:", error);
            this.isEnabled = false;
            throw error;
        }
    }

    init() {
        console.log("ResizeImgTool.init(): No parameters");
        try {
            this.initStyles();
        } catch (error) {
            console.error("Error initializing resize tool:", error);
            throw error;
        }
    }

    destroy() {
        console.log("ResizeImgTool.destroy(): No parameters");
        try {
            document.querySelectorAll(".resizable-image").forEach(image => this.removeImageResize(image));
            const styleSheet = document.getElementById("resize-tool-styles");
            if (styleSheet) {
                styleSheet.remove();
            }
        } catch (error) {
            console.error("Error destroying resize tool:", error);
            throw error;
        }
    }

    getEnabled() {
        console.log("ResizeImgTool.getEnabled(): No parameters | returns: isEnabled");
        return this.isEnabled;
    }

    // Static factory method
    static init() {
        console.log("ResizeImgTool.init(): Static factory method | vars: resizeImgTool=new ResizeImgTool()");
        try {
            const resizeImgTool = new ArticulateTools.ResizeImgTool();
            resizeImgTool.init();
            return resizeImgTool;
        } catch (error) {
            console.error("Error in static init:", error);
            throw error;
        }
    }
};
console.log("IMG ResizeImgTool loaded.");
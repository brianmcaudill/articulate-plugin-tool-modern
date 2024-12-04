window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.ImageSwap = class {
    constructor() {
        this.isEnabled = false;
        this.imageStates = new WeakMap();
        this.activeModal = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.toggle = this.toggle.bind(this);
        this.destroy = this.destroy.bind(this);
        this.getEnabled = this.getEnabled.bind(this);  // Changed from isEnabled to getEnabled
        this.resetImage = this.resetImage.bind(this);
        this.makeImageSwappable = this.makeImageSwappable.bind(this);
        this.removeImageSwap = this.removeImageSwap.bind(this);
        this.setupImageSwap = this.setupImageSwap.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleFileInput = this.handleFileInput.bind(this);
    }


    static STYLES = `
        .swap-btn {
            position: absolute;
            top: 5px;
            left: 5px;
            background: #9c27b0;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 2px 5px;
            cursor: pointer;
            font-size: 12px;
            z-index: 10001;
            pointer-events: auto !important;
        }
        .image-swap-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 10002;
            font-family: Arial, sans-serif;
        }
        .image-swap-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
        }
        .image-swap-modal input {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .image-swap-modal button {
            background: #9c27b0;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .image-swap-modal button:hover {
            background: #7b1fa2;
        }
        .swap-btn.active {
            background: #f44336;
        }
    `;

    initStyles() {
        if (!document.getElementById('image-swap-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'image-swap-styles';
            styleSheet.textContent = ArticulateTools.ImageSwap.STYLES;
            document.head.appendChild(styleSheet);
        }
    }

    createModal(image) {
        const modal = document.createElement('div');
        modal.className = 'image-swap-modal';
        modal.innerHTML = `
            <h3>Swap Image</h3>
            <p>Current image: ${image.getAttribute('xlink:href')}</p>
            <input type="text" id="newImageUrl" placeholder="Enter new image URL">
            <input type="file" id="imageFile" accept="image/*">
            <div>
                <button id="swapBtn">Swap Image</button>
                <button id="cancelBtn">Cancel</button>
            </div>
        `;
        return modal;
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'image-swap-overlay';
        return overlay;
    }

    async handleFileInput(file, urlInput) {
        if (!file) return null;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                urlInput.value = e.target.result;
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    setupImageSwap(vectorshape, image) {
        const state = this.imageStates.get(image) || {};
        if (!state.originalUrl) {
            state.originalUrl = image.getAttribute('xlink:href');
            this.imageStates.set(image, state);
        }

        const modal = this.createModal(image);
        const overlay = this.createOverlay();
        this.activeModal = { modal, overlay };

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        const fileInput = modal.querySelector('#imageFile');
        const urlInput = modal.querySelector('#newImageUrl');

        fileInput.addEventListener('change', async (e) => {
            await this.handleFileInput(e.target.files[0], urlInput);
        });

        modal.querySelector('#swapBtn').addEventListener('click', () => {
            const newUrl = urlInput.value;
            if (newUrl) {
                image.setAttribute('xlink:href', newUrl);
            }
            this.closeModal();
        });

        modal.querySelector('#cancelBtn').addEventListener('click', () => this.closeModal());
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.modal.remove();
            this.activeModal.overlay.remove();
            this.activeModal = null;
        }
    }

    makeImageSwappable(vectorshape) {
        const image = vectorshape.querySelector('image');
        if (!image) return;

        if (!vectorshape.querySelector('.swap-btn')) {
            const swapBtn = document.createElement('button');
            swapBtn.className = 'swap-btn';
            swapBtn.innerText = '🖼️';
            swapBtn.title = 'Swap Image';
            swapBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setupImageSwap(vectorshape, image);
            });
            vectorshape.appendChild(swapBtn);
        }
    }

    removeImageSwap(vectorshape) {
        const swapBtn = vectorshape.querySelector('.swap-btn');
        if (swapBtn) swapBtn.remove();

        const image = vectorshape.querySelector('image');
        if (image) {
            this.imageStates.delete(image);
        }
    }

    init() {
        this.initStyles();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const vectorshapes = document.querySelectorAll('.slide-object-vectorshape');
        
        if (this.isEnabled) {
            vectorshapes.forEach(shape => this.makeImageSwappable(shape));
            console.log('Image swap enabled');
        } else {
            vectorshapes.forEach(shape => this.removeImageSwap(shape));
            console.log('Image swap disabled');
        }

        return this.isEnabled;
    }

    destroy() {
        this.closeModal();
        document.querySelectorAll('.slide-object-vectorshape')
            .forEach(shape => this.removeImageSwap(shape));
        
        document.getElementById('image-swap-styles')?.remove();
        this.isEnabled = false;
    }

    getEnabled() {
        return this.isEnabled;
    }

    resetImage(vectorshape) {
        const image = vectorshape.querySelector('image');
        if (!image) return;

        const state = this.imageStates.get(image);
        if (state?.originalUrl) {
            image.setAttribute('xlink:href', state.originalUrl);
        }
    }

    // Static factory method
    static init() {
        const imageSwap = new ArticulateTools.ImageSwap();
        imageSwap.init();
        return imageSwap;
    }
}
console.log('image-swap.js loaded');
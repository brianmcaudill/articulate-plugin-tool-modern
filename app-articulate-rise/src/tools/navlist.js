window.ArticulateTools = window.ArticulateTools || {};

// Define DS before using it
const DS = window.DS || {};

ArticulateTools.SlideList = class {
  constructor() {
    this.navData = null;
    this.menuContainer = null;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
  }

  // Initializes styles
  initStyles() {
    if (document.getElementById("slide-list-styles")) return;

    const style = document.createElement("style");
    style.id = "slide-list-styles";
    style.textContent = `
      #menuContainer {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10002;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 250px;
        max-height: 90vh;
        overflow-y: auto;
        cursor: move; /* Indicate draggable menu */
      }
      #menuContent div {
        margin: 5px 0;
      }
      #menuContent button {
        cursor: pointer;
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #fff;
        width: 100%;
        text-align: left;
      }
      #menuContent button:hover {
        background-color: #f7f7f7;
      }
      .active-slide button {
        font-weight: bold;
        background-color: #e0f7fa;
        border-left: 5px solid #007bff;
      }
    `;
    document.head.appendChild(style);
  }

  // Fetches navigation data
  fetchNavData() {
    try {
      return DS.frame.getNavData();
    } catch (error) {
      console.error("Failed to retrieve navigation data:", error);
      return [];
    }
  }

  // Creates the menu container
  createMenuContainer() {
    const container = document.createElement("div");
    container.id = "menuContainer";
    container.innerHTML = `
      <div id="menuContent"></div>
    `;
    this.menuContainer = container;
    document.body.prepend(this.menuContainer);

    // Make the menu draggable
    this.makeDraggable(this.menuContainer);
  }

  // Makes an element draggable
  makeDraggable(element) {
    const startDrag = (e) => {
      this.isDragging = true;
      this.dragOffsetX = e.clientX - element.getBoundingClientRect().left;
      this.dragOffsetY = e.clientY - element.getBoundingClientRect().top;

      // Temporarily change the cursor to indicate dragging
      element.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const doDrag = (e) => {
      if (!this.isDragging) return;

      const newX = e.clientX - this.dragOffsetX;
      const newY = e.clientY - this.dragOffsetY;

      element.style.left = `${newX}px`;
      element.style.top = `${newY}px`;
      element.style.right = "auto"; // Reset right position to avoid conflicts
    };

    const endDrag = () => {
      this.isDragging = false;
      element.style.cursor = "move"; // Reset cursor
      document.body.style.userSelect = ""; // Re-enable text selection
    };

    // Attach event listeners for dragging
    element.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", endDrag);
  }

  // Renders the menu based on nav data
  renderMenu() {
    if (!this.menuContainer) {
      console.error("Menu container not found");
      return;
    }

    const menuContent = this.menuContainer.querySelector("#menuContent");
    menuContent.innerHTML = ""; // Clear existing content

    const navData = this.fetchNavData();
    if (!navData || navData.length === 0) {
      console.warn("No navigation data available");
      menuContent.innerHTML = "<div>No slides available</div>";
      return;
    }

    navData[0].links.forEach((link) => {
      const div = document.createElement("div");
      div.classList.add("menu-item");

      const button = document.createElement("button");
      button.textContent = link.slidetitle || "Untitled";
      button.onclick = () => this.jumpToSlide(link.slideid);

      div.appendChild(button);
      menuContent.appendChild(div);
    });
  }

  // Jumps to a slide
  jumpToSlide(slideId) {
    try {
      DS.windowManager.onRequestingSlide(slideId, null, "push");
    } catch (error) {
      console.error("Failed to jump to slide:", error);
    }
  }

  // Toggles the menu display
  toggle() {
    if (!this.menuContainer) {
      this.initStyles();
      this.createMenuContainer();
      this.renderMenu();
    }

    this.menuContainer.style.display =
      this.menuContainer.style.display === "block" ? "none" : "block";
  }
    init() {
        this.initStyles();
    }
  // Destroys the menu
  destroy() {
    if (this.menuContainer) {
      this.menuContainer.remove();
      this.menuContainer = null;
    }
  }

  // Factory method for procedural initialization
  static init() {
    const slideList = new ArticulateTools.SlideList();
    slideList.toggle();
    return slideList;
  }
};
console.log("navlist.js loaded")
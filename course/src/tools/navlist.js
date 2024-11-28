window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.SlideList = class {
  constructor() {
    this.navData = null;
    this.menuContainer = null;
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
      }
      #menuControl {
        margin-bottom: 10px;
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
      <div id="menuControl">
        <label for="menuType">Menu Type:</label>
        <select id="menuType">
          <option value="links" selected>Links</option>
          <option value="titles">Titles</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div id="menuContent"></div>
    `;
    this.menuContainer = container;
    document.body.prepend(this.menuContainer);
  }

  // Renders the menu based on nav data
  renderMenu(menuType = "links") {
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
      this.attachEventListeners();
    }

    this.menuContainer.style.display =
      this.menuContainer.style.display === "block" ? "none" : "block";
  }

  // Adds event listeners
  attachEventListeners() {
    const menuTypeSelector = this.menuContainer.querySelector("#menuType");
    menuTypeSelector.addEventListener("change", (e) => {
      this.renderMenu(e.target.value);
    });
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

// Example usage
// document.addEventListener("DOMContentLoaded", () => {
//   const slideList = ArticulateTools.SlideList.init();
//   console.log("SlideList initialized:", slideList);
// });

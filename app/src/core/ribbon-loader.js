window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RibbonLoader = class {
    constructor() {
        this.instances = {
            ribbon: null,
            tools: new Map()
        };

        // Bind methods to instance
        this.initializeTools = this.initializeTools.bind(this);
        this.initializeManagers = this.initializeManagers.bind(this);
        this.initializeStyles = this.initializeStyles.bind(this);
        this.connectToolButtons = this.connectToolButtons.bind(this);
        this.init = this.init.bind(this);
    }

    checkDependencies() {
        const required = {
            core: ['Ribbon', 'RibbonStyles', 'RibbonConfig', 'RibbonManagers'],
            tools: ['SlideList','GridTool', 'DragTool', 'TspanEditor', 'ImageSwap', 'ResizeTool', 'ResizeImgTool','ResizeSvgTool']
        };
    
        const missing = {
            core: required.core.filter(comp => !ArticulateTools[comp]),
            tools: required.tools.filter(comp => !ArticulateTools[comp])
        };
    
        if (missing.core.length > 0) {
            throw new Error(`Missing required core components: ${missing.core.join(', ')}`);
        }
    }

    initializeTools() {
        this.checkDependencies();

        // Initialize grid tool
        const gridTool = new ArticulateTools.GridTool();
        gridTool.init();
        this.instances.tools.set('grid', gridTool);

        // Initialize drag tool
        const dragTool = new ArticulateTools.DragTool();
        dragTool.init();
        this.instances.tools.set('drag', dragTool);

        // Initialize text editor
        const textEditor = new ArticulateTools.TspanEditor();
        textEditor.init();
        this.instances.tools.set('textEditor', textEditor);

        // Initialize text styler
        const textStyler = new ArticulateTools.TextStyler();
        textStyler.init();
        this.instances.tools.set('textStyler', textStyler);

        // Initialize image swap tool
        const imageSwap = new ArticulateTools.ImageSwap();
        this.instances.tools.set('imageSwap', imageSwap);

        // Initialize resize tool
        const resizeTool = ArticulateTools.ResizeTool.init();
        this.instances.tools.set('resize', resizeTool);

                // Initialize resize tool
                const resizeImgTool = new ArticulateTools.ResizeImgTool();
                this.instances.tools.set('resizeImg', resizeImgTool);
                        // Initialize resize tool
        const resizeSvgTool = new ArticulateTools.ResizeSvgTool();
        this.instances.tools.set('resizeSvg', resizeSvgTool);
    // Initialize slide list
    const slideList = new ArticulateTools.SlideList();
    slideList.init();
    this.instances.tools.set('slideList', slideList);
      // Test the debugging tool with ArticulateTools.SlideList
  const debugResult = debugSlideList(ArticulateTools.SlideList);
  console.log("Debugging ArticulateTools.SlideList:");
  console.log(debugResult);
    }

    initializeManagers() {
        // Initialize tooltip manager
        const tooltipManager = new ArticulateTools.RibbonManagers.TooltipManager();
        this.instances.tools.set('tooltipManager', tooltipManager);

        // Initialize recent items manager
        const recentManager = new ArticulateTools.RibbonManagers.RecentItemsManager();
        this.instances.tools.set('recentManager', recentManager);

        // Initialize menu manager
        const menuManager = new ArticulateTools.RibbonManagers.MenuManager();
        this.instances.tools.set('menuManager', menuManager);
    }

    initializeStyles() {
        // Initialize core ribbon styles
        ArticulateTools.RibbonStyles.init();
    }
    // toolToggleMap = {
    //     'slideList': () => this.instances.tools.get('slideList').toggle(),
    //     'grid': () => this.instances.tools.get('grid').toggle(),
    //     'drag': () => this.instances.tools.get('drag').toggle(),
    //     'text': () => this.instances.tools.get('textEditor').toggle(),
    //     'style': () => this.instances.tools.get('textStyler').toggle(),
    //     'image': () => this.instances.tools.get('imageSwap').toggle(),
    //     'resize': () => this.instances.tools.get('resize').toggle()
    // }
    // { grid → {…}, drag → {…}, textEditor → {…}, textStyler → {…}, 
    // imageSwap → {…}, resize → {…}, tooltipManager → {}, recentManager → {}, menuManager → {} }
    toolToggleMap = {
        'slideList': () => this.instances.tools.get('slideList').toggle(),
        'grid': () => this.instances.tools.get('grid').toggle(),
        'drag': () => this.handleExclusiveToolToggle('drag'),
        'text': () => this.handleExclusiveToolToggle('textEditor'),
        'style': () => this.handleExclusiveToolToggle('textStyler'),
        'image': () => this.handleExclusiveToolToggle('imageSwap'),
        'resize': () => this.handleExclusiveToolToggle('resize'),
        'resizeImg': () => this.handleExclusiveToolToggle('resizeImg'),
        'resizeSvg': () => this.handleExclusiveToolToggle('resizeSvg'),
    }
    handleExclusiveToolToggle(toolId) {
        const exclusiveTools = ArticulateTools.RibbonConfig.MutuallyExclusiveTools[toolId] || [];
        
        // Disable any active exclusive tools
        exclusiveTools.forEach(exclusiveId => {
            const tool = this.instances.tools.get(exclusiveId);
            if (tool?.getEnabled()) {
                tool.toggle();
            }
        });
    
        // Toggle the requested tool
        return this.instances.tools.get(toolId).toggle();
    }

    connectToolButtons() {
        ArticulateTools.RibbonConfig.TABS.forEach(tab => {
            tab.groups.forEach(group => {
                group.tools.forEach(tool => {
                    if (tool?.toggleFn && this.toolToggleMap[tool.id]) {
                        window[tool.toggleFn] = this.toolToggleMap[tool.id];
                    }
                    
                    // Handle subTools
                    if (tool?.subTools) {
                        tool.subTools.forEach(subTool => {
                            if (subTool?.toggleFn && this.toolToggleMap[subTool.id]) {
                                window[subTool.toggleFn] = this.toolToggleMap[subTool.id];
                            }
                        });
                    }
                });
            });
        });
    }

    init() {
        try {
            this.checkDependencies();
            this.initializeStyles();
            this.initializeTools();
            this.initializeManagers();
    
            // Initialize and mount the ribbon
            this.instances.ribbon = new ArticulateTools.ExtendedRibbon();
            
            // Connect tool buttons before initializing ribbon
            this.connectToolButtons();
            
            this.instances.ribbon.init();
            this.instances.ribbon.mount();
    
            // Create global toggle
            window.toggleStorylineRibbon = () => {
                this.instances.ribbon.toggle();
            };
    
            console.log('Storyline ribbon initialized!');
            return this.instances.ribbon;
    
        } catch (error) {
            console.error('Failed to initialize Storyline ribbon:', error);
            this.destroy();
            throw error;
        }
    }

    destroy() {
        // Cleanup all tools
        this.instances.tools.forEach(tool => {
            if (typeof tool.destroy === 'function') {
                tool.destroy();
            }
        });
        this.instances.tools.clear();

        // Cleanup ribbon
        if (this.instances.ribbon) {
            this.instances.ribbon.destroy();
            this.instances.ribbon = null;
        }

        // Remove global toggle
        delete window.toggleStorylineRibbon;
    }
    // Add after the class definition
    static init() {
        const loader = new ArticulateTools.RibbonLoader();
        return loader.init();
    }
}
console.log('ribbon-loader.js loaded');
/**
 * Debug utility function that thoroughly analyzes a property (specifically for SlideList debugging)
 * This function performs multiple tests and checks to understand the nature of the provided property
 * 
 * @param {any} property - The property to analyze (expected to be SlideList)
 * @returns {Object} Detailed analysis results
 */
function debugSlideList(property) {
    // Log basic type information to console
    console.log("type of: " + typeof property);
    console.log("window.ArticulateTools " );
    console.log(window.ArticulateTools); // Should show the object containing `SlideList`

    // Create result object with basic property checks
    const result = {
      exists: property !== undefined,                    // Check if property is defined
      type: typeof property,                            // Get the basic type
      isFunction: typeof property === "function",       // Check if it's a function
      isConstructor: false,                             // Will be set in constructor test
      isObject: typeof property === "object" && property !== null,  // Check if it's a non-null object
      isArray: Array.isArray(property),                 // Check if it's an array
      isPrimitive: property !== Object(property) &&     // Check if it's a primitive value
        typeof property !== "function" &&               // (not an object, function, or object)
        typeof property !== "object",
    };
  
    // Test if property can be used as a constructor with 'new' keyword
    try {
      new property();                                    // Attempt to instantiate
      result.isConstructor = true;                      // Success - it's a constructor
      result.constructorTestPassed = true;
    } catch (e) {
      result.isConstructor = false;                     // Failed to instantiate
      result.constructorTestPassed = false;
      result.constructorError = e.message;              // Store error message for debugging
    }
  
    // Test if property can be called as a regular function
    try {
      property();                                       // Attempt to call as function
      result.isCallable = true;                        // Success - it's callable
      result.callTestPassed = true;
    } catch (e) {
      result.isCallable = false;                       // Failed to call
      result.callTestPassed = false;
      result.callError = e.message;                    // Store error message for debugging
    }
  
    // If property is an object, get list of its properties
    if (result.isObject) {
      result.objectProperties = Object.keys(property);  // Get all enumerable property names
    }
  
    return result;
}
window.ArticulateTools = window.ArticulateTools || {};

ArticulateTools.RibbonConfig = class {
    static ToolSize = {
        SMALL: 'small',
        LARGE: 'large'
    };

    static TabID = {
        HOME: 'home',
        INSERT: 'insert',
        VIEW: 'view'
    };

    static GroupID = {
        LAYOUT: 'layout',
        EDIT: 'edit',
        CONTENT: 'content',
        OBJECTS: 'objects',
        SHOW_HIDE: 'show_hide'
    };

    static ToolID = {
        SLIDES: 'slideList',
        GRID: 'grid',
        GUIDES: 'guides',
        DRAG: 'drag',
        RESIZE: 'resize',
        RESIZEIMG: 'resizeImg',
        RESIZESVG: 'resizeSvg',
        TEXT: 'text',
        IMAGE: 'image',
        STYLE: 'style',
        SHAPE: 'shape',
        PICTURE: 'picture',
        RULERS: 'rulers',
        NOTES: 'notes'
    };
    static MutuallyExclusiveTools = {
        'drag': ['text', 'style', 'resize'],
        'text': ['drag', 'resize', 'image'],
        'style': ['drag', 'resize'],
        'resize': ['drag', 'text', 'style'],
        'image': ['text']
    };
    // Tool configuration factory
    static createTool(id, icon, label, options = {}) {
        return {
            id,
            icon,
            label,
            size: options.size || this.ToolSize.SMALL,
            toggleFn: options.toggleFn,
            shortcut: options.shortcut,
            subTools: options.subTools || [],
        };
    }

    static createGroup(id, title, tools) {
        return { id, title, tools };
    }

    static createTab(id, label, groups) {
        return { id, label, groups };
    }

    // Tool definitions
    static TOOLS = {
        [this.ToolID.SLIDES]: this.createTool(this.ToolID.SLIDES, '📑', 'Slide List', {
            size: this.ToolSize.LARGE,
            toggleFn: 'toggleSlideList',
            shortcut: 'Alt+L'
        }),
        [this.ToolID.GRID]: this.createTool(this.ToolID.GRID, '⊞', 'Grid', {
            size: this.ToolSize.LARGE,
            toggleFn: 'toggleGrid',  // Changed from toggleStorylineGrid
            shortcut: 'Alt+G'
        }),
        [this.ToolID.GUIDES]: this.createTool(this.ToolID.GUIDES, '⫿', 'Guides'),
        [this.ToolID.DRAG]: this.createTool(this.ToolID.DRAG, '↔', 'Move', {
            size: this.ToolSize.LARGE,
            toggleFn: 'toggleStorylineDrag',
            shortcut: 'Alt+M'
        }),
        // [this.ToolID.RESIZE]: this.createTool(this.ToolID.RESIZE, '⤡', 'Resize', {
        //     size: this.ToolSize.LARGE,
        //     toggleFn: 'toggleStorylineResize',
        //     shortcut: 'Alt+R'
        // }),
        // [this.ToolID.RESIZEIMG]: this.createTool(this.ToolID.RESIZEIMG, '⤡', 'Resize IMG', {
        //     size: this.ToolSize.LARGE,
        //     toggleFn: 'toggleStorylineResizeImg',
        //     shortcut: 'Alt+R'
        // }),
        // [this.ToolID.RESIZESVG]: this.createTool(this.ToolID.RESIZESVG, '⤡', 'Resize SVG', {
        //     size: this.ToolSize.LARGE,
        //     toggleFn: 'toggleStorylineResizeSvg',
        //     shortcut: 'Alt+R'
        // }),
        [this.ToolID.RESIZE]: this.createTool(this.ToolID.RESIZE, '⤡', 'Resize', {
            size: this.ToolSize.LARGE,
            toggleFn: 'toggleStorylineResize',
            shortcut: 'Alt+R',
            subTools: [
                this.createTool(this.ToolID.RESIZEIMG, '🖼', 'Resize Image', {
                    toggleFn: 'toggleStorylineResizeImg'
                }),
                this.createTool(this.ToolID.RESIZESVG, '⚙', 'Resize SVG', {
                    toggleFn: 'toggleStorylineResizeSvg'
                })
            ]
        }),
        [this.ToolID.TEXT]: this.createTool(this.ToolID.TEXT, 'T', 'Edit Text', {
            size: this.ToolSize.LARGE,
            toggleFn: 'toggleTspanEdit',
            shortcut: 'Alt+T'
        }),
        [this.ToolID.IMAGE]: this.createTool(this.ToolID.IMAGE, '🖼', 'Images', {
            size: this.ToolSize.LARGE,
            toggleFn: 'toggleImageSwap',
            shortcut: 'Alt+I'
        }),
        [this.ToolID.STYLE]: this.createTool(this.ToolID.STYLE, '🎨', 'Styles', {
            size: this.ToolSize.LARGE,
            toggleFn: 'toggleTextStyler',
            shortcut: 'Alt+S'
        }),
        [this.ToolID.SHAPE]: this.createTool(this.ToolID.SHAPE, '▢', 'Shape'),
        [this.ToolID.PICTURE]: this.createTool(this.ToolID.PICTURE, '📷', 'Picture'),
        [this.ToolID.RULERS]: this.createTool(this.ToolID.RULERS, '📏', 'Rulers', {
            shortcut: 'Alt+U'
        }),
        [this.ToolID.NOTES]: this.createTool(this.ToolID.NOTES, '📝', 'Notes', {
            shortcut: 'Alt+N'
        })
    };

    // Group definitions
    static GROUPS = {
        [this.GroupID.LAYOUT]: this.createGroup(this.GroupID.LAYOUT, 'Layout', [
            this.TOOLS[this.ToolID.SLIDES],
            this.TOOLS[this.ToolID.GRID],
            this.TOOLS[this.ToolID.GUIDES]
        ]),
        [this.GroupID.EDIT]: this.createGroup(this.GroupID.EDIT, 'Edit', [
            this.TOOLS[this.ToolID.DRAG],
            this.TOOLS[this.ToolID.RESIZE],
            this.TOOLS[this.ToolID.RESIZEIMG],
            this.TOOLS[this.ToolID.RESIZESVG],
        ]),
        [this.GroupID.CONTENT]: this.createGroup(this.GroupID.CONTENT, 'Content', [
            this.TOOLS[this.ToolID.TEXT],
            this.TOOLS[this.ToolID.IMAGE],
            this.TOOLS[this.ToolID.STYLE]
        ]),
        [this.GroupID.OBJECTS]: this.createGroup(this.GroupID.OBJECTS, 'Objects', [
            this.TOOLS[this.ToolID.SHAPE],
            this.TOOLS[this.ToolID.PICTURE]
        ]),
        [this.GroupID.SHOW_HIDE]: this.createGroup(this.GroupID.SHOW_HIDE, 'Show/Hide', [
            this.TOOLS[this.ToolID.RULERS],
            this.TOOLS[this.ToolID.NOTES]
        ])
    };

    // Tab definitions
    static TABS = [
        {
            id: this.TabID.HOME,
            label: 'Home',
            groups: [
                {
                    id: this.GroupID.LAYOUT,
                    title: 'Layout',
                    tools: [
                        this.TOOLS[this.ToolID.SLIDES],
                        this.TOOLS[this.ToolID.GRID],
                        this.TOOLS[this.ToolID.GUIDES]
                    ]
                },
                {
                    id: this.GroupID.EDIT,
                    title: 'Edit',
                    tools: [
                        this.TOOLS[this.ToolID.DRAG],
                        this.TOOLS[this.ToolID.RESIZE],
                        this.TOOLS[this.ToolID.TEXT],
                        this.TOOLS[this.ToolID.STYLE]
                    ]
                },
                {
                    id: this.GroupID.CONTENT,
                    title: 'Content',
                    tools: [
                        this.TOOLS[this.ToolID.IMAGE]
                    ]
                }
            ]
        }
    ];

    // Helper methods
    static getToolById(id) {
        return this.TOOLS[id];
    }

    static getGroupById(id) {
        return this.GROUPS[id];
    }

    static getTabById(id) {
        return this.TABS.find(tab => tab.id === id);
    }

    static addTool(groupId, tool) {
        if (this.GROUPS[groupId]) {
            this.TOOLS[tool.id] = tool;
            this.GROUPS[groupId].tools.push(tool);
        }
    }

    static removeTool(groupId, toolId) {
        if (this.GROUPS[groupId]) {
            this.GROUPS[groupId].tools = this.GROUPS[groupId].tools.filter(tool => tool.id !== toolId);
        }
    }
}
console.log('ribbon-config.js loaded');
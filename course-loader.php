<?php
$coursePath = $_GET['course'] ?? '';
$courseType = $_GET['type'] ?? '';

if (!$coursePath || !$courseType) {
    die('Invalid course parameters');
}

// Define base paths
$rootPath = __DIR__;
$courseFullPath = "{$rootPath}/courses/{$coursePath}";
$scormContentPath = "{$courseFullPath}/scormcontent";

// Calculate relative paths for scripts
$appRootPath = str_repeat('../', substr_count($coursePath, '/') + 2);

// Define script dependencies
$scripts = [
    'articulate-rise' => [
        'core' => [
            'namespace.js',
            'core/course-adapter.js',
            'core/rise-ribbon-adapter.js',
            'core/ribbon-core.js',
            'core/ribbon-config.js',
            'core/ribbon-styles.js',
            'core/ribbon-managers.js',
            'core/ribbon-extensions.js'
        ],
        'tools' => [
            'tools/grid.js',
            'tools/drag.js',
            'tools/rise-extend-drag.js',
            'tools/navlist.js',
            'tools/guide.js',
            'tools/resize.js',
            'tools/resize-img.js',
            'tools/resize-svg.js',
            'tools/text-editor.js',
            'tools/image-swap.js',
            'tools/text-styler.js',
            'tools/shape.js',
            'tools/picture.js',
            'tools/rulers.js',
            'tools/notes.js',
            'tools/save-styles.js'
        ]
    ]
];

// Load the original content
$content = file_get_contents("{$scormContentPath}/index.html");

// Generate script tags
$scriptTags = "\n<!-- Articulate Tools Scripts -->\n";
foreach ($scripts[$courseType]['core'] as $script) {
    $scriptTags .= "<script src=\"{$appRootPath}app-{$courseType}/src/{$script}\"></script>\n";
}
foreach ($scripts[$courseType]['tools'] as $script) {
    $scriptTags .= "<script src=\"{$appRootPath}app-{$courseType}/src/{$script}\"></script>\n";
}

// Add initialization script
$initScript = <<<SCRIPT
\n<!-- Initialize Articulate Tools -->
<script>
    window.addEventListener('DOMContentLoaded', function() {
        if (typeof ArticulateTools !== 'undefined') {
            const adapter = new ArticulateTools.CourseAdapter();
            adapter.init();
        }
    });
</script>
SCRIPT;

// Insert scripts before </body>
$content = str_replace('</body>', $scriptTags . $initScript . "\n</body>", $content);

echo $content;
<?php
function scanCourseDirectory($dir) {
    $courses = [];
    
    // Define launch paths for different course types
    $launchPaths = [
        'rise' => '/scormcontent/index.html',
        'storyline' => '/story/story.html',
        'captivate' => '/index.html'
        // Add more course types and their launch paths as needed
    ];
    
    // Scan all subdirectories in the courses folder
    foreach (glob($dir . '/*', GLOB_ONLYDIR) as $coursePath) {
        $courseName = basename($coursePath);
        $type = basename(dirname($coursePath)); // Get the parent directory name as the type
        
        $launchPath = $launchPaths[$type] ?? '/index.html';  // Default to index.html
        
        // Check if the launch file exists
        if (file_exists($coursePath . $launchPath)) {
            $courses[] = [
                'type' => $type,
                'name' => $courseName,
                'path' => $courseName,
                'launchPath' => $launchPath
            ];
        }
    }
    
    return $courses;
}

$courses = scanCourseDirectory(__DIR__ . '/courses');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Course Launcher</title>
    <style>
        .course-list { display: block; }
        .course-list.hidden { display: none; }
        #courseContainer { display: none; }
        #courseContainer.active { display: block; }
    </style>
</head>
<body>
    <div id="courseList" class="course-list">
        <h2>Available Courses</h2>
        <?php foreach ($courses as $course): ?>
            <div class="course-item">
                <h3><?= htmlspecialchars($course['name']) ?></h3>
                <p>Type: <?= htmlspecialchars($course['type']) ?></p>
                <button onclick="loadCourse('<?= $course['path'] ?>', '<?= $course['type'] ?>')">
                    Launch Course
                </button>
            </div>
        <?php endforeach; ?>
    </div>

    <script>
        async function loadCourse(coursePath, courseType) {
            // Open course in new tab
            const courseWindow = window.open(`courses/${coursePath}/scormcontent/index.html`, '_blank');
            
            // Wait for the new window to load
            courseWindow.addEventListener('load', () => {
                // Add scripts to the new window
                const scripts = getScriptsForCourseType(courseType);
                scripts.forEach(src => {
                    const script = courseWindow.document.createElement('script');
                    script.src = src;
                    courseWindow.document.body.appendChild(script);
                });

                // Add initialization script
                const initScript = courseWindow.document.createElement('script');
                initScript.textContent = `
                    if (typeof ArticulateTools !== 'undefined') {
                        const adapter = new ArticulateTools.CourseAdapter();
                        adapter.init();
                    }
                `;
                courseWindow.document.body.appendChild(initScript);
            });
        }
    </script>
</body>
</html>
// Initialize ribbon
document.addEventListener('DOMContentLoaded', () => {
    try {
        ArticulateTools.RibbonInitializer.init();
        console.log('Ribbon initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ribbon:', error);
    }
});
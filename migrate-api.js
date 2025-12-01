#!/usr/bin/env node
/**
 * Migration script to replace old ApiService with new modular API
 * Run: node migrate-api.js
 */

const fs = require('fs');
const path = require('path');

// Mapping of old ApiService methods to new services
const API_MAPPINGS = {
    // Auth methods
    'ApiService.getCurrentUser': 'authService.getCurrentUser',
    'ApiService.updateUserProfile': 'authService.updateProfile',
    'ApiService.uploadAvatar': 'authService.uploadAvatar',

    // Courts methods
    'ApiService.getCourts': 'courtsService.getCourts',
    'ApiService.getCourtById': 'courtsService.getCourtById',

    // Bookings methods
    'ApiService.createBooking': 'bookingsService.createBooking',
    'ApiService.getActiveBooking': 'bookingsService.getActiveBooking',
    'ApiService.getUpcomingBooking': 'bookingsService.getActiveBooking', // Merged method
    'ApiService.endBooking': 'bookingsService.cancelBooking', // Similar
    'ApiService.cancelBooking': 'bookingsService.cancelBooking',
    'ApiService.getBookingHistory': 'bookingsService.getBookingHistory',

    // Highlights methods
    'ApiService.getHighlights': 'highlightsService.getHighlights',
    'ApiService.getUserHighlights': 'highlightsService.getUserHighlights',
    'ApiService.uploadVideo': 'highlightsService.uploadVideo',
    'ApiService.createHighlight': 'highlightsService.createHighlight',
    'ApiService.toggleLike': 'highlightsService.toggleLike',
    'ApiService.updateHighlightPrivacy': 'highlightsService.updateHighlight',

    // Payments methods
    'ApiService.processTopUp': 'paymentsService.processTopUp',
    'ApiService.getTransactionHistory': 'paymentsService.getTransactionHistory',
    'ApiService.getTransactionSummary': 'paymentsService.getTransactionHistory', // Merged

    // Social methods
    'ApiService.toggleLike': 'highlightsService.toggleLike', // Duplicate, handled above
};

// Services to import based on usage
function detectRequiredServices(content) {
    const services = new Set();

    if (content.includes('authService') || content.match(/ApiService\.(getCurrentUser|updateUserProfile|uploadAvatar)/)) {
        services.add('authService');
    }
    if (content.match(/courtsService|ApiService\.(getCourts|getCourtById)/)) {
        services.add('courtsService');
    }
    if (content.match(/bookingsService|ApiService\.(createBooking|getActiveBooking|cancelBooking|getBookingHistory)/)) {
        services.add('bookingsService');
    }
    if (content.match(/highlightsService|ApiService\.(getHighlights|getUserHighlights|uploadVideo|createHighlight|toggleLike)/)) {
        services.add('highlightsService');
    }
    if (content.match(/paymentsService|ApiService\.(processTopUp|getTransactionHistory)/)) {
        services.add('paymentsService');
    }
    if (content.match(/socialService|ApiService\.(addComment|followUser)/)) {
        services.add('socialService');
    }

    return Array.from(services);
}

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Skip if already using new API
    if (content.includes('from \'../src/api\'') || content.includes('from \'../../src/api\'')) {
        console.log(`⏭️ Skipped (already migrated): ${filePath}`);
        return;
    }

    // Skip if no ApiService usage
    if (!content.includes('ApiService')) {
        console.log(`⏭️ Skipped (no ApiService): ${filePath}`);
        return;
    }

    // Replace import statement
    const oldImport = /import\s*{\s*ApiService\s*}\s*from\s*['"]\.\.\/services\/api['"]/g;
    const relativeDepth = (filePath.match(/\//g) || []).length - 2; // Adjust based on depth
    const importPath = relativeDepth === 0 ? '../src/api' : '../../src/api';

    // Detect required services
    const requiredServices = detectRequiredServices(content);

    if (requiredServices.length > 0) {
        const newImport = `import { ${requiredServices.join(', ')} } from '${importPath}'`;
        content = content.replace(oldImport, newImport);
        modified = true;
    }

    // Replace method calls
    for (const [oldMethod, newMethod] of Object.entries(API_MAPPINGS)) {
        if (content.includes(oldMethod)) {
            content = content.replace(new RegExp(oldMethod.replace('.', '\\.'), 'g'), newMethod);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Migrated: ${filePath}`);
    } else {
        console.log(`⏭️ No changes: ${filePath}`);
    }
}

// Find all .tsx and .ts files in pages/
const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
    .map(f => path.join(pagesDir, f));

console.log(`Found ${files.length} files to migrate\n`);

files.forEach(migrateFile);

console.log('\n✨ Migration complete!');

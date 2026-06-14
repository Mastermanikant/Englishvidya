const fs = require('fs');
const path = require('path');

const categoriesIndexPath = path.join(__dirname, '..', 'website', 'data', 'site', 'categories-index.json');
const categoriesDir = path.join(__dirname, '..', 'website', 'data', 'vocabulary', 'categories');

console.log('Running Auto Update Word Count Script...');

try {
    let categoriesIndex = JSON.parse(fs.readFileSync(categoriesIndexPath, 'utf8'));
    let updatedCount = 0;

    categoriesIndex.forEach(cat => {
        const jsonPath = path.join(categoriesDir, `${cat.slug}.json`);
        if (fs.existsSync(jsonPath)) {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (Array.isArray(data)) {
                if (cat.count !== data.length) {
                    cat.count = data.length;
                    updatedCount++;
                }
            }
        }
    });

    fs.writeFileSync(categoriesIndexPath, JSON.stringify(categoriesIndex, null, 2));
    console.log(`Updated ${updatedCount} categories with their real word counts!`);
} catch (e) {
    console.error('Error updating word counts:', e);
}

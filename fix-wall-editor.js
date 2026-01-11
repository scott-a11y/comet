const fs = require('fs');

const file = 'C:/Dev/comet/app/buildings/[id]/wall-designer/_components/improved-wall-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace BuildingSegment with BuildingWallSegment
content = content.replace(/: BuildingSegment/g, ': BuildingWallSegment');
content = content.replace(/<BuildingSegment\[\]>/g, '<BuildingWallSegment[]>');
content = content.replace(/<BuildingSegment>/g, '<BuildingWallSegment>');

// Replace v1/v2 with a/b
content = content.replace(/seg\.v1/g, 'seg.a');
content = content.replace(/seg\.v2/g, 'seg.b');
content = content.replace(/v1:/g, 'a:');
content = content.replace(/v2:/g, 'b:');

// Replace rings with version
content = content.replace(/rings: \[\],/g, 'version: 1,');

// Replace 'wall' with 'drywall'
content = content.replace(/'wall'/g, "'drywall'");

fs.writeFileSync(file, content);
console.log('Fixed!');

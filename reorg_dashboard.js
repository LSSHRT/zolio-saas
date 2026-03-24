const fs = require('fs');

let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf-8');

const desktopStartStr = '<motion.section\n            {...sectionMotion(0)}\n            className="hidden items-start gap-4 md:grid xl:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.82fr)]"\n          >';
const desktopStartIdx = code.indexOf(desktopStartStr);

if (desktopStartIdx === -1) {
    console.log("Desktop start not found");
    process.exit(1);
}

const desktopEndIdx = code.indexOf('</main>', desktopStartIdx);
const originalDesktopCode = code.substring(desktopStartIdx, desktopEndIdx);

// We know the structure.
// Block 1: The entire first motion.section
const section1End = originalDesktopCode.indexOf('</motion.section>') + '</motion.section>'.length;
const section1 = originalDesktopCode.substring(0, section1End);

// Block 2: The second motion.section (Chiffres clés)
const section2Start = originalDesktopCode.indexOf('<motion.section', section1End);
const section2End = originalDesktopCode.indexOf('</motion.section>', section2Start) + '</motion.section>'.length;
const section2 = originalDesktopCode.substring(section2Start, section2End);

// Block 3: The third motion.section (Bottom grid)
const section3Start = originalDesktopCode.indexOf('<motion.section', section2End);
const section3End = originalDesktopCode.indexOf('</motion.section>', section3Start) + '</motion.section>'.length;
const section3 = originalDesktopCode.substring(section3Start, section3End);

// Let's extract specific divs from these sections.

// From section1:
// hero
const heroStart = section1.indexOf('<div className="client-panel-strong relative overflow-hidden rounded-[2.35rem] px-5 py-6 sm:px-6 lg:px-7">');
const rightTopStart = section1.indexOf('<div className="space-y-4 xl:self-start">');
const heroDiv = section1.substring(heroStart, rightTopStart).trim();
const rightTopDivContent = section1.substring(rightTopStart, section1.lastIndexOf('</motion.section>')).trim();

// From section2 (Chiffres clés):
// we want the content inside the motion.section
const chifresInnerStart = section2.indexOf('<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">');
let chiffresInner = section2.substring(chifresInnerStart, section2.lastIndexOf('</motion.section>')).trim();
chiffresInner = chiffresInner.replace('md:grid-cols-2 xl:grid-cols-4', 'sm:grid-cols-2 xl:grid-cols-2');

const chiffresPanel = `
            <div className="client-panel rounded-[2.15rem] p-5 sm:p-6">
              ${chiffresInner}
            </div>
`.trim();

// From section3 (Bottom grid):
const leftBottomStart = section3.indexOf('<div className="space-y-4">');
const rightBottomStart = section3.indexOf('<div className="space-y-4">', leftBottomStart + 10);
const leftBottomDiv = section3.substring(leftBottomStart, rightBottomStart).trim();
// The right bottom div goes until the end of the grid
const gridEnd = section3.lastIndexOf('</div>\n            </div>\n          </motion.section>');
const rightBottomDivContent = section3.substring(rightBottomStart, gridEnd).trim();

// Now, we assemble the new layout!
const newLayout = `
          <motion.section
            {...sectionMotion(0)}
            className="hidden items-start gap-4 md:grid xl:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.82fr)]"
          >
            {/* Colonne Principale (Gauche) */}
            <div className="space-y-4">
              ${heroDiv}
              ${chiffresPanel}
              ${leftBottomDiv.replace('<div className="space-y-4">', '')}

            {/* Colonne Secondaire (Droite) */}
            ${rightTopDivContent.replace('</div>', '')}
              ${rightBottomDivContent.replace('<div className="space-y-4">', '')}
            </div>
          </motion.section>
`;

const beforeDesktop = code.substring(0, desktopStartIdx);
const afterDesktop = code.substring(desktopEndIdx);
const newCode = beforeDesktop + newLayout.trim() + '\n        ' + afterDesktop;

fs.writeFileSync('src/app/dashboard/page.tsx', newCode);
console.log("File updated successfully.");

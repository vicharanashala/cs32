const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function main() {
  const resourcesDir = __dirname;
  const androidDir = path.join(resourcesDir, 'android');

  if (!fs.existsSync(androidDir)) {
    fs.mkdirSync(androidDir, { recursive: true });
  }

  console.log('Generating adaptive icon resources...');

  // 1. Create icon-background.png (1024x1024 solid #0c0f17)
  const background = new Jimp({
    width: 1024,
    height: 1024,
    color: 0x0c0f17ff
  });
  const backgroundPath = path.join(androidDir, 'icon-background.png');
  await background.write(backgroundPath);
  console.log('Generated background:', backgroundPath);

  // 2. Create icon-foreground.png (1024x1024 transparent with centered and resized logo)
  // Create a transparent canvas (alpha = 0)
  const foreground = new Jimp({
    width: 1024,
    height: 1024,
    color: 0x00000000 // Fully transparent
  });

  const iconPath = path.join(resourcesDir, 'icon.png');
  const icon = await Jimp.read(iconPath);

  // Resize icon to fit inside adaptive safe zone (e.g., 600x600 px)
  icon.resize({ w: 600, h: 600 });

  const x = Math.round((1024 - icon.bitmap.width) / 2);
  const y = Math.round((1024 - icon.bitmap.height) / 2);

  foreground.composite(icon, x, y);
  const foregroundPath = path.join(androidDir, 'icon-foreground.png');
  await foreground.write(foregroundPath);
  console.log('Generated foreground:', foregroundPath);

  console.log('Adaptive icon resources generated successfully.');
}

main().catch(err => {
  console.error('Error generating adaptive icons:', err);
  process.exit(1);
});

const { Jimp } = require('jimp');
const path = require('path');

async function main() {
  const iconPath = path.join(__dirname, 'icon.png');
  const splashPath = path.join(__dirname, 'splash.png');

  console.log('Generating splash.png...');

  // Create splash background (2732x2732, color #0c0f17)
  const splash = new Jimp({
    width: 2732,
    height: 2732,
    color: 0x0c0f17ff
  });

  // Read icon
  const icon = await Jimp.read(iconPath);

  // Center the 1024x1024 icon inside the 2732x2732 canvas
  const x = Math.round((2732 - icon.bitmap.width) / 2);
  const y = Math.round((2732 - icon.bitmap.height) / 2);

  // Composite icon onto splash
  splash.composite(icon, x, y);

  // Write splash.png
  await splash.write(splashPath);
  console.log('splash.png generated successfully at: ' + splashPath);
}

main().catch(err => {
  console.error('Error generating splash screen:', err);
  process.exit(1);
});

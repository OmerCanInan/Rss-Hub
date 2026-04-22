const fs = require('fs');
const path = require('path');

const pluginsToFix = [
  'node_modules/@capacitor-community/text-to-speech/android/build.gradle',
  'node_modules/@capacitor-mlkit/translation/android/build.gradle'
];

console.log('Fixing Gradle ProGuard issues in Capacitor plugins...');

pluginsToFix.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);

  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('proguard-android.txt')) {
        const updatedContent = content.replace(
          /proguard-android\.txt/g, 
          'proguard-android-optimize.txt'
        );
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ Fixed: ${relativePath}`);
      } else {
        console.log(`ℹ️ Already fixed or not found in: ${relativePath}`);
      }
    } catch (err) {
      console.error(`❌ Error fixing ${relativePath}:`, err);
    }
  } else {
    console.log(`⚠️ Plugin not found at: ${relativePath}`);
  }
});

console.log('Gradle fix process completed.');

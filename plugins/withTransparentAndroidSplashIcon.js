const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const EMPTY_VECTOR_DRAWABLE = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24" />
`;

/**
 * Generates an empty transparent @drawable/splashscreen_logo XML resource so
 * Android 12+ SplashScreen styles resolve cleanly without displaying a duplicate
 * branded icon or falling back to @mipmap/ic_launcher before FluidSplash renders.
 */
module.exports = function withTransparentAndroidSplashIcon(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const drawableDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'drawable'
      );
      await fs.promises.mkdir(drawableDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(drawableDir, 'splashscreen_logo.xml'),
        EMPTY_VECTOR_DRAWABLE,
        'utf8'
      );
      return modConfig;
    },
  ]);
};

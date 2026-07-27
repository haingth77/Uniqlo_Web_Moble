import type { Options } from '@wdio/types';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WebdriverIO + Appium (UiAutomator2) config for the native UNIQLO Android app.
 *
 * Two ways to point Appium at the app under test:
 *  1) Install from an .apk file  -> set APP_PATH (see `app` capability below).
 *  2) Use an already-installed app -> set APP_PACKAGE + APP_ACTIVITY, remove `app`.
 *
 * Find the package/activity of the installed UNIQLO app with:
 *   adb shell pm list packages | grep -i uniqlo
 *   adb shell dumpsys package <package> | grep -A1 "android.intent.action.MAIN"
 */

const APP_PATH = process.env.APP_PATH || path.join(__dirname, 'apps', 'uniqlo.apk');
// Fill these in once you know them (see comment above). Example placeholders:
const APP_PACKAGE = process.env.APP_PACKAGE || ''; // e.g. 'com.uniqlo.xxx'
const APP_ACTIVITY = process.env.APP_ACTIVITY || ''; // e.g. 'com.uniqlo.xxx.MainActivity'

// Prefer installing from apk unless an explicit package is provided.
const appCapabilities = APP_PACKAGE
  ? {
      'appium:appPackage': APP_PACKAGE,
      'appium:appActivity': APP_ACTIVITY,
      'appium:noReset': true, // keep app state (already installed)
    }
  : {
      'appium:app': APP_PATH,
    };

export const config: Options.Testrunner = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',

  specs: ['./test/specs/**/*.ts'],
  maxInstances: 1, // one emulator at a time to start with

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
      'appium:platformVersion': process.env.PLATFORM_VERSION || undefined,
      // Longer timeout: first launch + app grant dialogs can be slow.
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      ...appCapabilities,
    },
  ],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 3,

  // Auto-starts/stops the Appium server so you don't run it in a separate terminal.
  services: [
    [
      'appium',
      {
        args: { relaxedSecurity: true },
        command: 'appium',
      },
    ],
  ],

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120_000,
  },
};

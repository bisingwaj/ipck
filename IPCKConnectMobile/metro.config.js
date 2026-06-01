// Configuration Metro canonique pour Expo SDK 52.
// Étend `expo/metro-config` (recommandé) pour un bundling fiable côté EAS Build.
// Voir https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('react-native-background-timer/package.json');
const withVoice = (config, props = {}) => {
    const _props = props ? props : {};
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withVoice, pkg.name, pkg.version);
/// App settings — API URL, theme mode, persisted via shared_preferences.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

const _kBaseUrlKey = 'avai_api_base_url';
const _kThemeModeKey = 'theme_mode';

final settingsProvider =
    NotifierProvider<SettingsNotifier, AppSettings>(SettingsNotifier.new);

class AppSettings {
  const AppSettings({
    this.baseUrl = ApiConfig.defaultBaseUrl,
    this.themeMode = ThemeMode.system,
  });

  final String baseUrl;
  final ThemeMode themeMode;

  AppSettings copyWith({String? baseUrl, ThemeMode? themeMode}) {
    return AppSettings(
      baseUrl: baseUrl ?? this.baseUrl,
      themeMode: themeMode ?? this.themeMode,
    );
  }
}

class SettingsNotifier extends Notifier<AppSettings> {
  @override
  AppSettings build() {
    _load();
    return const AppSettings();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final baseUrl = prefs.getString(_kBaseUrlKey) ?? ApiConfig.defaultBaseUrl;
    final themeIndex = prefs.getInt(_kThemeModeKey) ?? 0;
    final themeMode = ThemeMode.values[themeIndex.clamp(0, 2)];
    state = AppSettings(baseUrl: baseUrl, themeMode: themeMode);
  }

  Future<void> setBaseUrl(String url) async {
    state = state.copyWith(baseUrl: url);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kBaseUrlKey, url);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = state.copyWith(themeMode: mode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_kThemeModeKey, mode.index);
  }
}

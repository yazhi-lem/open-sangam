/// Theme configuration — Material 3 with Sangam-inspired palette.
library;

import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  // Terracotta/bronze inspired by Sangam-era artifacts.
  static const Color _seedColor = Color(0xFF8D4E2A);
  static const Color _seedColorLight = Color(0xFFBF7352);

  static final ColorScheme _lightScheme = ColorScheme.fromSeed(
    seedColor: _seedColorLight,
    brightness: Brightness.light,
  );

  static final ColorScheme _darkScheme = ColorScheme.fromSeed(
    seedColor: _seedColor,
    brightness: Brightness.dark,
  );

  static final ThemeData light = ThemeData(
    useMaterial3: true,
    colorScheme: _lightScheme,
    appBarTheme: const AppBarTheme(
      centerTitle: true,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    ),
  );

  static final ThemeData dark = ThemeData(
    useMaterial3: true,
    colorScheme: _darkScheme,
    appBarTheme: const AppBarTheme(
      centerTitle: true,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    ),
  );

  /// Tiṇai color mapping for verse badges.
  static const Map<String, Color> tinaiColors = {
    'kurinji': Color(0xFF7C3AED), // violet
    'mullai': Color(0xFF15803D), // green
    'marutam': Color(0xFF0D9488), // teal
    'neytal': Color(0xFF2563EB), // blue
    'palai': Color(0xFFB45309), // amber
    'puram': Color(0xFFE11D48), // rose
  };

  static Color tinaiColor(String? tinai) {
    if (tinai == null) return Colors.grey;
    return tinaiColors[tinai] ?? Colors.grey;
  }
}

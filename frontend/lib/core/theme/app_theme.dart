import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryColor = Color.fromARGB(255, 68, 102, 123);
  static const Color accentColor = Color(0xFF0EA5A4);
  static const Color neutralLight = Color(0xFFF8FAFC);
  static const Color neutralBorder = Color(0xFFE2E8F0);
  static const Color neutralText = Color(0xFF0F172A);
  static const BorderRadius _radius8 = BorderRadius.all(Radius.circular(8));
  static const BorderRadius _radius10 = BorderRadius.all(Radius.circular(10));
  static const BorderRadius _radius12 = BorderRadius.all(Radius.circular(12));

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryColor,
      primary: primaryColor,
      secondary: accentColor,
      surface: Colors.white,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      fontFamily: 'Inter',
      textTheme: const TextTheme(
        headlineSmall: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          height: 1.2,
        ),
        titleLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          height: 1.25,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          height: 1.35,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.45,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.4,
        ),
        labelMedium: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          height: 1.3,
        ),
      ),
      scaffoldBackgroundColor: neutralLight,
      cardTheme: const CardThemeData(
        elevation: 0,
        shadowColor: Color(0x120F172A),
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: _radius12,
          side: BorderSide(color: neutralBorder, width: 1),
        ),
      ),
      shadowColor: const Color(0x120F172A),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, 48),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          shape: RoundedRectangleBorder(
            borderRadius: _radius10,
          ),
        ).copyWith(
          animationDuration: const Duration(milliseconds: 120),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 48),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: _radius10),
          side: const BorderSide(color: neutralBorder, width: 1),
        ).copyWith(
          animationDuration: const Duration(milliseconds: 120),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        isDense: true,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: _radius10,
          borderSide: const BorderSide(color: neutralBorder, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: _radius10,
          borderSide: const BorderSide(color: neutralBorder, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: _radius10,
          borderSide: const BorderSide(color: primaryColor, width: 1),
        ),
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        foregroundColor: neutralText,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.fuchsia: FadeForwardsPageTransitionsBuilder(),
        },
      ),
    );
  }
}

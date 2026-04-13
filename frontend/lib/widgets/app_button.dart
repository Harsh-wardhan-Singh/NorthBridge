import 'package:flutter/material.dart';

enum AppButtonVariant {
  primary,
  secondary,
}

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isFullWidth = true,
    this.variant = AppButtonVariant.primary,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isFullWidth;
  final AppButtonVariant variant;

  @override
  Widget build(BuildContext context) {
    final button = _PressAnimatedButton(
      child: variant == AppButtonVariant.secondary
          ? OutlinedButton(
              onPressed: onPressed,
              child: Text(label),
            )
          : FilledButton(
              onPressed: onPressed,
              child: Text(label),
            ),
    );

    if (!isFullWidth) {
      return button;
    }

    return SizedBox(
      width: double.infinity,
      child: button,
    );
  }
}

class _PressAnimatedButton extends StatefulWidget {
  const _PressAnimatedButton({required this.child});

  final Widget child;

  @override
  State<_PressAnimatedButton> createState() => _PressAnimatedButtonState();
}

class _PressAnimatedButtonState extends State<_PressAnimatedButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapCancel: () => setState(() => _isPressed = false),
      onTapUp: (_) => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.985 : 1,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

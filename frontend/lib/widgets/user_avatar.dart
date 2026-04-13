import 'package:flutter/material.dart';

class UserAvatar extends StatelessWidget {
  const UserAvatar({
    super.key,
    required this.name,
    this.imageUrl = '',
    this.radius = 16,
  });

  final String name;
  final String imageUrl;
  final double radius;

  String get _initials {
    final trimmed = name.trim();
    if (trimmed.isEmpty) {
      return 'U';
    }

    final parts = trimmed.split(RegExp(r'\s+'));
    if (parts.length == 1) {
      return parts.first.substring(0, 1).toUpperCase();
    }

    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canLoadImage = imageUrl.trim().isNotEmpty;

    return CircleAvatar(
      radius: radius,
      backgroundColor: theme.colorScheme.surfaceContainerHighest,
      foregroundImage: canLoadImage ? NetworkImage(imageUrl.trim()) : null,
      child: canLoadImage
          ? null
          : Text(
              _initials,
              style: theme.textTheme.labelLarge,
            ),
    );
  }
}
